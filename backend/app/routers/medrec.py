"""
Medication Reconciliation Router
Handles AI-powered analysis of medication lists
"""

from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel

from ..services.ai_service import AIService
from ..services.database_service import database_service
from ..models.emr import Medication

class MedRecSubmission(BaseModel):
    medications: List[Medication]
    patient_id: str

router = APIRouter()

@router.post("/analyze")
async def analyze_medication_list(submission: MedRecSubmission):
    """
    Analyze a list of reconciled medications for potential issues
    """
    try:
        ai_service = AIService()
        # Convert Medication objects to dictionaries
        medications_dict = [med.dict() for med in submission.medications]
        analysis = await ai_service.analyze_medication_list(medications_dict)
        
        # Save analysis results to database
        database_service.save_medication_analysis(submission.patient_id, analysis)
        
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze medication list: {str(e)}"
        )
