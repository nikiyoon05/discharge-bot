#!/usr/bin/env python3
"""
Simple script to start the backend API server
"""

import subprocess
import sys
import os

def check_python():
    """Check if Python 3.7+ is available"""
    try:
        result = subprocess.run([sys.executable, '--version'], capture_output=True, text=True)
        print(f"Using Python: {result.stdout.strip()}")
        return True
    except Exception:
        print("Error: Python not found")
        return False

def install_requirements():
    """Install Python requirements"""
    if not os.path.exists('backend/requirements.txt'):
        print("Error: backend/requirements.txt not found")
        return False
    
    print("Installing Python dependencies...")
    try:
        subprocess.run([
            sys.executable, '-m', 'pip', 'install', '-r', 'backend/requirements.txt'
        ], check=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False

def start_server():
    """Start the FastAPI server"""
    print("Starting FastAPI server...")
    print("Server will be available at: http://localhost:8000")
    print("API documentation: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    
    # Change to backend directory
    os.chdir('backend')
    
    try:
        subprocess.run([
            sys.executable, '-m', 'uvicorn', 'main:app', '--reload', '--host', '0.0.0.0', '--port', '8000'
        ], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")

def main():
    """Main function"""
    print("🚀 Bela Backend API Server")
    print("=" * 40)
    
    if not check_python():
        return
    
    if not install_requirements():
        return
    
    start_server()

if __name__ == '__main__':
    main()