"""
Seed script for NutriPet_Opto database.
Reads CSV files and populates the SQLite database.

Usage:
    cd backend
    python scripts/seed_db.py
"""
import sys
import os
import pandas as pd

# Add backend root to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import engine, init_db, SessionLocal
from app.models import Species, Food, Toxicity


DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def seed_species(session):
    """Load species.csv into the Species table."""
    csv_path = os.path.join(DATA_DIR, "species.csv")
    df = pd.read_csv(csv_path)
    count = 0
    for _, row in df.iterrows():
        existing = session.query(Species).filter_by(name=row["name"]).first()
        if existing:
            continue
        species = Species(
            name=row["name"],
            protein_requirement=row["protein_requirement"],
            fat_tolerance=row["fat_tolerance"],
            carb_tolerance=row["carb_tolerance"],
            omega3_requirement=row["omega3_requirement"],
            omega6_requirement=row["omega6_requirement"],
            digestive_type=row["digestive_type"],
            known_sensitivities=row.get("known_sensitivities", ""),
        )
        session.add(species)
        count += 1
    session.commit()
    print(f"  ✅ Seeded {count} species (total: {session.query(Species).count()})")


def seed_foods(session):
    """Load foods.csv into the Food table."""
    csv_path = os.path.join(DATA_DIR, "foods.csv")
    df = pd.read_csv(csv_path)
    count = 0
    for _, row in df.iterrows():
        existing = session.query(Food).filter_by(name=row["name"]).first()
        if existing:
            # Update category if it's missing
            if hasattr(existing, 'category') and not existing.category:
                existing.category = row.get("category", "Other")
            continue
        food = Food(
            name=row["name"],
            category=row.get("category", "Other"),
            protein_g=row["protein_g"],
            fat_g=row["fat_g"],
            carbs_g=row["carbs_g"],
            fiber_g=row["fiber_g"],
            sugar_g=row["sugar_g"],
            calories=row["calories"],
            omega3_mg=row["omega3_mg"],
            omega6_mg=row["omega6_mg"],
            bioavailability_score=row["bioavailability_score"],
            glycemic_index=row["glycemic_index"],
            ingredient_cost_usd=row["ingredient_cost_usd"],
        )
        session.add(food)
        count += 1
    session.commit()
    print(f"  ✅ Seeded {count} foods (total: {session.query(Food).count()})")


def seed_toxicity(session):
    """Load toxicity.csv into the Toxicity table."""
    csv_path = os.path.join(DATA_DIR, "toxicity.csv")
    df = pd.read_csv(csv_path)
    count = 0
    for _, row in df.iterrows():
        # Look up species and food by name
        species = session.query(Species).filter_by(name=row["species_name"]).first()
        food = session.query(Food).filter_by(name=row["food_name"]).first()
        if not species:
            print(f"  ⚠️  Species not found: {row['species_name']}")
            continue
        if not food:
            print(f"  ⚠️  Food not found: {row['food_name']}")
            continue

        # Check for duplicate
        existing = (
            session.query(Toxicity)
            .filter_by(species_id=species.species_id, food_id=food.food_id)
            .first()
        )
        if existing:
            continue

        toxicity = Toxicity(
            species_id=species.species_id,
            food_id=food.food_id,
            toxic_compound=row["toxic_compound"],
            severity=row["severity"],
        )
        session.add(toxicity)
        count += 1
    session.commit()
    print(f"  ✅ Seeded {count} toxicity records (total: {session.query(Toxicity).count()})")


def main():
    print("🐾 NutriPet_Opto Database Seeding")
    print("=" * 40)

    # Create tables
    print("\n📦 Creating database tables...")
    init_db()
    print("  ✅ Tables created")

    # Seed data
    session = SessionLocal()
    try:
        print("\n🌱 Seeding species...")
        seed_species(session)

        print("\n🌱 Seeding foods...")
        seed_foods(session)

        print("\n🌱 Seeding toxicity data...")
        seed_toxicity(session)

        # Summary
        total = (
            session.query(Species).count()
            + session.query(Food).count()
            + session.query(Toxicity).count()
        )
        print(f"\n{'=' * 40}")
        print(f"📊 Total records in database: {total}")
        print(f"   Species: {session.query(Species).count()}")
        print(f"   Foods:   {session.query(Food).count()}")
        print(f"   Toxic:   {session.query(Toxicity).count()}")
        print(f"{'=' * 40}")
        print("✅ Database seeding complete!")
    finally:
        session.close()


if __name__ == "__main__":
    main()
