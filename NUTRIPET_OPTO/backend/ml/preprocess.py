"""
Data Preprocessing Pipeline for NutriPet_Opto.

Covers DA1 Rubric 3 (7 marks):
  - Data Cleaning: missing values, outliers, inconsistencies
  - Feature Engineering: meaningful features with justification
  - Data Transformation: scaling, encoding, normalization

Each step is logged with print statements for documentation.

Usage:
    cd backend
    python ml/preprocess.py
"""
import os
import sys
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

ML_DIR = os.path.dirname(__file__)


def load_data() -> pd.DataFrame:
    """Load the raw training dataset."""
    path = os.path.join(ML_DIR, "training_data.csv")
    df = pd.read_csv(path)
    print(f"📂 Loaded dataset: {df.shape[0]} rows × {df.shape[1]} columns")
    return df


# =====================================================================
# STEP 1: DATA CLEANING
# =====================================================================
def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Data Cleaning:
      1. Remove duplicates
      2. Handle missing values
      3. Detect and handle outliers (IQR method)
      4. Fix inconsistencies
    """
    print("\n" + "=" * 60)
    print("🧹 STEP 1: DATA CLEANING")
    print("=" * 60)

    # 1.1 Check for duplicates
    dup_count = df.duplicated().sum()
    print(f"\n  1.1 Duplicate rows found: {dup_count}")
    if dup_count > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        print(f"      → Removed {dup_count} duplicates. New shape: {df.shape}")

    # 1.2 Handle missing values
    missing = df.isnull().sum()
    missing_cols = missing[missing > 0]
    print(f"\n  1.2 Missing values check:")
    if len(missing_cols) > 0:
        for col, count in missing_cols.items():
            pct = count / len(df) * 100
            print(f"      {col}: {count} missing ({pct:.1f}%)")

        # Strategy: fill numeric with median, categorical with mode
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df[col].isnull().sum() > 0:
                median_val = df[col].median()
                df[col].fillna(median_val, inplace=True)
                print(f"      → Filled {col} with median: {median_val:.2f}")

        cat_cols = df.select_dtypes(include=["object"]).columns
        for col in cat_cols:
            if df[col].isnull().sum() > 0:
                mode_val = df[col].mode()[0]
                df[col].fillna(mode_val, inplace=True)
                print(f"      → Filled {col} with mode: {mode_val}")
    else:
        print("      ✅ No missing values found")

    # 1.3 Outlier detection (IQR method on key numeric columns)
    print(f"\n  1.3 Outlier detection (IQR method):")
    outlier_cols = ["calories", "protein_g", "fat_g", "carbs_g", "sugar_g",
                    "omega3_mg", "omega6_mg"]
    total_outliers = 0
    for col in outlier_cols:
        if col in df.columns:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            outliers = ((df[col] < lower) | (df[col] > upper)).sum()
            total_outliers += outliers
            if outliers > 0:
                print(f"      {col}: {outliers} outliers (range: [{lower:.1f}, {upper:.1f}])")
                # Cap outliers instead of removing (preserves dataset size)
                df[col] = df[col].clip(lower=lower, upper=upper)

    if total_outliers > 0:
        print(f"      → Capped {total_outliers} outlier values (IQR clipping)")
    else:
        print("      ✅ No significant outliers detected")

    # 1.4 Normalize food names (strip whitespace, consistent casing)
    print(f"\n  1.4 Name normalization:")
    for col in ["species", "food"]:
        if col in df.columns:
            df[col] = df[col].str.strip()
            print(f"      → Stripped whitespace from '{col}' column")

    print(f"\n  📊 After cleaning: {df.shape[0]} rows × {df.shape[1]} columns")
    return df


# =====================================================================
# STEP 2: FEATURE ENGINEERING
# =====================================================================
def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature Engineering — create meaningful derived features:
      1. Nutrient match ratio (overall nutrition compatibility)
      2. Omega balance score (omega-3 to omega-6 ratio)
      3. Cost-per-nutrition efficiency
      4. Sugar overload risk formula
      5. Macro balance score
    """
    print("\n" + "=" * 60)
    print("⚙️  STEP 2: FEATURE ENGINEERING")
    print("=" * 60)

    # 2.1 Nutrient match ratio (composite of individual matches)
    print("\n  2.1 Nutrient Match Ratio:")
    print("      Formula: weighted average of protein_match, fat_match, carb_tolerance")
    print("      Justification: Combines individual nutrient scores into a single")
    print("      compatibility metric. Protein is weighted higher for carnivores.")
    df["nutrient_match_ratio"] = (
        df["protein_match"] * 0.35 +
        df["fat_match"] * 0.25 +
        df["carb_tolerance"] * 0.20 +
        df["fiber_compatibility"] * 0.20
    )

    # 2.2 Omega balance score
    print("\n  2.2 Omega-3/6 Balance Score:")
    print("      Formula: omega3_mg / (omega3_mg + omega6_mg + 1)")
    print("      Justification: Healthy omega ratio matters for inflammation control.")
    print("      Values closer to 0.3-0.5 indicate better balance.")
    df["omega_ratio"] = df["omega3_mg"] / (df["omega3_mg"] + df["omega6_mg"] + 1)

    # 2.3 Cost-per-nutrition efficiency
    print("\n  2.3 Cost-per-Nutrition Efficiency:")
    print("      Formula: bioavailability_score × calories / (cost + 0.01)")
    print("      Justification: Higher value = more nutritional value per dollar.")
    df["cost_nutrition_efficiency"] = (
        df["bioavailability_score"] * df["calories"] /
        (df["ingredient_cost_usd"] + 0.01)
    )
    # Normalize to 0-1
    max_cne = df["cost_nutrition_efficiency"].max()
    if max_cne > 0:
        df["cost_nutrition_efficiency"] = df["cost_nutrition_efficiency"] / max_cne

    # 2.4 Sugar overload risk
    print("\n  2.4 Sugar Overload Risk:")
    print("      Formula: (sugar_g / 30) × (glycemic_index / 100)")
    print("      Justification: High sugar + high GI compounds the metabolic risk.")
    df["sugar_overload_risk"] = (
        (df["sugar_g"] / 30.0).clip(upper=1.0) *
        (df["glycemic_index"] / 100.0).clip(upper=1.0)
    )

    # 2.5 Macro balance score
    print("\n  2.5 Macro Balance Score:")
    print("      Formula: 1 - std(protein%, fat%, carb%) / 0.33")
    print("      Justification: Balanced macros are generally healthier.")
    total_macro = df["protein_g"] + df["fat_g"] + df["carbs_g"] + 0.01
    protein_pct = df["protein_g"] / total_macro
    fat_pct = df["fat_g"] / total_macro
    carb_pct = df["carbs_g"] / total_macro
    macro_std = pd.concat([protein_pct, fat_pct, carb_pct], axis=1).std(axis=1)
    df["macro_balance_score"] = (1 - macro_std / 0.33).clip(lower=0)

    new_features = ["nutrient_match_ratio", "omega_ratio", "cost_nutrition_efficiency",
                     "sugar_overload_risk", "macro_balance_score"]
    print(f"\n  📊 Added {len(new_features)} engineered features: {new_features}")
    print(f"      Total columns: {df.shape[1]}")

    return df


