# 🐾 NutriPet_Opto: Pet Food Analysis System

NutriPet_Opto is a hybrid AI system designed to ensure your pets are eating safely and healthily. It combines a **Knowledge Graph** for guaranteed safety checks (toxicity) with **Machine Learning** for nutritional grading (A–F), providing actionable health insights for various pet species.

---

## 🚀 Quick Start

To set up and run the entire system (Backend & Frontend) on Windows:

1.  Open your terminal in the project root.
2.  Run the automated setup script:
    ```bash
    .\setup_and_run.bat
    ```
3.  Access the application:
    - **Web Interface**: [http://localhost:5173](http://localhost:5173)
    - **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ✨ Features

- **Toxicity Detection**: Uses a Knowledge Graph to provide a 100% guarantee on identifying known toxic ingredients for specific species (e.g., Chocolate for Dogs, Lilies for Cats).
- **Nutritional Grading**: A Machine Learning model (Random Forest) evaluates food based on:
    - Protein Match Score (Species-specific requirements)
    - Sugar Risk (Glycemic Index considerations)
    - Bioavailability
    - Fiber and Calories
- **Food Category Analysis**: Compare multiple foods within a category (e.g., "Meat", "Vegetables") to find the best options for your pet.
- **Explainable AI**: Every health grade comes with clear reasons (e.g., "High Sugar Risk", "Excellent Protein Content").

---

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI**: Provides a high-performance REST API.
- **SQLite + SQLAlchemy**: Persistent storage for species requirements and food data.
- **Machine Learning**: Random Forest Classifier trained on veterinary nutritional heuristics.
- **Knowledge Graph**: Rule-based engine for critical safety checks.

### Frontend (React/Vite)
- **Modern UI**: Built with React and Vanilla CSS for a premium look.
- **Dynamic Feedback**: Real-time analysis results with visual indicators.

---

## 📂 Project Structure

- `NUTRIPET_OPTO/backend`: Python FastAPI code, models, and database scripts.
- `NUTRIPET_OPTO/frontend`: React source code and assets.
- `setup_and_run.bat`: One-click deployment script.
- `DATABASES/`: Storage for the SQLite database.

---

## 🛠️ Requirements

- **Python 3.10+**
- **Node.js 18+**
- **npm** (comes with Node.js)

---

## ⚖️ Disclaimer

*This tool uses AI models and public databases for educational and informational purposes. Always consult a professional veterinarian for dietary advice concerning your pets.*
