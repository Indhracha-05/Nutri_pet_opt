@echo off
echo ==========================================
echo   Starting NutriPet_Opto System
echo ==========================================

echo [1/2] Launching Backend API (Port 8000)...
start "NutriPet Backend" cmd /k "cd backend && uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Frontend (Port 5173)...
start "NutriPet Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo   Success! App running at:
echo   http://localhost:5173
echo ==========================================
pause
