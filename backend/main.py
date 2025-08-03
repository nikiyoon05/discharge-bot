"""
CareExit Discharge Planning Bot - Python Backend
Integrates with Epic EMR via FHIR APIs for intelligent discharge planning
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our modules
from app.routers import fhir, discharge, ai_services
from app.core.config import settings
from app.core.database import engine, create_tables

app = FastAPI(
    title="CareExit Discharge Planning API",
    description="AI-powered discharge planning system with Epic EMR integration",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(fhir.router, prefix="/api/fhir", tags=["FHIR Integration"])
app.include_router(discharge.router, prefix="/api/discharge", tags=["Discharge Planning"])
app.include_router(ai_services.router, prefix="/api/ai", tags=["AI Services"])

@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    create_tables()
    print("🏥 CareExit Discharge Planning API started successfully!")

@app.get("/")
async def root():
    return {
        "message": "CareExit Discharge Planning API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "database": "connected",
            "epic_fhir": "available",
            "ai_services": "ready"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)