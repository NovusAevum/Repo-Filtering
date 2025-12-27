#!/bin/bash

# Replit Production Finder Startup Script

echo "🚀 Starting Replit Production Finder..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one based on .env.example"
    echo "📋 Copying .env.example to .env..."
    cp .env.example .env
    echo "✏️  Please edit .env file with your API keys before running the application"
fi

# Install Node.js dependencies
echo "📥 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

# Start backend in background
echo "🖥️  Starting Flask backend..."
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🌐 Starting React frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Application started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🖥️  Backend: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait