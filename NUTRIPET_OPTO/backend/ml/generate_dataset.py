"""
Synthetic training dataset generator for NutriPet_Opto.

Crosses all species × food combinations, extracts features from the
knowledge graph, and assigns ground-truth labels:
    - Health Grade (A–F) based on rule heuristics aligned with vet guidelines
    - Predicted Caloric Density based on nutritional profile

Output: training_data.csv (1,000 – 5,000 rows)

Usage:
    cd backend
    python ml/generate_dataset.py
"""
import sys
import os
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.knowledge_graph import build_graph, extract_graph_features, check_toxicity


def load_csv_data():
    """Load raw CSV data from data/ directory."""
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")

    species_df = pd.read_csv(os.path.join(data_dir, "species.csv"))
    foods_df = pd.read_csv(os.path.join(data_dir, "foods.csv"))
    toxicity_df = pd.read_csv(os.path.join(data_dir, "toxicity.csv"))

    return (
        species_df.to_dict("records"),
        foods_df.to_dict("records"),
        toxicity_df.to_dict("records"),
    )


def compute_caloric_density(food: dict) -> float:
    """
    Predict caloric density score (0-1) from nutritional profile.
    Considers macro balance, bioavailability, and cost-efficiency.
    """
    cals = food.get("calories", 100)
    bioavail = food.get("bioavailability_score", 0.5)
    cost = food.get("ingredient_cost_usd", 0.5)

    # Caloric density normalized (0-1 scale, 900 kcal max)
    cal_norm = min(cals / 900.0, 1.0)

    # Effective caloric density = caloric density × bioavailability
    effective = cal_norm * bioavail

    # Cost efficiency factor
    cost_eff = 1.0 - min(cost / 3.0, 1.0)

    return round(float(np.clip(effective * 0.7 + cost_eff * 0.3, 0.0, 1.0)), 4)


def assign_grade(features: dict, food: dict) -> str:
    """
    Assign A–F health grade based on feature scores.
    Rules aligned with veterinary guidelines.
    """
    # Immediate F for toxic foods
    if features["toxin_flag"] >= 0.8:
        return "F"
    if features["toxin_flag"] >= 0.5:
        return "E"
    if features["toxin_flag"] >= 0.2:
        return "D"

    # Calculate composite score (0-1, higher = better)
    positive_scores = [
        features["protein_match"] * 1.5,       # Protein is important
        features["fat_match"],
        features["carb_tolerance"],
        features["omega_balance"] * 1.2,        # Omega balance matters
        features["bioavailability_match"] * 1.3, # Bioavailability matters a lot
        features["digestibility_index"],
        features["fiber_compatibility"],
    ]
    negative_scores = [
        features["sugar_risk"] * 1.3,           # Sugar is bad
        features["glycemic_risk"] * 1.0,        # High GI is concerning
    ]

    weights_pos = [1.5, 1, 1, 1.2, 1.3, 1, 1]
    weights_neg = [1.3, 1.0]
    positive_avg = sum(positive_scores) / sum(weights_pos)
    negative_avg = sum(negative_scores) / sum(weights_neg)

    composite = positive_avg - negative_avg * 0.35
    composite = float(np.clip(composite, 0, 1))

    # Add slight randomness for realistic distribution
    noise = np.random.normal(0, 0.05)
    composite = float(np.clip(composite + noise, 0, 1))

    # Grade boundaries (tuned for balanced distribution)
    if composite >= 0.58:
        return "A"
    elif composite >= 0.48:
        return "B"
    elif composite >= 0.38:
        return "C"
    elif composite >= 0.28:
        return "D"
    elif composite >= 0.18:
        return "E"
    else:
        return "F"


def main():
    print("🐾 NutriPet_Opto Dataset Generation")
    print("=" * 45)

    # Load data
    print("\n📂 Loading CSV data...")
    species_list, food_list, toxicity_list = load_csv_data()
    print(f"   Species: {len(species_list)}, Foods: {len(food_list)}, Toxic pairs: {len(toxicity_list)}")

    # Build knowledge graph
    print("\n🔗 Building knowledge graph...")
    graph = build_graph(species_list, food_list, toxicity_list)
    print(f"   Nodes: {graph.number_of_nodes()}, Edges: {graph.number_of_edges()}")

    # Generate training data
    print("\n⚙️  Generating training dataset...")
    np.random.seed(42)
    records = []

    for species in species_list:
        for food in food_list:
            # Extract features
            features = extract_graph_features(graph, species["name"], food["name"])

            # Compute targets
            caloric_density = compute_caloric_density(food)
            grade = assign_grade(features, food)

            # ML toxicity label: 1 if food is toxic for this species, 0 otherwise
            is_toxic, toxic_compound, tox_severity = check_toxicity(graph, species["name"], food["name"])

            record = {
                "species": species["name"],
                "food": food["name"],
                "protein_g": food["protein_g"],
                "fat_g": food["fat_g"],
                "carbs_g": food["carbs_g"],
                "fiber_g": food["fiber_g"],
                "sugar_g": food["sugar_g"],
                "calories": food["calories"],
                "omega3_mg": food["omega3_mg"],
                "omega6_mg": food["omega6_mg"],
                "bioavailability_score": food["bioavailability_score"],
                "glycemic_index": food["glycemic_index"],
                "ingredient_cost_usd": food["ingredient_cost_usd"],
                # Engineered features
                "toxin_flag": features["toxin_flag"],
                "protein_match": features["protein_match"],
                "fat_match": features["fat_match"],
                "carb_tolerance": features["carb_tolerance"],
                "sugar_risk": features["sugar_risk"],
                "omega_balance": features["omega_balance"],
                "bioavailability_match": features["bioavailability_match"],
                "glycemic_risk": features["glycemic_risk"],
                "digestibility_index": features["digestibility_index"],
                "fiber_compatibility": features["fiber_compatibility"],
                # Targets
                "predicted_caloric_density": caloric_density,
                "health_grade": grade,
                # ML Toxicity target (ground truth from knowledge graph)
                "is_toxic": int(is_toxic),
                "toxic_compound": toxic_compound if toxic_compound else "",
                "tox_severity": tox_severity if tox_severity else "",
            }
            records.append(record)

    df = pd.DataFrame(records)

    # Save
    output_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
    df.to_csv(output_path, index=False)

    # Summary
    print(f"\n📊 Dataset Summary:")
    print(f"   Total rows: {len(df)}")
    print(f"   Columns: {len(df.columns)}")
    print(f"\n   Grade Distribution:")
    for grade in ["A", "B", "C", "D", "E", "F"]:
        count = len(df[df["health_grade"] == grade])
        pct = count / len(df) * 100
        print(f"     {grade}: {count:>4} ({pct:.1f}%)")

    toxic_count = df["is_toxic"].sum()
    print(f"\n   Toxicity Labels:")
    print(f"     Toxic:     {toxic_count:>4} ({toxic_count/len(df)*100:.1f}%)")
    print(f"     Non-toxic: {len(df)-toxic_count:>4} ({(len(df)-toxic_count)/len(df)*100:.1f}%)")

    print(f"\n   Caloric Density: mean={df['predicted_caloric_density'].mean():.3f}, "
          f"std={df['predicted_caloric_density'].std():.3f}")

    print(f"\n✅ Saved to: {output_path}")


if __name__ == "__main__":
    main()
