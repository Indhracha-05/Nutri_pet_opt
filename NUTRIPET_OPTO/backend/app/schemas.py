"""
Pydantic Schemas for NutriPet_Opto API.

Defines request/response models for data validation and API documentation.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Shared Models ---

class SpeciesRead(BaseModel):
    species_id: int
    name: str
    digestive_type: str
    protein_requirement: float
    fat_tolerance: float
    known_sensitivities: Optional[str] = None

    class Config:
        from_attributes = True


class FoodRead(BaseModel):
    food_id: int
    name: str
    category: str
    protein_g: float
    fat_g: float
    carbs_g: float
    calories: float
    ingredient_cost_usd: float

    class Config:
        from_attributes = True


# --- Analysis Models ---

class AnalysisRequest(BaseModel):
    species_name: str = Field(..., description="Target pet species (e.g., 'Dog', 'Cat')")
    food_name: str = Field(..., description="Food item to analyze (must exist in DB)")
    
    # Optional overrides for "what-if" scenarios
    custom_amount_g: Optional[float] = Field(100.0, description="Serving size in grams (default 100g)")


class CategoryAnalysisRequest(BaseModel):
    species_name: str = Field(..., description="Target pet species (e.g., 'Dog', 'Cat')")
    category: str = Field(..., description="Food category to analyze (e.g., 'Meat')")
    limit: Optional[int] = Field(5, description="Number of popular foods to return")


class TopFactor(BaseModel):
    feature: str
    importance: float
    value: float


class AnalysisResponse(BaseModel):
    # Core Results
    health_grade: str = Field(..., description="A-F Health Grade")
    predicted_caloric_density: float = Field(..., description="0.0-1.0 Caloric Density Score")
    confidence: float = Field(..., description="Model confidence score (0-1)")

    # Safety
    is_toxic: bool = Field(False, description="True if food is toxic for species")
    toxicity_reason: Optional[str] = Field(None, description="Toxic compound name if present")
    severity: Optional[str] = Field(None, description="Severity level (low, moderate, high, lethal)")

    # Explanation
    explanation_text: str = Field(..., description="Human-readable explanation of the result")
    top_factors: List[TopFactor] = Field(..., description="Top influencing factors for the grade")

    # Data for Frontend Visualization
    nutritional_profile: Dict[str, float] = Field(..., description="Raw nutritional values per serving")
    graph_features: Dict[str, float] = Field(..., description="Normalized feature scores (0-1) for Radar Chart")
    graph_data: Optional[Dict[str, Any]] = Field(None, description="Cytoscape JSON elements for graph visualization")

    class Config:
        from_attributes = True


# --- Meal Planner Models ---

class MealPlanRequest(BaseModel):
    species_name: str = Field(..., description="Target pet species (e.g., 'Dog', 'Cat', 'Rabbit')")
    pet_weight_kg: float = Field(..., gt=0, description="Pet body weight in kg (e.g., 10.0)")
    activity_level: Optional[str] = Field("normal", description="inactive, normal, active, or working")
    target_calories_override: Optional[float] = Field(None, description="Optional manual daily calorie target")
    available_ingredients: List[str] = Field(..., min_length=1, description="List of raw food ingredients available to the user")
    days: Optional[int] = Field(1, ge=1, le=7, description="Number of days to plan (1 to 7)")
    meals_per_day: Optional[int] = Field(2, ge=1, le=3, description="Number of meals per day (1, 2, or 3)")


class IngredientPortion(BaseModel):
    food_id: Optional[int] = None
    food_name: str
    category: str
    grams: float
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float
    cost_usd: float
    percent_of_meal: float


class DayMealPortion(BaseModel):
    food_name: str
    category: str
    grams: float
    calories: float
    protein_g: float
    fat_g: float
    carbs_g: float


class DayMeal(BaseModel):
    meal_name: str
    ratio: float
    total_grams: float
    total_calories: float
    portions: List[DayMealPortion]


class DayPlan(BaseModel):
    day_number: int
    total_grams: float
    total_calories: float
    macro_summary: Dict[str, float]
    ingredients: List[IngredientPortion]
    meals: List[DayMeal]


class GroceryItem(BaseModel):
    food_name: str
    category: str
    total_grams: float
    total_cost_usd: float


class ExcludedToxicFood(BaseModel):
    food_name: str
    toxic_compound: str
    severity: str


class MealPlanResponse(BaseModel):
    species_name: str
    pet_weight_kg: float
    activity_level: str
    rer_kcal: float
    mer_kcal: float
    daily_target_calories: float
    days_planned: int
    meals_per_day: int
    warnings: List[str]
    excluded_toxic_foods: List[ExcludedToxicFood]
    daily_plans: List[DayPlan]
    grocery_list: List[GroceryItem]
    total_estimated_cost_usd: float


# --- Pet Profiles, Diets & Vet Visit Schemas ---

class PetDietCreate(BaseModel):
    diet_name: str = Field(..., description="Name or title of the diet, e.g. 'Daily Chicken & Veggie Raw Blend'")
    diet_type: Optional[str] = Field("Mixed", description="Raw, Wet Food, Dry Kibble, Home-Cooked, Prescription, Mixed")
    daily_calories_target: Optional[float] = Field(None, description="Target daily kcal")
    meals_per_day: Optional[int] = Field(2, ge=1, le=5)
    schedule_time: Optional[str] = Field(None, description="Feeding schedule, e.g. '08:00 AM & 06:00 PM'")
    ingredients_json: Optional[str] = Field(None, description="JSON array or text breakdown of foods and portions")
    is_active: Optional[bool] = Field(True, description="True if current active diet")
    notes: Optional[str] = Field(None, description="Preparation or feeding notes")


class PetDietRead(BaseModel):
    diet_id: int
    pet_id: int
    diet_name: str
    diet_type: str
    daily_calories_target: Optional[float] = None
    meals_per_day: Optional[int] = 2
    schedule_time: Optional[str] = None
    ingredients_json: Optional[str] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class VetVisitCreate(BaseModel):
    visit_date: str = Field(..., description="Date of visit YYYY-MM-DD")
    reason: str = Field(..., description="Reason for visit, e.g. 'Annual Checkup', 'Vaccination Booster'")
    clinic_name: Optional[str] = Field(None, description="Clinic or Hospital name")
    veterinarian: Optional[str] = Field(None, description="Attending veterinarian")
    weight_kg: Optional[float] = Field(None, description="Weight recorded at visit in kg")
    diagnosis: Optional[str] = Field(None, description="Clinical findings or diagnosis")
    treatment_plan: Optional[str] = Field(None, description="Administered treatments or recommendations")
    medications: Optional[str] = Field(None, description="Prescribed medications, dosage, frequency")
    next_visit_date: Optional[str] = Field(None, description="Follow-up or reminder date YYYY-MM-DD")
    cost_usd: Optional[float] = Field(None, description="Total visit cost in USD")


class VetVisitRead(BaseModel):
    visit_id: int
    pet_id: int
    visit_date: str
    reason: str
    clinic_name: Optional[str] = None
    veterinarian: Optional[str] = None
    weight_kg: Optional[float] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    medications: Optional[str] = None
    next_visit_date: Optional[str] = None
    cost_usd: Optional[float] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class PetCreate(BaseModel):
    name: str = Field(..., description="Pet name")
    species_name: str = Field(..., description="Species: Dog, Cat, Rabbit, etc.")
    breed: Optional[str] = Field(None, description="Pet breed")
    age_years: Optional[float] = Field(None, description="Age in years")
    weight_kg: float = Field(..., gt=0, description="Current weight in kg")
    activity_level: Optional[str] = Field("normal", description="inactive, normal, active, working")
    avatar_emoji: Optional[str] = Field("🐾", description="Emoji icon for avatar")
    allergies_sensitivities: Optional[str] = Field(None, description="Known food allergies or sensitivities")
    medical_notes: Optional[str] = Field(None, description="General health or medical conditions")


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species_name: Optional[str] = None
    breed: Optional[str] = None
    age_years: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[str] = None
    avatar_emoji: Optional[str] = None
    allergies_sensitivities: Optional[str] = None
    medical_notes: Optional[str] = None


class PetSummaryRead(BaseModel):
    pet_id: int
    name: str
    species_name: str
    breed: Optional[str] = None
    age_years: Optional[float] = None
    weight_kg: float
    activity_level: str
    avatar_emoji: Optional[str] = "🐾"
    allergies_sensitivities: Optional[str] = None
    medical_notes: Optional[str] = None
    rer_kcal: float
    mer_kcal: float
    active_diet_name: Optional[str] = None
    diet_count: int = 0
    vet_visit_count: int = 0
    latest_visit_date: Optional[str] = None
    next_visit_date: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class PetDetailRead(BaseModel):
    pet_id: int
    name: str
    species_name: str
    breed: Optional[str] = None
    age_years: Optional[float] = None
    weight_kg: float
    activity_level: str
    avatar_emoji: Optional[str] = "🐾"
    allergies_sensitivities: Optional[str] = None
    medical_notes: Optional[str] = None
    rer_kcal: float
    mer_kcal: float
    diets: List[PetDietRead] = []
    vet_visits: List[VetVisitRead] = []
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


