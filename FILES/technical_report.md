# NutriPet_Opto: AI-Powered Pet Food Analysis System
**Technical Report**

## 1. Title Page

**Project Title:** NutriPet_Opto — Hybrid AI for Pet Nutrition Analysis  
**Course Name:** [Course Name/Code]  
**Team Members:**  
- [Member 1 Name]  
- [Member 2 Name]  
**Instructor:** [Instructor Name]  
**Date:** February 12, 2026

---

## 2. Abstract
**Overview:** Pet owners often struggle to interpret nutritional labels and identify species-specific toxins. This project develops an intelligent system to evaluate pet food safety and quality.
**Objective:** To build a hybrid AI pipeline combining a **Knowledge Graph** (for rule-based toxicity checks) and **Machine Learning** (for nutritional grading) to provide actionable health insights.
**Approach:** We utilized a diverse dataset of pet foods and species requirements. Features were engineered based on biological heuristics (e.g., protein match, sugar risk). A Random Forest Classifier was trained to predict a Health Grade (A–F).
**Results:** The system achieved **~70.3% accuracy** in health grading, with **100% toxicity detection** via the Knowledge Graph.

---

## 3. Problem Statement & Objectives
**Problem:** Generic pet food recommendations fail to account for species-specific biological needs (e.g., Cats require Taurine/high protein; Dogs are omnivores but sensitive to Xylitol).
**Objectives:**
1.  **Safety First:** Detect 100% of known toxic ingredients using graph-based rules.
2.  **Nutritional Grading:** Predict a health grade (A–F) with >70% accuracy.
3.  **Explainability:** Provide clear reasons for each grade (e.g., "High Sugar", "Low Protein").
4.  **Accessibility:** Deploy a user-friendly Web Interface.

**Expected Outcome:** A fully functional web app where users input a species and food item to receive an instant, explained health assessment.

---

## 4. Dataset Description
**Source:** Aggregated from USDA FoodData Central, ASPCA Toxic Plants Database, and AAFCO nutritional standards.
**Samples:** 1056 samples (Synthetic & Real-world mix).
**Features:** 
- **Raw:** Calories, Protein (g), Fat (g), Carbs (g), Sugar (g), Fiber (g).
- **Engineered:** `toxin_flag`, `protein_match`, `sugar_risk`.
**Target:** `health_grade` (Categorical: A, B, C, D, E, F).
**Class Distribution:** Balanced equally across grades (approx. ~176 samples per class) to prevent bias.
**Missing Values:** Handled via median imputation (numeric) and mode imputation (categorical).

---

## 5. Data Preprocessing
**Cleaning:**
- **Duplicates:** Removed exact duplicates.
- **Outliers:** Capped using IQR method (1.5 × IQR) to prevent skewing from extreme values.
- **Normalization:** Standardized text inputs (stripped whitespace, lowercase).

**Feature Engineering:**
1.  **`toxin_flag`**: Binary (1 = Toxic, 0 = Safe). Derived from Knowledge Graph traversal.
2.  **`protein_match_score`**: Ratio of Food Protein / Species Requirement.
3.  **`sugar_risk_score`**: `(Sugar/30g) * (GlycemicIndex/100)`. High index indicates metabolic risk.
4.  **`omega_balance`**: Ratio of Omega-3 to Omega-6 fatty acids (inflammatory marker).

**Justification:** Raw nutrient values alone don't indicate health. "High Protein" is good for a cat but neutral for a rabbit. Engineered features capture this **biological context**.

---

## 6. Exploratory Data Analysis (EDA)
**Visualizations (See `backend/ml/plots/`):**
1.  **Grade Distribution:** Confirmed balanced classes.
2.  **Correlation Heatmap:** 
    - Strong negative correlation between `sugar_risk` and `health_grade` (High sugar = Lower grade).
    - Positive correlation between `protein_match` and `health_grade` for carnivores.
3.  **Toxicity Impact:** Boxplots show `toxin_flag=1` almost exclusively maps to Grade F.

**Interpretation:** The features successfully capture the biological rules we intended to model.

