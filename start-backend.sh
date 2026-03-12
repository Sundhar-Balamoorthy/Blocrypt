#!/bin/bash
# Start FastAPI backend server

cd "$(dirname "$0")/backend"

# Check if Python virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Start FastAPI server
echo "Starting FastAPI server on http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
