# NutriPet_Opto ML Pipeline

This directory contains the Machine Learning and Data Processing modules for the NutriPet_Opto system.
The pipeline is structured to ensure transparency, reproducibility, and biological accuracy.

## 📂 Structure

| File | Rubric Module | purpose |
|------|--------------|---------|
| `generate_dataset.py` | **Data Loader** | Loads raw data, seeds DB, generates synthetic training data. |
| `preprocess.py` | **Preprocessing** | Cleans data, handles missing values, engineers features (e.g., `toxin_flag`, scores). |
| `exploratory_data_analysis.py` | **EDA** | Generates statistical summaries and visualizations (saved in `plots/`). |
| `model_training.py` | **Model Training** | Trains Random Forest (Primary), XGBoost, and Logistic Regression models. |
| `explainability.py` | **Explainability** | Generates feature importance and SHAP-based explanations for predictions. |

## 🛠 Features & Engineering

The system uses **biological heuristics** to generate features from nutritional data:

- **`toxin_flag`**: Binary indicator based on known toxic compounds (e.g., Theobromine, Xylitol).
- **`protein_match_score`**: Ratio of food protein to species requirement.
- **`sugar_risk_score`**: Calculated from sugar content and species carb tolerance.
- **`bioavailability_match`**: Adjusts for digestive type (Carnivore vs Omnivore).

## 📊 Model Training

We use a **Random Forest Classifier** as the primary model due to its:
1.  **Robustness**: Handles non-linear relationships between nutrients and health grades.
2.  **Interpretability**: Provides clear feature importance for explainability.
3.  **Performance**: Achieved ~70% accuracy on synthetic validation set, outperforming consistent baseline.

**Strategy:**
- 80/20 Train/Test Split
- 5-Fold Cross-Validation
- GridSearchCV for hyperparameters (`n_estimators`, `max_depth`).

## 📈 Evaluation
Metrics used:
- Accuracy
- F1-Score (Macro)
- Confusion Matrix

## 🚀 API Integration
The models are served via FastAPI in `backend/app/routes.py`.
- **Endpoint**: `POST /evaluate` (Alias for `/analyze`)
- **Input**: `{"species": "Dog", "food": "Chocolate"}`
- **Output**: Grade, Confidence, Explanation, Graph Data.
