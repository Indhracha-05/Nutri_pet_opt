"""
Model Training Pipeline for NutriPet_Opto.

Covers DA1 Rubric 5 (5 marks):
  - Algorithm Choice: Random Forest (primary), XGBoost, Logistic Regression (baselines)
  - Training Strategy: 80/20 split, 5-fold CV, GridSearchCV hyperparameter tuning
  - Evaluation: Accuracy, F1-score, Confusion Matrix, Classification Report

Dual models:
  1. Classification: Health Grade (A–F)
  2. Regression: Predicted Caloric Density

Usage:
    cd backend
    python ml/train.py
"""
import os
import sys
import warnings
import json
import pandas as pd
import numpy as np
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, f1_score, confusion_matrix, classification_report,
    mean_absolute_error, mean_squared_error, r2_score
)
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

ML_DIR = os.path.dirname(__file__)
PLOTS_DIR = os.path.join(ML_DIR, "plots")

# Try importing xgboost
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("⚠️  XGBoost not available, skipping comparison.")


def load_data():
    """Load processed dataset."""
    processed_path = os.path.join(ML_DIR, "processed_data.csv")
    raw_path = os.path.join(ML_DIR, "training_data.csv")
    path = processed_path if os.path.exists(processed_path) else raw_path
    df = pd.read_csv(path)
    print(f"📂 Loaded: {path} ({df.shape[0]} rows × {df.shape[1]} cols)")
    return df


def prepare_features(df):
    """Prepare feature matrix and target vectors."""
    feature_cols = [
        "toxin_flag", "protein_match", "fat_match", "carb_tolerance",
        "sugar_risk", "omega_balance", "bioavailability_match",
        "glycemic_risk", "digestibility_index", "fiber_compatibility",
    ]
    # Add engineered features if they exist
    extra_features = ["nutrient_match_ratio", "omega_ratio", "cost_nutrition_efficiency",
                      "sugar_overload_risk", "macro_balance_score"]
    for col in extra_features:
        if col in df.columns:
            feature_cols.append(col)

    # Add one-hot species columns if they exist
    species_cols = [c for c in df.columns if c.startswith("species_")]
    feature_cols.extend(species_cols)

    # Ensure all columns exist
    feature_cols = [c for c in feature_cols if c in df.columns]

    X = df[feature_cols].values
    y_grade = df["health_grade"].values
    y_caloric = df["predicted_caloric_density"].values if "predicted_caloric_density" in df.columns else None

    print(f"\n📐 Feature matrix: {X.shape}")
    print(f"   Features used: {feature_cols}")

    return X, y_grade, y_caloric, feature_cols


