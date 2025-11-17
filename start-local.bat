@echo off
REM BTC Liquidity Heatmap - Local Development Startup Script (Windows)
REM Starts all services for local development

echo ========================================
echo Starting BTC Liquidity Heatmap (Local)
echo ========================================

REM Check Redis
echo.
echo [1/5] Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Redis is running
) else (
    echo [ERROR] Redis is not running
    echo Please start Redis manually:
    echo   1. Download from: https://github.com/microsoftarchive/redis/releases
    echo   2. Extract and run: redis-server.exe
    pause
    exit /b 1
)

REM Check Python
echo.
echo [2/5] Checking Python...
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python is installed
) else (
    echo [ERROR] Python not found
    echo Please install Python 3.11+
    pause
    exit /b 1
)

REM Check Node.js
echo.
echo [3/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js is installed
) else (
    echo [ERROR] Node.js not found
    echo Please install Node.js 18+
    pause
    exit /b 1
)

REM Setup Backend
echo.
echo [4/5] Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -q -r requirements.txt

echo [OK] Backend setup complete
cd ..

REM Setup Frontend
echo.
echo [5/5] Setting up Frontend...
cd frontend

if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
) else (
    echo [OK] Dependencies already installed
)
cd ..

REM Create .env
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

REM Create logs directory
if not exist "logs" mkdir logs

echo.
echo ========================================
echo Setup Complete! Starting services...
echo ========================================

REM Start Backend
echo.
echo Starting Backend (FastAPI)...
cd backend
start "BTC Heatmap - Backend" cmd /k "venv\Scripts\activate && python -m backend.main"
cd ..

REM Wait for backend
timeout /t 3 /nobreak >nul

REM Start Frontend
echo.
echo Starting Frontend (Vite + React)...
cd frontend
start "BTC Heatmap - Frontend" cmd /k "npm run dev"
cd ..

REM Wait for frontend
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo BTC Liquidity Heatmap is running!
echo ========================================
echo.
echo Access the application:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo Press any key to open in browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo To stop services, close the terminal windows
echo ========================================
pause
