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
