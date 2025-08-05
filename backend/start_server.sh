#!/bin/bash

# Kill any existing processes on port 8000
echo "Clearing port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "Port 8000 was already free"

# Wait a moment
sleep 2

# Start the server
echo "Starting Bela Discharge Planning API on port 8000..."
cd "$(dirname "$0")"
python -m uvicorn main:app --reload --port 8000 --host 127.0.0.1

echo "Server stopped."