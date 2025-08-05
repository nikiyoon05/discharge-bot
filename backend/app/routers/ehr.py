"""
EHR Router
Handles writing data back to the EHR
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

class Appointment(BaseModel):
    date: str
    time: str
    provider: str
    confirmationNumber: str

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/write-appointment")
async def write_appointment(appointment: Appointment):
    """
    Write appointment details to the EHR
    """
    try:
        logger.info(f"Writing appointment to EHR: {appointment.dict()}")
        # In a real implementation, this would call the Epic API to write the appointment
        return {"status": "success", "message": "Appointment written to EHR successfully"}
    except Exception as e:
        logger.error(f"Failed to write appointment to EHR: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to write appointment to EHR: {str(e)}"
        )
