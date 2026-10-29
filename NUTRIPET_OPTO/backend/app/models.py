"""
SQLAlchemy ORM models for NutriPet_Opto.

Tables:
  - Species: pet species with nutritional requirements
  - Food: food items with full nutritional profiles
  - Toxicity: known toxic food-species pairs
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class Species(Base):
    """Pet species with their nutritional requirements and tolerances."""
    __tablename__ = "species"

    species_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    protein_requirement = Column(Float, nullable=False, doc="Min protein % of diet")
    fat_tolerance = Column(Float, nullable=False, doc="Max fat % tolerable")
    carb_tolerance = Column(Float, nullable=False, doc="Max carb % tolerable")
    omega3_requirement = Column(Float, nullable=False, doc="Min omega-3 mg/kg body weight")
    omega6_requirement = Column(Float, nullable=False, doc="Min omega-6 mg/kg body weight")
    digestive_type = Column(String(50), nullable=False, doc="e.g. carnivore, omnivore, herbivore")
    known_sensitivities = Column(Text, nullable=True, doc="Comma-separated known sensitivities")

    toxicities = relationship("Toxicity", back_populates="species")

    def __repr__(self):
        return f"<Species(name='{self.name}')>"


class Food(Base):
    """Food items with detailed nutritional profiles (per 100g serving)."""
    __tablename__ = "food"

    food_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, default="Other", doc="e.g. Meat, Vegetable, Fruit")
    protein_g = Column(Float, nullable=False, doc="Protein in grams per 100g")
    fat_g = Column(Float, nullable=False, doc="Fat in grams per 100g")
    carbs_g = Column(Float, nullable=False, doc="Carbohydrates in grams per 100g")
    fiber_g = Column(Float, nullable=False, doc="Fiber in grams per 100g")
    sugar_g = Column(Float, nullable=False, doc="Sugar in grams per 100g")
    calories = Column(Float, nullable=False, doc="Kilocalories per 100g")
    omega3_mg = Column(Float, nullable=False, doc="Omega-3 fatty acids in mg per 100g")
    omega6_mg = Column(Float, nullable=False, doc="Omega-6 fatty acids in mg per 100g")
    bioavailability_score = Column(Float, nullable=False, doc="Absorption rate 0.0-1.0")
    glycemic_index = Column(Float, nullable=False, doc="Glycemic index 0-100")
    ingredient_cost_usd = Column(Float, nullable=False, doc="Cost per 100g in USD")

    toxicities = relationship("Toxicity", back_populates="food")

    def __repr__(self):
        return f"<Food(name='{self.name}')>"


class Toxicity(Base):
    """Known toxic food-species combinations with compound and severity info."""
    __tablename__ = "toxicity"

    id = Column(Integer, primary_key=True, autoincrement=True)
    species_id = Column(Integer, ForeignKey("species.species_id"), nullable=False)
    food_id = Column(Integer, ForeignKey("food.food_id"), nullable=False)
    toxic_compound = Column(String(200), nullable=False, doc="Name of toxic substance")
    severity = Column(String(20), nullable=False, doc="low / moderate / high / lethal")

    species = relationship("Species", back_populates="toxicities")
    food = relationship("Food", back_populates="toxicities")

    def __repr__(self):
        return f"<Toxicity(species={self.species_id}, food={self.food_id}, compound='{self.toxic_compound}')>"


class Pet(Base):
    """Registered pet profile."""
    __tablename__ = "pets"

    pet_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    species_name = Column(String(100), nullable=False)
    breed = Column(String(100), nullable=True)
    age_years = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=False, default=5.0)
    activity_level = Column(String(50), nullable=False, default="normal")  # inactive, normal, active, working
    avatar_emoji = Column(String(20), nullable=True, default="🐾")
    allergies_sensitivities = Column(Text, nullable=True)
    medical_notes = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=True)

    diets = relationship("PetDiet", back_populates="pet", cascade="all, delete-orphan", order_by="desc(PetDiet.diet_id)")
    vet_visits = relationship("VetVisit", back_populates="pet", cascade="all, delete-orphan", order_by="desc(VetVisit.visit_date)")

    def __repr__(self):
        return f"<Pet(id={self.pet_id}, name='{self.name}', species='{self.species_name}')>"


class PetDiet(Base):
    """Dietary regimen for a specific pet."""
    __tablename__ = "pet_diets"

    diet_id = Column(Integer, primary_key=True, autoincrement=True)
    pet_id = Column(Integer, ForeignKey("pets.pet_id"), nullable=False)
    diet_name = Column(String(200), nullable=False)
    diet_type = Column(String(50), nullable=False, default="Mixed")  # Raw, Wet, Dry Kibble, Home-Cooked, Mixed, Prescription
    daily_calories_target = Column(Float, nullable=True)
    meals_per_day = Column(Integer, default=2)
    schedule_time = Column(String(100), nullable=True)
    ingredients_json = Column(Text, nullable=True)  # JSON or text description of food portions
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive (SQLite friendly)
    notes = Column(Text, nullable=True)
    created_at = Column(String(50), nullable=True)

    pet = relationship("Pet", back_populates="diets")

    def __repr__(self):
        return f"<PetDiet(id={self.diet_id}, pet_id={self.pet_id}, name='{self.diet_name}')>"


class VetVisit(Base):
    """Veterinary visit and clinical record for a pet."""
    __tablename__ = "vet_visits"

    visit_id = Column(Integer, primary_key=True, autoincrement=True)
    pet_id = Column(Integer, ForeignKey("pets.pet_id"), nullable=False)
    visit_date = Column(String(50), nullable=False)  # ISO Date e.g. "2026-10-20"
    reason = Column(String(200), nullable=False)     # e.g. "Annual Wellness Checkup", "Vaccination Booster"
    clinic_name = Column(String(200), nullable=True)
    veterinarian = Column(String(100), nullable=True)
    weight_kg = Column(Float, nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    next_visit_date = Column(String(50), nullable=True)
    cost_usd = Column(Float, nullable=True)
    created_at = Column(String(50), nullable=True)

    pet = relationship("Pet", back_populates="vet_visits")

    def __repr__(self):
        return f"<VetVisit(id={self.visit_id}, pet_id={self.pet_id}, date='{self.visit_date}')>"
