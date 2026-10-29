"""
API Routes for NutriPet_Opto.

Endpoints:
- GET /species: List all species
- GET /foods: List all foods (supports ?search=&category=&diet= filters)
- POST /analyze: Main analysis endpoint (Graph + ML)
- POST /analyze/category: Analyze top foods in a category for a species
"""
import os
import sys
import joblib
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

# Add backend root to path to import ml modules
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from .database import get_db
from .models import Species, Food, Pet, PetDiet, VetVisit
from .schemas import (
    SpeciesRead, FoodRead, AnalysisRequest, AnalysisResponse, 
    TopFactor, CategoryAnalysisRequest, MealPlanRequest, MealPlanResponse,
    PetDietCreate, PetDietRead, VetVisitCreate, VetVisitRead,
    PetCreate, PetUpdate, PetSummaryRead, PetDetailRead
)
from .knowledge_graph import build_graph, check_toxicity, extract_graph_features, graph_to_cytoscape_json
from .planner import generate_plan, calculate_energy_requirements
from ml.explainability import explain
from ml.generate_dataset import compute_caloric_density as compute_caloric_heuristic

router = APIRouter()

# Global variables for models and graph
ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ml")
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

CALORIC_MODEL = None
GRAPH = None

# Diet type -> allowed food categories mapping
DIET_CATEGORY_MAP = {
    "carnivore": ["Meat", "Seafood", "Dairy/Egg", "Other", "Toxic"],
    "herbivore": ["Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other", "Toxic"],
    "omnivore":  ["Meat", "Seafood", "Dairy/Egg", "Vegetable", "Fruit", "Grain/Bean", "Seed/Nut", "Other", "Toxic"],
}


def load_resources():
    """Load ML models and Build Knowledge Graph on startup."""
    global CALORIC_MODEL, GRAPH
    
    # Load Caloric Model
    caloric_path = os.path.join(ML_DIR, "caloric_model.pkl")
    if os.path.exists(caloric_path):
        CALORIC_MODEL = joblib.load(caloric_path)
        print(f"[OK] Loaded Caloric Model from {caloric_path}")
    else:
        print("[WARN] Caloric Model not found. Using heuristic fallback.")

    # Build Graph
    try:
        species_df = pd.read_csv(os.path.join(DATA_DIR, "species.csv"))
        foods_df = pd.read_csv(os.path.join(DATA_DIR, "foods.csv"))
        toxicity_df = pd.read_csv(os.path.join(DATA_DIR, "toxicity.csv"))
        
        GRAPH = build_graph(
            species_df.to_dict("records"),
            foods_df.to_dict("records"),
            toxicity_df.to_dict("records")
        )
        print(f"[OK] Built Knowledge Graph: {GRAPH.number_of_nodes()} nodes")
    except Exception as e:
        print(f"[ERROR] Failed to build graph: {e}")


load_resources()


def _run_analysis(species: Species, food: Food, db: Session) -> AnalysisResponse:
    """Internal helper that runs the full AI analysis pipeline for a species+food pair."""
    is_toxic, toxic_compound, severity = check_toxicity(GRAPH, species.name, food.name)
    features = extract_graph_features(GRAPH, species.name, food.name)

    if is_toxic:
        grade = "F"
        confidence = 1.0
        explanation = f"⚠️ DANGEROUS: {food.name} contains {toxic_compound} which is {severity} for {species.name}s."
        top_factors = [{"feature": "toxin_flag", "importance": 1.0, "value": 1.0}]
    else:
        result = explain(features)
        grade = result["grade"]
        confidence = result["confidence"]
        explanation = result["explanation"]
        top_factors = result["top_factors"]

    if CALORIC_MODEL:
        feature_names = CALORIC_MODEL["feature_names"]
        model = CALORIC_MODEL["model"]
        X = [features.get(name, 0.0) for name in feature_names]
        predicted_density = float(model.predict([X])[0])
    else:
        food_dict = {
            "calories": food.calories,
            "bioavailability_score": food.bioavailability_score,
            "ingredient_cost_usd": food.ingredient_cost_usd
        }
        predicted_density = compute_caloric_heuristic(food_dict)

    graph_json = graph_to_cytoscape_json(GRAPH, species.name, food.name)

    return AnalysisResponse(
        health_grade=grade,
        predicted_caloric_density=predicted_density,
        confidence=confidence,
        is_toxic=is_toxic,
        toxicity_reason=toxic_compound,
        severity=severity,
        explanation_text=explanation,
        top_factors=[TopFactor(**tf) for tf in top_factors],
        nutritional_profile={
            "protein_g": food.protein_g,
            "fat_g": food.fat_g,
            "carbs_g": food.carbs_g,
            "calories": food.calories,
            "sugar_g": food.sugar_g
        },
        graph_features=features,
        graph_data=graph_json
    )


