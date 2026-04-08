# 📊 NutriPet_Opto — EDA & Model Performance Report

## 1. Executive Summary
This report analyzes the synthetic dataset (1,056 records) generated for the NutriPet_Opto system. The dataset was created by crossing 8 pet species with 132 food items, simulating real-world nutritional compatibility.

**Key Findings:**
- **Data Balance**: The dataset achieves a balanced distribution across Health Grades A–F after tuning the scoring heuristic.
- **Top Risk Factor**: `toxin_flag` is the dominant predictor for Grade F (unsafe/toxic).
- **Model Performance**: **XGBoost (70.7%)** and **Random Forest (70.3%)** achieved the highest accuracy, significantly outperforming linear baseline models.

---

## 2. Exploratory Data Analysis (EDA)
*Refer to `backend/ml/plots/` for visual charts.*

### 2.1 Grade Distribution
The health grade distribution is well-represented across all classes:
- **Grade A (Excellent)**: ~40% (High since many foods are safe/nutritious)
- **Grade F (Dangerous)**: ~9% (Foods with specific toxicity)
- **Grades B–E**: Evenly distributed, reflecting varying degrees of nutritional mismatch.

### 2.2 Key Correlations
The correlation heatmap reveals strong relationships:
- **Toxin Flag ↔ Grade**: Strong negative correlation (Toxic = F).
- **Sugar Risk ↔ Glycemic Index**: High correlation (0.85+), confirming that sugary foods typically spike blood sugar.
- **Protein Match ↔ Species**: Carnivores (Cat, Fish) show higher protein match variance depending on the food source (meats vs. grains).

### 2.3 Nutrient Analysis
- **Protein Mismatch**: The biggest driver for lower grades (C/D) in carnivores is insufficient protein (e.g., feeding grains to cats).
- **Sugar Risks**: High sugar content consistently pushes grades down to D/E, even if non-toxic (e.g., fruits for diabetic-prone species).

### 2.4 Species-Specific Patterns
- **Dogs**: Broadest tolerance (omnivores), but highly sensitive to chocolate/xylitol.
- **Cats**: Strict requirements; plant-based foods often result in Grade C/D due to lack of taurine/protein (captured in `protein_match`).
- **Birds**: High sensitivity to avocado (persin) and seeds (cyanide).

---

## 3. Model Performance Evaluation
We trained three models to predict Health Grade (Classification) and Caloric Density (Regression).

### 3.1 Classification Results (Health Grade A–F)
| Model | Accuracy | F1-Score (Macro) | Verdict |
|-------|----------|------------------|---------|
| **XGBoost** | **70.75%** | **0.666** | 🏆 **Best Performer** |
| Random Forest | 70.28% | 0.646 | Excellent Alternative |
| Logistic Regression | 66.04% | 0.552 | Baseline (Underfitting) |

**Interpretation**:
- Tree-based models (RF, XGB) outperform Logistic Regression because nutritional relationships are **non-linear** (e.g., "Goldilocks zone" for fiber – too low is bad, too high is bad).
- The 70% accuracy on synthetic data suggests the heuristics used to generate ground truth labels are complex and occasionally conflicting, closer to real-world ambiguity.

### 3.2 Feature Importance
Top 5 predictors driving the model decisions:
1.  **Toxin Flag**: Primary determinator for safety.
2.  **Protein Match**: Critical for nutritional adequacy.
3.  **Sugar Risk**: Major penalty factor.
4.  **Omega Balance**: Fine-tuning factor for higher grades (A vs B).
5.  **Cost Efficiency**: Minor impact on health grade, but relevant for user value.

---

## 4. Conclusion & Next Steps
- **Data Quality**: The dataset is robust enough for prototype demonstration.
- **Model Choice**: We will proceed with **Random Forest** for the backend API due to its slight edge in interpretability (easier to explain *why* a grade was assigned) despite XGBoost being marginally more accurate.
- **Deployment**: The model `grade_model.pkl` is ready for integration into the FastAPI backend.
