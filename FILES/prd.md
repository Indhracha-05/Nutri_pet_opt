🐾 PRODUCT REQUIREMENTS DOCUMENT (PRD)
Project Title

PetPedia AI: Intelligent Veterinary Food Safety & Health Grading System

1️⃣ Product Overview

PetPedia AI is a hybrid AI system that evaluates whether a given food item is safe and healthy for a specific pet species and assigns a health grade (A–F).

The system combines:

Knowledge Graph reasoning (toxic and biological constraints)

Machine Learning-based grading model (nutrition compatibility scoring)

2️⃣ Problem Statement

Pet owners often lack scientific knowledge regarding food safety for pets. Many human foods are toxic or nutritionally inappropriate for animals. Existing systems provide static lists but lack personalized, explainable, and intelligent evaluation.

We aim to develop a system that:

Accepts pet species + food item

Analyzes toxicity and nutrition

Assigns A–F health grade

Provides explainable reasoning

Visually represents biological relationships

3️⃣ Objectives (Measurable)

Achieve ≥85% classification consistency with veterinary guidelines.

Provide explainable output for every prediction.

Maintain real-time inference (<2 seconds).

Display interactive knowledge graph visualization.

Demonstrate clear ML pipeline (EDA → Training → Evaluation).

4️⃣ System Architecture
Hybrid Model
Frontend (Graph UI)
        ↓
FastAPI Backend
        ↓
Knowledge Graph Engine
        ↓
Feature Engineering
        ↓
ML Grading Model
        ↓
A–F Grade + Explanation
        ↓
Frontend Visualization

5️⃣ Functional Requirements
5.1 User Input

Select Species (Dog, Cat, Rabbit, etc.)

Enter Food Item

Optional: Weight, Age

5.2 Knowledge Graph Module

Purpose:

Identify toxic compounds

Identify species incompatibilities

Extract relationship-based features

Output:

Toxicity flag (binary)

Nutritional compatibility scores

Digestibility indicators

5.3 Machine Learning Grading Module
Input Features:

Toxicity flag

Protein match score

Fat match score

Carb tolerance score

Sugar risk score

Fiber compatibility

Digestibility index

Output:

Health Grade (A–F)

Confidence Score (0–1)

Model Options:

Random Forest (Primary)

XGBoost (Optional comparison)

Logistic Regression (Baseline)

Justification:

Handles nonlinear relationships

Robust to feature scaling

High interpretability with feature importance

6️⃣ Frontend Requirements
6.1 Graph-Based Visualization (Core Highlight)

Interactive Knowledge Graph displaying:

Nodes:

Species

Food

Nutrients

Toxic Compounds

Edges:

contains

intolerant_to

requires

high_in

sensitive_to

Tools:

React.js

D3.js OR Cytoscape.js

Vis.js (simpler option)

6.2 Model Visualization Panel

Display:

Feature importance bar chart

Compatibility score breakdown

Radar chart of nutrition match

Final Grade Badge (A–F)

This shows your ML transparency.

7️⃣ Backend Requirements

Framework:

FastAPI (Python)

Scikit-learn

Pandas

NetworkX (for graph logic)

SQLite / PostgreSQL

8️⃣ Datasets Required
8.1 Toxic Food Dataset

species

food

toxic_compound

toxicity_severity

Source:

ASPCA

Veterinary journals

8.2 Food Nutritional Dataset

protein

fat

carbs

fiber

sugar

calories

Source:

USDA FoodData Central

8.3 Species Nutritional Requirements Dataset

protein_requirement

fat_tolerance

carb_tolerance

digestive_type

known_sensitivities

Source:

AAFCO standards

NRC guidelines

8.4 Synthetic Training Dataset (Generated)

Derived features:

protein_match_score

fat_match_score

sugar_risk

toxin_flag

digestibility_score

final_grade (A–F label)

9️⃣ Data Preparation Plan (Rubric Aligned)
Data Cleaning:

Remove duplicates

Normalize food names

Handle missing macro values

Outlier detection (calories, macros)

Feature Engineering:

Nutrient match ratio

Toxicity severity encoding

Sugar overload risk formula

Digestibility scoring metric

Data Transformation:

One-hot encoding (species)

Label encoding (grade)

Feature scaling (if needed)

🔟 Exploratory Data Analysis

Visualizations:

Grade distribution histogram

Correlation heatmap

Protein match vs Grade

Sugar risk vs Grade

Toxicity flag vs Grade

Insights:

Which nutrient mismatch impacts grade most?

Species-specific risk patterns?

1️⃣1️⃣ Model Training Strategy

Train-test split: 80–20

5-fold cross-validation

Hyperparameter tuning (GridSearchCV)

Evaluation Metrics:

Accuracy

F1-score

Confusion Matrix

ROC-AUC (if binary unsafe detection)

1️⃣2️⃣ Explainability Module

Use:

SHAP values OR feature importance

Display:

Why grade was assigned

Which features influenced decision most

1️⃣3️⃣ Non-Functional Requirements

Response time < 2 seconds

Scalable to new species

Modular architecture

Explainable predictions

Ethical usage disclaimer

1️⃣4️⃣ Ethical Considerations

System does not replace veterinary advice

Avoid biased dataset (species diversity)

Clearly cite data sources

No medical claims beyond dataset

1️⃣5️⃣ Success Criteria (Evaluation Alignment)

Based on your rubric:

✔ Clear dataset justification
✔ Documented preprocessing
✔ Meaningful feature engineering
✔ EDA insights
✔ Proper algorithm justification
✔ Training validation strategy
✔ Interactive frontend visualization

This hits every evaluation keyword.

🔥 Final Deliverables

Backend ML API

Interactive Graph Website

Trained Model (.pkl file)

Technical Report

Demo Presentation