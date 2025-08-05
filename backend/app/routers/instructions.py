"""
Patient Instructions Router
Handles the generation of patient-friendly discharge instructions
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from ..models.emr import ParsedEMRData
from ..services.ai_service import AIService

router = APIRouter()

from pydantic import BaseModel

class InstructionRequest(BaseModel):
    emr_data: dict
    literacy_level: str = "high-school"
    language: str = "en"

@router.post("/generate-instructions")
async def generate_instructions(request: InstructionRequest):
    """
    Generate patient-friendly discharge instructions from EMR data
    """
    try:
        ai_service = AIService()
        
        # Extract patient info from emr_data dict
        patient_demographics = request.emr_data.get('patient_demographics', {})
        patient_id = patient_demographics.get('mrn', 'unknown')
        
        instructions = await ai_service.generate_discharge_instructions(
            patient_id=patient_id,
            literacy_level=request.literacy_level,
            language=request.language,
            emr_data=request.emr_data
        )
        return {"instructions": instructions}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate instructions: {str(e)}"
        )

@router.get("/languages")
async def get_languages():
    """
    Get a list of available languages for translation
    """
    return [
        {"code": "en", "name": "English", "nativeName": "English"},
        {"code": "es", "name": "Spanish", "nativeName": "Español"},
        {"code": "fr", "name": "French", "nativeName": "Français"},
        {"code": "de", "name": "German", "nativeName": "Deutsch"},
        {"code": "zh", "name": "Chinese", "nativeName": "中文"},
    ]
