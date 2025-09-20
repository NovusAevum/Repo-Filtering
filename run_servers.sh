#!/bin/bash

# Script to run both backend and frontend servers

echo "🚀 Starting Replit Production Finder..."

# Kill any existing processes on ports 3000 and 5000
echo "🔄 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Wait a moment for processes to fully stop
sleep 2

# Create log directory
mkdir -p logs

echo "🔧 Starting Backend Server (Flask)..."
# Export env vars from .env (no secrets echoed)
set -a
if [ -f .env ]; then
  # shellcheck disable=SC1091
  source .env
fi
# Ensure default PORT=5000 for dev
export PORT=${PORT:-5000}
set +a

# Start backend server
source venv/bin/activate && python app.py > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

echo "🎨 Starting Frontend Server (Vite)..."
# Start frontend server
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo ""
echo "🌟 Servers Started Successfully!"
echo ""
echo "📊 Backend API: http://localhost:5000"
echo "🎯 Frontend UI: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🔍 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "⚡ To stop servers: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped."
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Show real-time logs
echo "📺 Showing live logs (Ctrl+C to stop):"
echo ""
tail -f logs/backend.log logs/frontend.log
