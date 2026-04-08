# NutriPet_Opto: System Walkthrough

## 🚀 How to Run
The easiest way to launch the full system is using the provided batch script:

1.  Navigate to the project root: `d:\Git Projects\nutri_pet_opt\`
2.  Double-click **`run_app.bat`**.
3.  The app will open at **http://localhost:5173**.

*(Alternatively, run backend via `uvicorn app.main:app` and frontend via `npm run dev`)*

## 🧠 Usage Guide

### 1. The Dashboard
- **Select Species:** Choose from 8 supported species (e.g., Dog, Cat, Rabbit).
- **Select Food:** Choose from 100+ food items (e.g., Chicken Breast, Chocolate).
- **Click "Evaluate":** The system runs the ML pipeline in real-time.

### 2. Understanding Results
- **Health Grade:** A huge letter grade (A–F) indicates overall compatibility.
- **Toxicity Alert:** If the food is toxic (e.g., Chocolate for Dogs), a red warning box appears explaining *why* (e.g., "Contains Theobromine").
- **Explanation:** A natural-language summary of the nutritional pros/cons.

### 3. Visualizations
- **Nutrient Radar (Left):** Shows how well the food matches the species' needs (Protein, Fat, fiber, etc.). A full shape means a better match.
- **Knowledge Graph (Bottom/Right):** Interactive network graph showing the direct relationship between the Species and the Food.
    - **Green Edge:** Essential nutrient source.
    - **Red Edge:** Toxic or intolerant relationship.

## 📂 Codebase Overview

### Backend (`/backend`)
- **`ml/`**: The core intelligence.
    - `generate_dataset.py`: Creates the synthetic training data.
    - `preprocess.py`: Cleans and transforms data.
    - `model_training.py`: Trains the Random Forest model.
    - `explainability.py`: Generates the "why" behind the grade.
- **`app/`**: The API logic.
    - `main.py`: Entry point.
    - `routes.py`: Endpoints (`POST /evaluate`).
    - `knowledge_graph.py`: Graph creation logic.

### Frontend (`/frontend`)
- **`src/components/`**: React UI components.
    - `InputForm.jsx`: User selection.
    - `AnalysisResult.jsx`: The main display logic.
    - `NutrientRadar.jsx`: Chart.js visualization.
    - `GraphView.jsx`: Cytoscape.js visualization.
