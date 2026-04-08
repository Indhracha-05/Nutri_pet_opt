"""
NutriPet_Opto Main Application Entry Point.

Run with: uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NutriPet_Opto API",
    description="Backend API for NutriPet_Opto: Pet Food Nutritional Analysis System",
    version="1.0.0"
)

# Configure CORS for Frontend (Vite runs on port 5173 by default)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {"message": "Welcome to NutriPet_Opto API", "status": "running"}
