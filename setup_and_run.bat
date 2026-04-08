@echo off
echo ==========================================
echo   Setting up and Starting NutriPet_Opto
echo ==========================================

echo [1/5] Installing Backend Dependencies...
pip install -r NUTRIPET_OPTO/backend/requirements.txt

echo [2/5] Installing Frontend Dependencies...
cd NUTRIPET_OPTO/frontend
call npm install
cd ../..

echo [3/5] Rebuilding Database (with food categories)...
cd NUTRIPET_OPTO/backend
if exist nutripet_v2.db del nutripet_v2.db
python scripts/seed_db.py
cd ../..

echo [4/5] Launching Backend API...
start "NutriPet Backend" cmd /k "cd NUTRIPET_OPTO/backend && python -m uvicorn app.main:app --reload --port 8000"

echo [5/5] Launching Frontend...
start "NutriPet Frontend" cmd /k "cd NUTRIPET_OPTO/frontend && npm run dev"

echo ==========================================
echo   App running at: http://localhost:5173
echo   API running at: http://localhost:8000
echo ==========================================
pause