# =====================================================================
# STEP 3: DATA TRANSFORMATION
# =====================================================================
def transform_data(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Data Transformation:
      1. One-hot encoding for categorical features (species)
      2. Label encoding for target variable (grade A-F)
      3. Feature scaling (StandardScaler)
    """
    print("\n" + "=" * 60)
    print("🔄 STEP 3: DATA TRANSFORMATION")
    print("=" * 60)

    transform_info = {}

    # 3.1 One-hot encoding for species
    print("\n  3.1 One-Hot Encoding (Species):")
    species_dummies = pd.get_dummies(df["species"], prefix="species")
    print(f"      → Created {len(species_dummies.columns)} binary columns:")
    for col in species_dummies.columns:
        print(f"        {col}")
    df = pd.concat([df, species_dummies], axis=1)

    # 3.1b One-hot encoding for food (lets the toxicity model learn food-specific patterns)
    print("\n  3.1b One-Hot Encoding (Food):")
    food_dummies = pd.get_dummies(df["food"], prefix="food")
    print(f"      → Created {len(food_dummies.columns)} binary columns (one per food item)")
    df = pd.concat([df, food_dummies], axis=1)

    # 3.2 Label encoding for health grade
    print("\n  3.2 Label Encoding (Health Grade):")
    grade_mapping = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5}
    df["grade_encoded"] = df["health_grade"].map(grade_mapping)
    print(f"      Mapping: {grade_mapping}")
    transform_info["grade_mapping"] = grade_mapping
    transform_info["grade_reverse"] = {v: k for k, v in grade_mapping.items()}

    # 3.3 Feature scaling (only continuous features; binary dummies NOT scaled)
    print("\n  3.3 Feature Scaling (StandardScaler):")
    feature_cols = [
        "protein_g", "fat_g", "carbs_g", "fiber_g", "sugar_g", "calories",
        "omega3_mg", "omega6_mg", "bioavailability_score", "glycemic_index",
        "ingredient_cost_usd", "toxin_flag", "protein_match", "fat_match",
        "carb_tolerance", "sugar_risk", "omega_balance", "bioavailability_match",
        "glycemic_risk", "digestibility_index", "fiber_compatibility",
        "nutrient_match_ratio", "omega_ratio", "cost_nutrition_efficiency",
        "sugar_overload_risk", "macro_balance_score",
    ]
    # Only scale columns that exist
    feature_cols = [c for c in feature_cols if c in df.columns]

    scaler = StandardScaler()
    scaled_cols = [f"{c}_scaled" for c in feature_cols]
    df[scaled_cols] = scaler.fit_transform(df[feature_cols])
    print(f"      → Scaled {len(feature_cols)} features using StandardScaler")
    print(f"      → New scaled columns added with '_scaled' suffix")
    print(f"      → Binary dummy columns (species_*, food_*) and is_toxic kept as-is")

    transform_info["scaler"] = scaler
    transform_info["feature_cols"] = feature_cols
    transform_info["scaled_cols"] = scaled_cols

    print(f"\n  📊 Final dataset: {df.shape[0]} rows × {df.shape[1]} columns")

    return df, transform_info


def run_pipeline():
    """Run the full preprocessing pipeline and save results."""
    print("🐾 NutriPet_Opto Preprocessing Pipeline")
    print("=" * 60)

    # Load
    df = load_data()

    # Clean
    df = clean_data(df)

    # Engineer
    df = engineer_features(df)

    # Transform
    df, transform_info = transform_data(df)

    # Save processed dataset
    output_path = os.path.join(ML_DIR, "processed_data.csv")
    df.to_csv(output_path, index=False)
    print(f"\n✅ Processed dataset saved to: {output_path}")
    print(f"   Shape: {df.shape}")

    return df, transform_info


if __name__ == "__main__":
    run_pipeline()