def train_classification(X, y, feature_names):
    """Train and evaluate classification models for Health Grade prediction."""
    print("\n" + "=" * 65)
    print("🎯 CLASSIFICATION: Health Grade (A–F)")
    print("=" * 65)

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    class_names = le.classes_

    # 80/20 split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"\n  Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")

    results = {}

    # --- Model 1: Random Forest (Primary) ---
    print("\n  📌 Model 1: Random Forest Classifier (Primary)")
    print("  " + "-" * 50)
    print("  Justification:")
    print("    • Handles nonlinear relationships between features")
    print("    • Works well with mixed feature types (binary + continuous)")
    print("    • Provides built-in feature importance for interpretability")
    print("    • Low overfitting risk with ensemble averaging")
    print("    • Robust to feature scaling (no strict normalization needed)")

    # GridSearchCV with 5-fold CV
    param_grid = {
        "n_estimators": [100, 200, 300],
        "max_depth": [10, 15, 20, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
    }

    print("\n  Hyperparameter tuning (GridSearchCV, 5-fold CV)...")
    rf = RandomForestClassifier(random_state=42, n_jobs=-1)
    grid_search = GridSearchCV(rf, param_grid, cv=5, scoring="f1_macro",
                                n_jobs=-1, verbose=0)
    grid_search.fit(X_train, y_train)

    best_rf = grid_search.best_estimator_
    print(f"  Best parameters: {grid_search.best_params_}")
    print(f"  Best CV F1 (macro): {grid_search.best_score_:.4f}")

    # Cross-validation scores
    cv_scores = cross_val_score(best_rf, X_train, y_train, cv=5, scoring="accuracy")
    print(f"  5-Fold CV Accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Test evaluation
    y_pred_rf = best_rf.predict(X_test)
    rf_accuracy = accuracy_score(y_test, y_pred_rf)
    rf_f1 = f1_score(y_test, y_pred_rf, average="macro")
    print(f"\n  Test Results:")
    print(f"    Accuracy:  {rf_accuracy:.4f}")
    print(f"    F1 (macro): {rf_f1:.4f}")
    print(f"\n  Classification Report:")
    report = classification_report(y_test, y_pred_rf, target_names=class_names)
    print(report)

    results["Random Forest"] = {"accuracy": rf_accuracy, "f1_macro": rf_f1}

    # --- Model 2: XGBoost (Comparison) ---
    if HAS_XGBOOST:
        print("\n  📌 Model 2: XGBoost Classifier (Comparison)")
        print("  " + "-" * 50)
        xgb = XGBClassifier(
            n_estimators=200, max_depth=10, learning_rate=0.1,
            random_state=42, use_label_encoder=False, eval_metric="mlogloss",
            n_jobs=-1
        )
        xgb.fit(X_train, y_train)
        y_pred_xgb = xgb.predict(X_test)
        xgb_accuracy = accuracy_score(y_test, y_pred_xgb)
        xgb_f1 = f1_score(y_test, y_pred_xgb, average="macro")
        print(f"    Accuracy:  {xgb_accuracy:.4f}")
        print(f"    F1 (macro): {xgb_f1:.4f}")
        results["XGBoost"] = {"accuracy": xgb_accuracy, "f1_macro": xgb_f1}

    # --- Model 3: Logistic Regression (Baseline) ---
    print("\n  📌 Model 3: Logistic Regression (Baseline)")
    print("  " + "-" * 50)
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)
    lr_accuracy = accuracy_score(y_test, y_pred_lr)
    lr_f1 = f1_score(y_test, y_pred_lr, average="macro")
    print(f"    Accuracy:  {lr_accuracy:.4f}")
    print(f"    F1 (macro): {lr_f1:.4f}")
    results["Logistic Regression"] = {"accuracy": lr_accuracy, "f1_macro": lr_f1}

    # --- Comparison Table ---
    print("\n  📊 Model Comparison:")
    print("  " + "-" * 50)
    print(f"  {'Model':<25} {'Accuracy':>10} {'F1 (macro)':>12}")
    print("  " + "-" * 50)
    for model_name, metrics in results.items():
        marker = " ⭐" if model_name == "Random Forest" else ""
        print(f"  {model_name:<25} {metrics['accuracy']:>10.4f} {metrics['f1_macro']:>12.4f}{marker}")

    # --- Save Confusion Matrix Plot ---
    os.makedirs(PLOTS_DIR, exist_ok=True)
    fig, ax = plt.subplots(figsize=(8, 6))
    cm = confusion_matrix(y_test, y_pred_rf)
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=class_names,
                yticklabels=class_names, ax=ax)
    ax.set_xlabel("Predicted Grade", fontsize=13)
    ax.set_ylabel("Actual Grade", fontsize=13)
    ax.set_title("Random Forest — Confusion Matrix", fontsize=15, fontweight="bold")
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "confusion_matrix.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("\n  ✅ Saved confusion_matrix.png")

    # --- Save Feature Importance Plot ---
    importances = best_rf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(range(len(sorted_idx)), importances[sorted_idx], color="#3498db", alpha=0.8)
    ax.set_yticks(range(len(sorted_idx)))
    ax.set_yticklabels([feature_names[i] for i in sorted_idx])
    ax.set_xlabel("Feature Importance", fontsize=13)
    ax.set_title("Random Forest — Feature Importance", fontsize=15, fontweight="bold")
    ax.invert_yaxis()
    plt.tight_layout()
    fig.savefig(os.path.join(PLOTS_DIR, "feature_importance.png"), dpi=150, bbox_inches="tight")
    plt.close(fig)
    print("  ✅ Saved feature_importance.png")

    # --- Save Model ---
    model_path = os.path.join(ML_DIR, "grade_model.pkl")
    joblib.dump({
        "model": best_rf,
        "label_encoder": le,
        "feature_names": feature_names,
        "best_params": grid_search.best_params_,
        "accuracy": rf_accuracy,
        "f1_macro": rf_f1,
    }, model_path)
    print(f"\n  💾 Saved model to: {model_path}")

    return best_rf, le, results


def train_regression(X, y, feature_names):
    """Train regression model for Caloric Density prediction."""
    print("\n" + "=" * 65)
    print("📈 REGRESSION: Predicted Caloric Density")
    print("=" * 65)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    rf_reg = RandomForestRegressor(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)
    rf_reg.fit(X_train, y_train)

    y_pred = rf_reg.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))

    print(f"\n  Results:")
    print(f"    R² Score:  {r2:.4f}")
    print(f"    MAE:       {mae:.4f}")
    print(f"    RMSE:      {rmse:.4f}")

    # Save model
    model_path = os.path.join(ML_DIR, "caloric_model.pkl")
    joblib.dump({
        "model": rf_reg,
        "feature_names": feature_names,
        "r2": r2,
        "mae": mae,
        "rmse": rmse,
    }, model_path)
    print(f"\n  💾 Saved model to: {model_path}")

    return rf_reg


def main():
    print("🐾 NutriPet_Opto — Model Training Pipeline")
    print("=" * 65)

    # Load and prepare
    df = load_data()
    X, y_grade, y_caloric, feature_names = prepare_features(df)

    # Train classification
    rf_model, le, class_results = train_classification(X, y_grade, feature_names)

    # Train regression
    if y_caloric is not None:
        rf_reg = train_regression(X, y_caloric, feature_names)

    # Final summary
    print("\n" + "=" * 65)
    print("✅ TRAINING COMPLETE")
    print("=" * 65)
    print(f"  Grade Model:   grade_model.pkl")
    print(f"  Caloric Model: caloric_model.pkl")
    print(f"  Plots:         plots/confusion_matrix.png, feature_importance.png")

    # Save training summary
    summary = {
        "classification": class_results,
        "feature_names": feature_names,
        "dataset_size": len(df),
    }
    summary_path = os.path.join(ML_DIR, "training_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"  Summary:       {summary_path}")


if __name__ == "__main__":
    main()