@router.get("/species", response_model=List[SpeciesRead])
def get_species(db: Session = Depends(get_db)):
    """List all available pet species."""
    return db.query(Species).all()


@router.get("/foods", response_model=List[FoodRead])
def get_foods(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Search term for food name"),
    category: Optional[str] = Query(None, description="Filter by food category"),
    diet: Optional[str] = Query(None, description="Filter by pet diet type (carnivore/herbivore/omnivore)"),
):
    """
    List foods with optional filters:
    - search: partial name match
    - category: exact category match (e.g. Meat, Fruit)
    - diet: filter by allowed categories for a diet type
    """
    query = db.query(Food)

    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))

    if category:
        query = query.filter(Food.category == category)
    elif diet:
        diet_lower = diet.lower()
        allowed_cats = DIET_CATEGORY_MAP.get(diet_lower, list(DIET_CATEGORY_MAP["omnivore"]))
        query = query.filter(Food.category.in_(allowed_cats))

    return query.order_by(Food.name).all()


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Return all distinct food categories."""
    rows = db.query(Food.category).distinct().order_by(Food.category).all()
    return [r[0] for r in rows if r[0]]


@router.post("/analyze", response_model=AnalysisResponse)
def analyze_food(request: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze food for a specific species.
    1. Check Toxicity (Graph)
    2. Extract Features (Graph)
    3. Predict Health Grade (ML Classifier)
    4. Predict Caloric Density (ML Regressor)
    5. Generate Explanation (Explainability Engine)
    """
    species = db.query(Species).filter(Species.name == request.species_name).first()
    food = db.query(Food).filter(Food.name == request.food_name).first()

    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    return _run_analysis(species, food, db)


