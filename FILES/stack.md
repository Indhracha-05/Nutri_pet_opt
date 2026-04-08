
# 🐾 PetPedia AI

## Technical Stack & System Architecture Document

---

# 1️⃣ SYSTEM OVERVIEW

PetPedia AI is a hybrid AI system that:

* Uses a Knowledge Graph for biological reasoning
* Uses a Machine Learning model for A–F health grading
* Provides explainable predictions
* Visualizes relationships in an interactive graph-based frontend

---

# 2️⃣ TECH STACK

## 🔹 Frontend Stack

| Layer               | Technology              | Purpose                         |
| ------------------- | ----------------------- | ------------------------------- |
| Framework           | React.js                | UI rendering                    |
| Graph Visualization | Cytoscape.js (or D3.js) | Interactive knowledge graph     |
| Charts              | Chart.js / Recharts     | Feature importance, radar plots |
| Styling             | TailwindCSS             | Clean UI                        |
| State Management    | React Context           | Model response handling         |

Why this works:

* React → component modularity
* Cytoscape → perfect for graph visualization
* Chart.js → ML transparency visuals

---

## 🔹 Backend Stack

| Layer         | Technology          | Purpose                    |
| ------------- | ------------------- | -------------------------- |
| API Framework | FastAPI             | REST backend               |
| ML Library    | Scikit-learn        | Model training & inference |
| Graph Engine  | NetworkX            | Knowledge graph reasoning  |
| Data Handling | Pandas              | Feature engineering        |
| Model Storage | joblib              | Model serialization        |
| Database      | PostgreSQL / SQLite | Dataset storage            |

Why FastAPI?

* High performance
* Easy integration
* Auto Swagger documentation
* Perfect for ML APIs

---

## 🔹 ML Stack

* Random Forest (Primary Model)
* XGBoost (optional comparison)
* GridSearchCV for tuning
* SHAP for explainability

---

# 3️⃣ SYSTEM ARCHITECTURE

## 🏗 High-Level Architecture

```
[ User Interface (React) ]
          ↓
   REST API Request
          ↓
[ FastAPI Backend ]
          ↓
  ┌───────────────────────┐
  │ Knowledge Graph Engine│
  └───────────────────────┘
          ↓
  Feature Extraction Layer
          ↓
  ML Grading Model
          ↓
  Explanation Engine
          ↓
  Response (JSON)
          ↓
[ Frontend Visualization ]
```

---

# 4️⃣ MODULE-LEVEL ARCHITECTURE

---

## 🔹 Module 1: Frontend (Graph-Based UI)

### Responsibilities:

* Accept species + food input
* Display interactive knowledge graph
* Show A–F grade
* Show feature importance visualization
* Display explanation panel

### Components:

1. InputForm Component
2. GraphView Component
3. GradeBadge Component
4. FeatureImportanceChart
5. ExplanationPanel

---

## 🔹 Module 2: API Layer (FastAPI)

Endpoints:

### POST /evaluate

Input:

```
{
  "species": "dog",
  "food": "chocolate"
}
```

Output:

```
{
  "grade": "F",
  "confidence": 0.97,
  "feature_importance": {...},
  "graph_data": {...},
  "explanation": "Chocolate contains theobromine..."
}
```

---

## 🔹 Module 3: Knowledge Graph Engine

Built using NetworkX.

Graph Structure:

Nodes:

* Species
* Food
* Nutrients
* Toxic Compounds

Edges:

* contains
* intolerant_to
* requires
* high_in
* sensitive_to

Responsibilities:

* Identify toxic conflicts
* Extract biological compatibility features
* Generate graph visualization JSON

---

## 🔹 Module 4: Feature Engineering Layer

Generates numeric features:

* toxin_flag
* protein_match_score
* fat_match_score
* carb_tolerance_score
* sugar_risk_score
* digestibility_index
* fiber_compatibility

These become model input vector.

---

## 🔹 Module 5: ML Grading Engine

Model:
Random Forest Classifier

Why:

* Handles nonlinear relationships
* Works well with mixed feature types
* Gives feature importance
* Low overfitting risk

Training Pipeline:

```
Dataset → Cleaning → Feature Engineering
        → Train-Test Split (80–20)
        → Cross Validation
        → Hyperparameter Tuning
        → Evaluation
```

Metrics:

* Accuracy
* F1-score
* Confusion Matrix

Output:

* Grade (A–F)
* Probability distribution

---

## 🔹 Module 6: Explainability Engine

Uses:

* SHAP values OR
* Feature importance from Random Forest

Returns:

* Top 3 influencing factors
* Explanation string

---

# 5️⃣ DATA ARCHITECTURE

## Tables:

### Species Table

* species_id
* name
* protein_requirement
* fat_tolerance
* carb_tolerance
* digestive_type

### Food Table

* food_id
* name
* protein
* fat
* carbs
* fiber
* sugar
* calories

### Toxicity Table

* species_id
* food_id
* toxic_compound
* severity

---

# 6️⃣ DEPLOYMENT ARCHITECTURE

Development:

* Localhost (React + FastAPI)

Production Option:

* Backend → Render / AWS / Railway
* Frontend → Vercel / Netlify
* Database → Supabase / PostgreSQL

---

# 7️⃣ DATA FLOW SEQUENCE

1. User enters species + food
2. Frontend sends POST request
3. Backend loads species + food data
4. Graph engine extracts relationships
5. Feature vector created
6. ML model predicts grade
7. Explainability engine generates reasoning
8. JSON response sent back
9. Frontend renders:

   * Graph
   * Grade badge
   * Feature chart
   * Explanation

---

# 8️⃣ SECURITY & ETHICS

* Input validation
* Prevent SQL injection
* Clear disclaimer:
  “Not a replacement for veterinary consultation.”

---

# 9️⃣ SCALABILITY PLAN

Future upgrades:

* Add more species
* Add dosage-based toxicity
* Add image-based food recognition
* Replace Random Forest with Graph Neural Network

---

# 🔟 WHY THIS ARCHITECTURE IS STRONG

✔ Hybrid AI (Symbolic + ML)
✔ Explainable predictions
✔ Modular design
✔ Scalable
✔ Meets academic rubric
✔ Visually impressive

---