---

## 7. Model Preparation
**Problem Type:** Multi-class Classification (Grade A–F) and Regression (Caloric Density).
**Target:** `health_grade` (Encoded: A=0, ..., F=5).
**Representation:** 
- **Numerical:** Standard Scaled (`protein_g`, `fat_g`, etc.).
- **Categorical:** One-Hot Encoded (`species_Dog`, `species_Cat`).
**Split Strategy:** 80% Train, 20% Test.
**Justification:** Standard split provides sufficient data for training while reserving a robust validation set. Stratified sampling ensures all grades are represented in both sets.

---

## 8. Model Implementation
We compared three models:

**Model 1: Random Forest Classifier (Primary)**
- **Architecture:** Ensemble of Decision Trees.
- **Hyperparameters:** `n_estimators=200`, `max_depth=15`, `min_samples_split=5`.
- **Justification:** Robust to outliers, handles non-linear relationships (e.g., "Protein is good up to a point"), and provides feature importance.

**Model 2: XGBoost Classifier**
- **Architecture:** Gradient Boosted Decision Trees.
- **Justification:** Often achieves ease-of-edge performance on tabular data. Used for comparison.

**Model 3: Logistic Regression**
- **Architecture:** Linear Model.
- **Justification:** Baseline to checking if complex models are actually needed.

---

## 9. Evaluation Metrics
**Chosen Metrics:**
- **Accuracy:** Overall correctness.
- **F1-Score (Macro):** Balances Precision and Recall across all classes (crucial for multi-class).
- **Confusion Matrix:** To visualize where misclassifications occur (e.g., confusing B with C).

---

## 10. Model Comparison

| Model | Accuracy | F1-Score (Macro) |
|-------|----------|------------------|
| **Random Forest** | **70.28%** | **0.6463** |
| XGBoost | 70.75% | 0.6663 |
| Logistic Regression | 66.04% | 0.5523 |

**Selection:**  
**Random Forest** was selected as the final model.
**Justification:** While XGBoost was slightly more accurate (+0.5%), Random Forest offers better interpretability and is less prone to overfitting on limited synthetic data. The gap is negligible.

---

## 11. Results & Interpretation
**Strengths:**
- **Toxicity:** 100% detection of critical safety threats (Grade F).
- **Nuance:** Distinguishes well between "Excellent" (A) and "Poor" (D/E).

**Weaknesses:**
- **Mid-range confusion:** Grades B vs C are sometimes confused due to subtle nutritional differences in the synthetic boundaries. This is expected as biological boundaries are often fluid.

---

## 12. Live Prediction / System Demo
**Sample Input:**
- **Species:** "Dog" | **Food:** "Chocolate"
- **Result:** **Grade F** (Toxic). Explanation: "Contains Theobromine - Toxic"

**Sample Input:**
- **Species:** "Cat" | **Food:** "Chicken Breast"
- **Result:** **Grade A**. Explanation: "High Protein Match (95%), No Toxins."

---

## 13. Conclusion
The **NutriPet_Opto** system successfully bridges the gap between raw data and actionable advice. We achieved the objective of creating a safe, accurate (>70%), and explainable tool. The hybrid approach (Graph + ML) ensures that critical safety rules are never violated by probabilistic ML errors.

---

## 14. Limitations & Future Work
**Limitations:**
- **Synthetic Data:** Real-world pet food formulations are proprietary; we relied partially on synthetic generation.
- **Special Diets:** Does not Account for specific conditions like kidney disease or diabetes.

**Future Work:**
- **Image Recognition:** Allow users to scan food labels directly.
- **User Profiles:** Save pet history and allergies.
- **Vets Integration:** Connect with local veterinarians.

---

## 15. Final Results Summary Table

| Metric | Random Forest (Selected) |
|--------|--------------------------|
| **Accuracy** | 70.28% |
| **F1-Score (Macro)** | 0.6463 |
| **5-Fold CV Accuracy** | 70.15% ± 0.02 |
| **Inference Speed** | < 50ms |
| **Model Size** | ~2.5 MB |
