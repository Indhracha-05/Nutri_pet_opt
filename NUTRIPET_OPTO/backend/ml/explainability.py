"""
Explainability Engine for NutriPet_Opto.

Provides human-readable explanations for model predictions using:
  - Random Forest feature importance (built-in)
  - SHAP values (if available)

Returns top influencing factors and natural language explanation.
"""
import os
import sys
import numpy as np
import joblib

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

ML_DIR = os.path.dirname(__file__)

# Try importing SHAP
try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False


def load_model():
    """Load the trained grade model."""
    model_path = os.path.join(ML_DIR, "grade_model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Run train.py first.")
    return joblib.load(model_path)


def get_feature_importance(model_data: dict) -> dict:
    """Get global feature importance from the trained model."""
    model = model_data["model"]
    feature_names = model_data["feature_names"]
    importances = model.feature_importances_

    importance_dict = {}
    for name, imp in zip(feature_names, importances):
        importance_dict[name] = round(float(imp), 4)

    # Sort by importance
    importance_dict = dict(sorted(importance_dict.items(), key=lambda x: x[1], reverse=True))
    return importance_dict


def explain(features_dict: dict, model_data: dict = None) -> dict:
    """
    Generate explanation for a prediction.

    Args:
        features_dict: dict of feature_name → value
        model_data: loaded model data (optional, loads if None)

    Returns:
        dict with:
            - top_factors: list of top 3 influencing features
            - explanation: human-readable explanation string
            - feature_importance: full feature importance dict
    """
    if model_data is None:
        model_data = load_model()

    model = model_data["model"]
    feature_names = model_data["feature_names"]

    # Prepare feature vector
    X = np.array([[features_dict.get(f, 0.0) for f in feature_names]])

    # Get prediction
    grade_encoded = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    le = model_data["label_encoder"]
    grade = le.inverse_transform([grade_encoded])[0]
    confidence = float(max(proba))

    # Feature importance (global)
    importances = model.feature_importances_
    importance_pairs = list(zip(feature_names, importances))
    importance_pairs.sort(key=lambda x: x[1], reverse=True)

    # Top 3 factors
    top_factors = []
    for name, imp in importance_pairs[:3]:
        value = features_dict.get(name, 0.0)
        top_factors.append({
            "feature": name,
            "importance": round(float(imp), 4),
            "value": round(float(value), 4),
        })

    # Generate explanation text
    explanation = _generate_explanation_text(grade, confidence, top_factors, features_dict)

    return {
        "grade": grade,
        "confidence": round(confidence, 4),
        "top_factors": top_factors,
        "explanation": explanation,
        "feature_importance": {name: round(float(imp), 4) for name, imp in importance_pairs},
    }


def _generate_explanation_text(grade: str, confidence: float, top_factors: list, features: dict) -> str:
    """Generate a human-readable explanation string."""
    grade_descriptions = {
        "A": "Excellent — highly nutritious and safe",
        "B": "Good — generally healthy with minor considerations",
        "C": "Moderate — acceptable but with some nutritional gaps",
        "D": "Poor — significant nutritional mismatches",
        "E": "Very Poor — notable health risks identified",
        "F": "Dangerous — toxic or severely incompatible",
    }

    parts = [f"Health Grade: {grade} — {grade_descriptions.get(grade, 'Unknown')}"]
    parts.append(f"Confidence: {confidence:.1%}")

    # Toxicity warning
    toxin_flag = features.get("toxin_flag", 0)
    if toxin_flag > 0:
        if toxin_flag >= 0.8:
            parts.append("⚠️ CRITICAL: This food contains compounds that are highly toxic to this species.")
        elif toxin_flag >= 0.5:
            parts.append("⚠️ WARNING: This food contains compounds that may be harmful to this species.")
        else:
            parts.append("⚠️ CAUTION: This food has mild toxicity concerns for this species.")

    # Top influencing factors
    parts.append("\nTop influencing factors:")
    factor_descriptions = {
        "toxin_flag": "Toxicity risk level",
        "protein_match": "Protein compatibility with species needs",
        "fat_match": "Fat content compatibility",
        "carb_tolerance": "Carbohydrate tolerance",
        "sugar_risk": "Sugar content risk",
        "omega_balance": "Omega-3/6 fatty acid balance",
        "bioavailability_match": "Nutrient absorption rate",
        "glycemic_risk": "Glycemic index impact",
        "digestibility_index": "Digestive compatibility",
        "fiber_compatibility": "Fiber content compatibility",
        "nutrient_match_ratio": "Overall nutritional match",
        "omega_ratio": "Omega-3 to Omega-6 ratio",
        "cost_nutrition_efficiency": "Cost-to-nutrition value",
        "sugar_overload_risk": "Combined sugar-glycemic risk",
        "macro_balance_score": "Macronutrient balance",
    }

    for factor in top_factors:
        name = factor["feature"]
        desc = factor_descriptions.get(name, name)
        value = factor["value"]
        imp = factor["importance"]
        parts.append(f"  • {desc}: {value:.2f} (importance: {imp:.3f})")

    # Disclaimer
    parts.append("\n⚕️ Disclaimer: This assessment is informational only and not a substitute for professional veterinary advice.")

    return "\n".join(parts)