@router.post("/analyze/category")
def analyze_category(request: CategoryAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze a food category for a specific species.
    Returns AI analysis for the top N foods in that category ranked by bioavailability.
    If the species is a carnivore, only 'Meat'/'Seafood' categories are relevant, etc.
    """
    species = db.query(Species).filter(Species.name == request.species_name).first()
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")

    limit = request.limit or 5

    # Get top foods in the category (ranked by bioavailability_score descending)
    foods = (
        db.query(Food)
        .filter(Food.category == request.category)
        .order_by(Food.bioavailability_score.desc())
        .limit(limit)
        .all()
    )

    if not foods:
        raise HTTPException(status_code=404, detail=f"No foods found in category '{request.category}'")

    results = []
    for food in foods:
        analysis = _run_analysis(species, food, db)
        results.append({
            "food_name": food.name,
            "category": food.category,
            "analysis": analysis.dict()
        })

    return {
        "species": species.name,
        "diet_type": species.digestive_type,
        "category": request.category,
        "results": results
    }


@router.post("/evaluate", response_model=AnalysisResponse, tags=["Rubric Compliance"])
def evaluate_food(request: AnalysisRequest, db: Session = Depends(get_db)):
    """
    Evaluate food for a specific species.
    (Alias for /analyze to match rubric requirement: POST /evaluate)
    """
    return analyze_food(request, db)


@router.post("/plan", response_model=MealPlanResponse, tags=["Meal Planner"])
def create_meal_plan(request: MealPlanRequest, db: Session = Depends(get_db)):
    """
    Generate a day-wise meal plan with exact grams and calories per raw ingredient
    based on pet species, body weight, activity level, and available ingredients.
    """
    try:
        plan = generate_plan(
            species_name=request.species_name,
            weight_kg=request.pet_weight_kg,
            activity_level=request.activity_level or "normal",
            target_calories_override=request.target_calories_override,
            available_ingredient_names=request.available_ingredients,
            days=request.days or 1,
            meals_per_day=request.meals_per_day or 2,
            db=db,
            graph=GRAPH
        )
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan: {str(e)}")


# ==============================================================================
# PET PROFILES, DIETS & VET VISITS ENDPOINTS
# ==============================================================================

def _seed_sample_pets_if_empty(db: Session):
    """Seed sample pet profiles with realistic diets and clinical records if table is empty."""
    if db.query(Pet).first():
        return

    now_str = "2026-10-23"

    sample_pets = [
        {
            "name": "Luna",
            "species_name": "Dog",
            "breed": "Golden Retriever",
            "age_years": 3.0,
            "weight_kg": 28.5,
            "activity_level": "active",
            "avatar_emoji": "🐕",
            "allergies_sensitivities": "Corn, Grain Fillers, Artificial Preservatives",
            "medical_notes": "High energy sporting dog. Enjoys agility training. Monitored for hip wellness.",
            "created_at": now_str,
            "diets": [
                {
                    "diet_name": "Active Canine Raw Chicken & Pumpkin Regimen",
                    "diet_type": "Raw",
                    "daily_calories_target": 1280.0,
                    "meals_per_day": 2,
                    "schedule_time": "07:30 AM & 06:00 PM",
                    "ingredients_json": '[{"food_name":"Chicken Breast","grams":420,"category":"Meat","calories":693},{"food_name":"Pumpkin","grams":160,"category":"Vegetable","calories":41},{"food_name":"Carrot","grams":80,"category":"Vegetable","calories":33},{"food_name":"Egg","grams":50,"category":"Dairy/Egg","calories":78}]',
                    "is_active": 1,
                    "notes": "Ensure meat is thawed overnight in refrigerator. Add 1 pump wild salmon oil in morning meal.",
                    "created_at": "2026-09-18"
                }
            ],
            "vet_visits": [
                {
                    "visit_date": "2026-09-15",
                    "reason": "Annual Comprehensive Wellness & Rabies Booster",
                    "clinic_name": "Oak Valley Animal Hospital",
                    "veterinarian": "Dr. Elena Vance, DVM",
                    "weight_kg": 28.5,
                    "diagnosis": "Excellent cardiopulmonary health. Ideal Body Condition Score (BCS 5/9). Strong musculoskeletal reflexes.",
                    "treatment_plan": "Administered 3-year Rabies booster and DHPP core vaccine. Recommended biannual dental assessment.",
                    "medications": "Simparica Trio (monthly heartworm/tick prevention)",
                    "next_visit_date": "2027-09-15",
                    "cost_usd": 165.0,
                    "created_at": "2026-09-15"
                },
                {
                    "visit_date": "2026-04-10",
                    "reason": "Routine Dental Examination & Scale",
                    "clinic_name": "Oak Valley Animal Hospital",
                    "veterinarian": "Dr. Elena Vance, DVM",
                    "weight_kg": 28.2,
                    "diagnosis": "Mild supra-gingival calculus on upper maxillary molars. No periodontal pockets.",
                    "treatment_plan": "Prophylactic ultrasonic scaling and polish under light sedation.",
                    "medications": "Chlorhexidine oral rinse (twice weekly)",
                    "next_visit_date": "2026-09-15",
                    "cost_usd": 210.0,
                    "created_at": "2026-04-10"
                }
            ]
        },
        {
            "name": "Milo",
            "species_name": "Cat",
            "breed": "British Shorthair",
            "age_years": 2.0,
            "weight_kg": 4.6,
            "activity_level": "normal",
            "avatar_emoji": "🐈",
            "allergies_sensitivities": "Dairy, Lactose, Excessive Carbohydrates",
            "medical_notes": "Strict obligate carnivore. Indoor cat. Water fountain provided to encourage urinary hydration.",
            "created_at": now_str,
            "diets": [
                {
                    "diet_name": "Feline Carnivore Lean Turkey & Salmon Formula",
                    "diet_type": "Home-Cooked",
                    "daily_calories_target": 225.0,
                    "meals_per_day": 2,
                    "schedule_time": "08:00 AM & 07:00 PM",
                    "ingredients_json": '[{"food_name":"Turkey Breast","grams":115,"category":"Meat","calories":155},{"food_name":"Salmon","grams":40,"category":"Seafood","calories":83}]',
                    "is_active": 1,
                    "notes": "Steamed gently without seasoning. Taurine supplementation mixed into broth.",
                    "created_at": "2026-08-22"
                }
            ],
            "vet_visits": [
                {
                    "visit_date": "2026-08-20",
                    "reason": "FVRCP Booster & Microchip Verification",
                    "clinic_name": "Metro Feline Medical Center",
                    "veterinarian": "Dr. Marcus Chen, BVSc",
                    "weight_kg": 4.6,
                    "diagnosis": "Normal coat and hydration. Clear corneas, clean ear canals, heart rate and rhythm normal.",
                    "treatment_plan": "Administered subcutaneous FVRCP vaccination. Scanned RFID microchip successfully.",
                    "medications": "Revolution Plus topical solution (spot-on)",
                    "next_visit_date": "2027-08-20",
                    "cost_usd": 125.0,
                    "created_at": "2026-08-20"
                }
            ]
        },
        {
            "name": "Barnaby",
            "species_name": "Rabbit",
            "breed": "Holland Lop",
            "age_years": 1.5,
            "weight_kg": 1.9,
            "activity_level": "normal",
            "avatar_emoji": "🐇",
            "allergies_sensitivities": "Strictly no iceberg lettuce, avocado, or high-sugar fruit",
            "medical_notes": "Free-roam indoor bunny. High fiber grass hay required 24/7 for dental wear and cecal motility.",
            "created_at": now_str,
            "diets": [
                {
                    "diet_name": "High-Fiber Timothy Forage & Leafy Greens Protocol",
                    "diet_type": "Raw",
                    "daily_calories_target": 140.0,
                    "meals_per_day": 2,
                    "schedule_time": "08:00 AM Greens & Evening Pellets",
                    "ingredients_json": '[{"food_name":"Spinach","grams":40,"category":"Vegetable","calories":9},{"food_name":"Carrot","grams":20,"category":"Vegetable","calories":8}]',
                    "is_active": 1,
                    "notes": "Unlimited fresh 1st cut Timothy Hay offered continuously alongside daily fresh greens.",
                    "created_at": "2026-07-10"
                }
            ],
            "vet_visits": [
                {
                    "visit_date": "2026-07-05",
                    "reason": "Exotic Wellness & Incisor Alignment Check",
                    "clinic_name": "Avian & Exotic Pet Care",
                    "veterinarian": "Dr. Chloe Adams, DVM",
                    "weight_kg": 1.9,
                    "diagnosis": "Normal incisor and molar occlusion. Healthy cecotrope production. Clear tympanic membranes.",
                    "treatment_plan": "Routine nail trim performed. Encouraged maintaining 85%+ coarse hay intake.",
                    "medications": "Oxbow Digestive Support papaya enzyme chew",
                    "next_visit_date": "2027-01-05",
                    "cost_usd": 90.0,
                    "created_at": "2026-07-05"
                }
            ]
        }
    ]

    for p_data in sample_pets:
        diets_data = p_data.pop("diets")
        visits_data = p_data.pop("vet_visits")
        pet = Pet(**p_data)
        db.add(pet)
        db.flush()

        for d in diets_data:
            diet = PetDiet(pet_id=pet.pet_id, **d)
            db.add(diet)

        for v in visits_data:
            visit = VetVisit(pet_id=pet.pet_id, **v)
            db.add(visit)

    db.commit()


@router.get("/pets", response_model=List[PetSummaryRead], tags=["Pet Profiles"])
def list_pets(db: Session = Depends(get_db)):
    """List all registered pet profiles with metabolic requirements and clinical status."""
    _seed_sample_pets_if_empty(db)
    pets = db.query(Pet).order_by(Pet.pet_id.asc()).all()
    summaries = []

    for p in pets:
        rer, mer = calculate_energy_requirements(p.species_name, p.weight_kg, p.activity_level)
        active_diet = next((d for d in p.diets if d.is_active == 1), None)
        latest_visit = p.vet_visits[0] if p.vet_visits else None
        next_visit = next((v.next_visit_date for v in p.vet_visits if v.next_visit_date), None)

        summaries.append(PetSummaryRead(
            pet_id=p.pet_id,
            name=p.name,
            species_name=p.species_name,
            breed=p.breed,
            age_years=p.age_years,
            weight_kg=p.weight_kg,
            activity_level=p.activity_level,
            avatar_emoji=p.avatar_emoji or "🐾",
            allergies_sensitivities=p.allergies_sensitivities,
            medical_notes=p.medical_notes,
            rer_kcal=round(rer, 1),
            mer_kcal=round(mer, 1),
            active_diet_name=active_diet.diet_name if active_diet else None,
            diet_count=len(p.diets),
            vet_visit_count=len(p.vet_visits),
            latest_visit_date=latest_visit.visit_date if latest_visit else None,
            next_visit_date=next_visit,
            created_at=p.created_at
        ))

    return summaries


@router.post("/pets", response_model=PetDetailRead, tags=["Pet Profiles"])
def create_pet(pet_in: PetCreate, db: Session = Depends(get_db)):
    """Register a new pet profile."""
    from datetime import date
    new_pet = Pet(
        name=pet_in.name,
        species_name=pet_in.species_name,
        breed=pet_in.breed,
        age_years=pet_in.age_years,
        weight_kg=pet_in.weight_kg,
        activity_level=pet_in.activity_level or "normal",
        avatar_emoji=pet_in.avatar_emoji or "🐾",
        allergies_sensitivities=pet_in.allergies_sensitivities,
        medical_notes=pet_in.medical_notes,
        created_at=date.today().isoformat()
    )
    db.add(new_pet)
    db.commit()
    db.refresh(new_pet)

    rer, mer = calculate_energy_requirements(new_pet.species_name, new_pet.weight_kg, new_pet.activity_level)

    return PetDetailRead(
        pet_id=new_pet.pet_id,
        name=new_pet.name,
        species_name=new_pet.species_name,
        breed=new_pet.breed,
        age_years=new_pet.age_years,
        weight_kg=new_pet.weight_kg,
        activity_level=new_pet.activity_level,
        avatar_emoji=new_pet.avatar_emoji or "🐾",
        allergies_sensitivities=new_pet.allergies_sensitivities,
        medical_notes=new_pet.medical_notes,
        rer_kcal=round(rer, 1),
        mer_kcal=round(mer, 1),
        diets=[],
        vet_visits=[],
        created_at=new_pet.created_at
    )


@router.get("/pets/notifications/summary", tags=["Pet Profiles"])
def get_pet_notifications_summary(db: Session = Depends(get_db)):
    """Aggregated notifications for upcoming/overdue vet visits and daily meal schedules."""
    from datetime import date, datetime
    today = date.today()
    today_str = today.isoformat()

    pets = db.query(Pet).all()

    vet_reminders = []
    meal_reminders = []

    for pet in pets:
        # 1. Vet Visits
        for v in pet.vet_visits:
            if v.next_visit_date:
                try:
                    target_date = datetime.strptime(v.next_visit_date.strip(), "%Y-%m-%d").date()
                    days_until = (target_date - today).days

                    if days_until < 0:
                        status = "overdue"
                        severity = "critical"
                    elif days_until == 0:
                        status = "today"
                        severity = "warning"
                    elif days_until <= 7:
                        status = "upcoming_week"
                        severity = "upcoming"
                    elif days_until <= 30:
                        status = "upcoming_month"
                        severity = "info"
                    else:
                        status = "future"
                        severity = "low"

                    vet_reminders.append({
                        "id": f"vet-{v.visit_id}",
                        "visit_id": v.visit_id,
                        "pet_id": pet.pet_id,
                        "pet_name": pet.name,
                        "species_name": pet.species_name,
                        "avatar_emoji": pet.avatar_emoji or "🐾",
                        "reason": v.reason,
                        "clinic_name": v.clinic_name,
                        "veterinarian": v.veterinarian,
                        "next_visit_date": v.next_visit_date,
                        "days_until": days_until,
                        "status": status,
                        "severity": severity,
                    })
                except Exception:
                    continue

        # 2. Active Meal Regimens
        for d in pet.diets:
            if d.is_active:
                meal_reminders.append({
                    "id": f"diet-{d.diet_id}",
                    "diet_id": d.diet_id,
                    "pet_id": pet.pet_id,
                    "pet_name": pet.name,
                    "species_name": pet.species_name,
                    "avatar_emoji": pet.avatar_emoji or "🐾",
                    "diet_name": d.diet_name,
                    "diet_type": d.diet_type,
                    "meals_per_day": d.meals_per_day,
                    "schedule_time": d.schedule_time or "08:00 AM, 06:00 PM",
                    "daily_calories_target": d.daily_calories_target,
                })

    # Sort vet reminders by days_until ascending (most urgent first)
    vet_reminders.sort(key=lambda x: x["days_until"])

    counts = {
        "overdue": sum(1 for r in vet_reminders if r["status"] == "overdue"),
        "today": sum(1 for r in vet_reminders if r["status"] == "today"),
        "upcoming_week": sum(1 for r in vet_reminders if r["status"] == "upcoming_week"),
        "total_vet_alerts": sum(1 for r in vet_reminders if r["status"] in ["overdue", "today", "upcoming_week"]),
        "active_meals": len(meal_reminders),
    }
    counts["total_active_alerts"] = counts["total_vet_alerts"] + counts["active_meals"]

    return {
        "today": today_str,
        "counts": counts,
        "vet_reminders": vet_reminders,
        "meal_reminders": meal_reminders,
    }


@router.get("/pets/{pet_id}", response_model=PetDetailRead, tags=["Pet Profiles"])
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    """Fetch complete pet profile with all active/past diets and veterinary visit records."""
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet profile not found")

    rer, mer = calculate_energy_requirements(pet.species_name, pet.weight_kg, pet.activity_level)

    diets_read = [
        PetDietRead(
            diet_id=d.diet_id,
            pet_id=d.pet_id,
            diet_name=d.diet_name,
            diet_type=d.diet_type,
            daily_calories_target=d.daily_calories_target,
            meals_per_day=d.meals_per_day,
            schedule_time=d.schedule_time,
            ingredients_json=d.ingredients_json,
            is_active=bool(d.is_active),
            notes=d.notes,
            created_at=d.created_at
        )
        for d in pet.diets
    ]

    visits_read = [
        VetVisitRead(
            visit_id=v.visit_id,
            pet_id=v.pet_id,
            visit_date=v.visit_date,
            reason=v.reason,
            clinic_name=v.clinic_name,
            veterinarian=v.veterinarian,
            weight_kg=v.weight_kg,
            diagnosis=v.diagnosis,
            treatment_plan=v.treatment_plan,
            medications=v.medications,
            next_visit_date=v.next_visit_date,
            cost_usd=v.cost_usd,
            created_at=v.created_at
        )
        for v in pet.vet_visits
    ]

    return PetDetailRead(
        pet_id=pet.pet_id,
        name=pet.name,
        species_name=pet.species_name,
        breed=pet.breed,
        age_years=pet.age_years,
        weight_kg=pet.weight_kg,
        activity_level=pet.activity_level,
        avatar_emoji=pet.avatar_emoji or "🐾",
        allergies_sensitivities=pet.allergies_sensitivities,
        medical_notes=pet.medical_notes,
        rer_kcal=round(rer, 1),
        mer_kcal=round(mer, 1),
        diets=diets_read,
        vet_visits=visits_read,
        created_at=pet.created_at
    )


@router.put("/pets/{pet_id}", response_model=PetDetailRead, tags=["Pet Profiles"])
def update_pet(pet_id: int, pet_in: PetUpdate, db: Session = Depends(get_db)):
    """Update pet profile details."""
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet profile not found")

    update_data = pet_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(pet, field, val)

    db.commit()
    db.refresh(pet)
    return get_pet(pet_id, db)


@router.delete("/pets/{pet_id}", tags=["Pet Profiles"])
def delete_pet(pet_id: int, db: Session = Depends(get_db)):
    """Delete a pet profile along with its diets and clinical records."""
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet profile not found")

    db.delete(pet)
    db.commit()
    return {"message": "Pet profile deleted successfully", "pet_id": pet_id}


# --- Pet Diets Endpoints ---

@router.post("/pets/{pet_id}/diets", response_model=PetDietRead, tags=["Pet Diets"])
def add_pet_diet(pet_id: int, diet_in: PetDietCreate, db: Session = Depends(get_db)):
    """Add a new dietary plan to a pet profile."""
    from datetime import date
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    # If this diet is set as active, deactivate other diets for this pet
    if diet_in.is_active:
        db.query(PetDiet).filter(PetDiet.pet_id == pet_id).update({"is_active": 0})

    new_diet = PetDiet(
        pet_id=pet_id,
        diet_name=diet_in.diet_name,
        diet_type=diet_in.diet_type or "Mixed",
        daily_calories_target=diet_in.daily_calories_target,
        meals_per_day=diet_in.meals_per_day or 2,
        schedule_time=diet_in.schedule_time,
        ingredients_json=diet_in.ingredients_json,
        is_active=1 if diet_in.is_active else 0,
        notes=diet_in.notes,
        created_at=date.today().isoformat()
    )
    db.add(new_diet)
    db.commit()
    db.refresh(new_diet)

    return PetDietRead(
        diet_id=new_diet.diet_id,
        pet_id=new_diet.pet_id,
        diet_name=new_diet.diet_name,
        diet_type=new_diet.diet_type,
        daily_calories_target=new_diet.daily_calories_target,
        meals_per_day=new_diet.meals_per_day,
        schedule_time=new_diet.schedule_time,
        ingredients_json=new_diet.ingredients_json,
        is_active=bool(new_diet.is_active),
        notes=new_diet.notes,
        created_at=new_diet.created_at
    )


@router.put("/pets/{pet_id}/diets/{diet_id}", response_model=PetDietRead, tags=["Pet Diets"])
def update_pet_diet(pet_id: int, diet_id: int, diet_in: PetDietCreate, db: Session = Depends(get_db)):
    """Update a pet's diet regimen (or toggle active status)."""
    diet = db.query(PetDiet).filter(PetDiet.diet_id == diet_id, PetDiet.pet_id == pet_id).first()
    if not diet:
        raise HTTPException(status_code=404, detail="Diet record not found")

    if diet_in.is_active:
        db.query(PetDiet).filter(PetDiet.pet_id == pet_id).update({"is_active": 0})

    diet.diet_name = diet_in.diet_name
    diet.diet_type = diet_in.diet_type or diet.diet_type
    diet.daily_calories_target = diet_in.daily_calories_target
    diet.meals_per_day = diet_in.meals_per_day or diet.meals_per_day
    diet.schedule_time = diet_in.schedule_time
    diet.ingredients_json = diet_in.ingredients_json
    diet.is_active = 1 if diet_in.is_active else 0
    diet.notes = diet_in.notes

    db.commit()
    db.refresh(diet)

    return PetDietRead(
        diet_id=diet.diet_id,
        pet_id=diet.pet_id,
        diet_name=diet.diet_name,
        diet_type=diet.diet_type,
        daily_calories_target=diet.daily_calories_target,
        meals_per_day=diet.meals_per_day,
        schedule_time=diet.schedule_time,
        ingredients_json=diet.ingredients_json,
        is_active=bool(diet.is_active),
        notes=diet.notes,
        created_at=diet.created_at
    )


@router.delete("/pets/{pet_id}/diets/{diet_id}", tags=["Pet Diets"])
def delete_pet_diet(pet_id: int, diet_id: int, db: Session = Depends(get_db)):
    """Delete a diet record."""
    diet = db.query(PetDiet).filter(PetDiet.diet_id == diet_id, PetDiet.pet_id == pet_id).first()
    if not diet:
        raise HTTPException(status_code=404, detail="Diet record not found")

    db.delete(diet)
    db.commit()
    return {"message": "Diet deleted successfully", "diet_id": diet_id}


# --- Vet Visits Endpoints ---

@router.post("/pets/{pet_id}/vet-visits", response_model=VetVisitRead, tags=["Vet Visits"])
def add_vet_visit(pet_id: int, visit_in: VetVisitCreate, db: Session = Depends(get_db)):
    """Record a clinical veterinary visit for a pet."""
    from datetime import date
    pet = db.query(Pet).filter(Pet.pet_id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    new_visit = VetVisit(
        pet_id=pet_id,
        visit_date=visit_in.visit_date,
        reason=visit_in.reason,
        clinic_name=visit_in.clinic_name,
        veterinarian=visit_in.veterinarian,
        weight_kg=visit_in.weight_kg,
        diagnosis=visit_in.diagnosis,
        treatment_plan=visit_in.treatment_plan,
        medications=visit_in.medications,
        next_visit_date=visit_in.next_visit_date,
        cost_usd=visit_in.cost_usd,
        created_at=date.today().isoformat()
    )
    db.add(new_visit)

    # If visit recorded a fresh weight, optionally update the pet's current weight
    if visit_in.weight_kg and visit_in.weight_kg > 0:
        pet.weight_kg = visit_in.weight_kg

    db.commit()
    db.refresh(new_visit)

    return VetVisitRead(
        visit_id=new_visit.visit_id,
        pet_id=new_visit.pet_id,
        visit_date=new_visit.visit_date,
        reason=new_visit.reason,
        clinic_name=new_visit.clinic_name,
        veterinarian=new_visit.veterinarian,
        weight_kg=new_visit.weight_kg,
        diagnosis=new_visit.diagnosis,
        treatment_plan=new_visit.treatment_plan,
        medications=new_visit.medications,
        next_visit_date=new_visit.next_visit_date,
        cost_usd=new_visit.cost_usd,
        created_at=new_visit.created_at
    )


@router.put("/pets/{pet_id}/vet-visits/{visit_id}", response_model=VetVisitRead, tags=["Vet Visits"])
def update_vet_visit(pet_id: int, visit_id: int, visit_in: VetVisitCreate, db: Session = Depends(get_db)):
    """Update a veterinary visit entry."""
    visit = db.query(VetVisit).filter(VetVisit.visit_id == visit_id, VetVisit.pet_id == pet_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Vet visit record not found")

    visit.visit_date = visit_in.visit_date
    visit.reason = visit_in.reason
    visit.clinic_name = visit_in.clinic_name
    visit.veterinarian = visit_in.veterinarian
    visit.weight_kg = visit_in.weight_kg
    visit.diagnosis = visit_in.diagnosis
    visit.treatment_plan = visit_in.treatment_plan
    visit.medications = visit_in.medications
    visit.next_visit_date = visit_in.next_visit_date
    visit.cost_usd = visit_in.cost_usd

    db.commit()
    db.refresh(visit)

    return VetVisitRead(
        visit_id=visit.visit_id,
        pet_id=visit.pet_id,
        visit_date=visit.visit_date,
        reason=visit.reason,
        clinic_name=visit.clinic_name,
        veterinarian=visit.veterinarian,
        weight_kg=visit.weight_kg,
        diagnosis=visit.diagnosis,
        treatment_plan=visit.treatment_plan,
        medications=visit.medications,
        next_visit_date=visit.next_visit_date,
        cost_usd=visit.cost_usd,
        created_at=visit.created_at
    )


@router.delete("/pets/{pet_id}/vet-visits/{visit_id}", tags=["Vet Visits"])
def delete_vet_visit(pet_id: int, visit_id: int, db: Session = Depends(get_db)):
    """Delete a veterinary visit entry."""
    visit = db.query(VetVisit).filter(VetVisit.visit_id == visit_id, VetVisit.pet_id == pet_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Vet visit record not found")

    db.delete(visit)
    db.commit()
    return {"message": "Vet visit record deleted successfully", "visit_id": visit_id}


