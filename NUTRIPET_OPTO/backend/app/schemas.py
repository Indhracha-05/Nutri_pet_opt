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

