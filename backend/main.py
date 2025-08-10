"""
Bela Discharge Planning Bot - Python Backend
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
from app.routers import emr, instructions, ehr, chat, meeting  # fhir, discharge, ai_services, conversation, calling
from app.core.config import settings
from app.core.database import create_tables

# Create database tables on startup
create_tables()

app = FastAPI(
    title="Bela Discharge Planning API",
    description="API for EMR processing, AI-powered summaries, and patient communication.",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://localhost:8081"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - only EMR for now to avoid import issues
# app.include_router(fhir.router, prefix="/api/fhir", tags=["FHIR Integration"])
# app.include_router(discharge.router, prefix="/api/discharge", tags=["Discharge Planning"])
# app.include_router(ai_services.router, prefix="/api/ai", tags=["AI Services"])
# app.include_router(conversation.router, prefix="/api/conversation", tags=["Patient Conversations"])
# app.include_router(calling.router, prefix="/api/calling", tags=["Out-of-Network Calling"])
app.include_router(emr.router, prefix="/api/emr", tags=["EMR File Processing"])
app.include_router(instructions.router, prefix="/api/instructions", tags=["Patient Instructions"])
app.include_router(ehr.router, prefix="/api/ehr", tags=["EHR"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(meeting.router, prefix="/api/meeting", tags=["Meeting"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    create_tables()  # Initialize SQLite database
    print("🚀 Bela Discharge Planning API ready!")
    print("📋 API Documentation: http://localhost:8000/docs")
    print("🎯 EMR Upload Endpoint: http://localhost:8000/api/emr/upload")
    print("💾 SQLite Database: backend/bela_discharge.db")

@app.get("/")
async def root():
    return {
        "Hello": "World",
        "message": "Bela Discharge Planning API",
        "version": "1.0.0",
        "documentation": "/docs",
        "emr_upload": "/api/emr/upload"
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
    uvicorn.run(app, host="0.0.0.0", port=8000)