#!/bin/bash

echo "Starting Bike Rental Optimization Platform..."

# 1. Setup & Start Node Express Backend
echo "Checking Backend dependencies..."
cd backend || exit
if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
fi
echo "Starting Node Express Backend on port 5000..."
node index.js &
NODE_PID=$!
cd ..

# 2. Setup & Start Python ML Backend
echo "Checking Python ML Backend setup..."
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment and installing dependencies..."
    $PYTHON_CMD -m venv .venv
    source .venv/bin/activate
    pip install fastapi uvicorn pandas numpy scikit-learn
else
    source .venv/bin/activate
fi

echo "Starting FastAPI ML Backend on port 8000..."
cd backend || exit
$PYTHON_CMD api.py &
API_PID=$!
cd ..

# 3. Setup & Start React frontend
echo "Checking Frontend dependencies..."
cd frontend || exit
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install --legacy-peer-deps
fi
echo "Starting VeloAI Frontend..."
npm run dev &
VITE_PID=$!
cd ..

echo "All services started!"
echo "Access the application at http://localhost:8080 or port 5173"
echo "Press CTRL+C to stop all services."

# Trap SIGINT to stop scripts nicely
trap "kill $API_PID $NODE_PID $VITE_PID 2>/dev/null" EXIT

wait
