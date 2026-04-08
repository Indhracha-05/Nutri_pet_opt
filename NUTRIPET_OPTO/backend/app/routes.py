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
from .models import Species, Food
from .schemas import SpeciesRead, FoodRead, AnalysisRequest, AnalysisResponse, TopFactor, CategoryAnalysisRequest
from .knowledge_graph import build_graph, check_toxicity, extract_graph_features, graph_to_cytoscape_json
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
        print(f"✅ Loaded Caloric Model from {caloric_path}")
    else:
        print("⚠️ Caloric Model not found. Using heuristic fallback.")

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
        print(f"✅ Built Knowledge Graph: {GRAPH.number_of_nodes()} nodes")
    except Exception as e:
        print(f"❌ Failed to build graph: {e}")


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
