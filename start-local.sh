#!/bin/bash

# BTC Liquidity Heatmap - Local Development Startup Script
# Starts all services for local development

set -e

echo "🚀 Starting BTC Liquidity Heatmap (Local Development)"
echo "======================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Redis is running
echo -e "\n${YELLOW}1. Checking Redis...${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not running${NC}"
    echo -e "${YELLOW}Starting Redis...${NC}"

    # Try to start Redis
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes
        sleep 2
        if redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis started${NC}"
        else
            echo -e "${RED}❌ Failed to start Redis${NC}"
            echo "Please start Redis manually: redis-server"
            exit 1
        fi
    else
        echo -e "${RED}Redis not installed. Please install:${NC}"
        echo "  Ubuntu/Debian: sudo apt-get install redis-server"
        echo "  macOS: brew install redis"
        echo "  Windows: Download from https://github.com/microsoftarchive/redis/releases"
        exit 1
    fi
fi

# Check Python
echo -e "\n${YELLOW}2. Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ $PYTHON_VERSION${NC}"
else
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi

# Check Node.js
echo -e "\n${YELLOW}3. Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Setup Backend
echo -e "\n${YELLOW}4. Setting up Backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -q -r requirements.txt

echo -e "${GREEN}✅ Backend setup complete${NC}"

# Setup Frontend
echo -e "\n${YELLOW}5. Setting up Frontend...${NC}"
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Create .env if not exists
cd ..
if [ ! -f ".env" ]; then
    echo -e "\n${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env created${NC}"
fi

# Start services
echo -e "\n${GREEN}======================================================"
echo "🎉 Setup Complete! Starting services..."
echo "======================================================${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

trap cleanup EXIT INT TERM

# Start Backend
echo -e "\n${YELLOW}Starting Backend (FastAPI)...${NC}"
cd backend
source venv/bin/activate
python -m backend.main > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    echo -e "   URL: ${GREEN}http://localhost:8000${NC}"
    echo -e "   Docs: ${GREEN}http://localhost:8000/docs${NC}"
else
    echo -e "${RED}❌ Backend failed to start${NC}"
    cat logs/backend.log
    exit 1
fi

# Start Frontend
echo -e "\n${YELLOW}Starting Frontend (Vite + React)...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
    echo -e "   URL: ${GREEN}http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    cat logs/frontend.log
    exit 1
fi

# Display info
echo -e "\n${GREEN}======================================================"
echo "✅ BTC Liquidity Heatmap is running!"
echo "======================================================"
echo -e "\n📊 ${YELLOW}Access the application:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "   API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "\n📝 ${YELLOW}Logs:${NC}"
echo -e "   Backend:  tail -f logs/backend.log"
echo -e "   Frontend: tail -f logs/frontend.log"
echo -e "\n⚠️  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo "======================================================"

# Keep script running and show logs
tail -f logs/backend.log logs/frontend.log
