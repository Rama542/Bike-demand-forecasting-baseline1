#!/bin/bash

echo "Starting Bike Rental Optimization Platform..."

# 1. Start Node Express Backend
echo "Starting Node Express Backend on port 4000..."
cd backend || exit
node index.js &
NODE_PID=$!
cd ..

# 2. Start Python ML Backend (api.py)
echo "Starting FastAPI ML Backend on port 5000..."
cd backend || exit
source ../.venv/bin/activate
python api.py &
API_PID=$!
cd ..

# 3. Start React frontend
echo "Starting VeloAI Frontend..."
cd frontend || exit
npm run dev &
VITE_PID=$!
cd ..

echo "All services started!"
echo "Access the application at http://localhost:8080"
echo "Press CTRL+C to stop all services."

# Trap SIGINT to stop scripts nicely
trap "kill $API_PID $NODE_PID $VITE_PID 2>/dev/null" EXIT

wait
