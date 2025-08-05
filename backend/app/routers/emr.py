"""
EMR File Processing Router
Handles EMR file uploads, parsing, and visit summary generation
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Optional
import base64
import os
import logging
from datetime import datetime

# Create an uploads directory if it doesn't exist
os.makedirs("backend/uploads", exist_ok=True)

from ..models.emr import EMRFileUpload, EMRParseResponse, ParsedEMRData
from ..services.emr_parser import EMRParser
from ..services.ai_service import AIService
from ..services.database_service import database_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload", response_model=EMRParseResponse)
async def upload_emr_file(
    upload_data: EMRFileUpload,
    patient_id: str = "patient-001"  # Default patient ID, should come from request
):
    """
    Upload and parse EMR file with persistence
    """
    try:
        logger.info(f"Processing EMR file: {upload_data.filename} ({upload_data.file_type}) for patient {patient_id}")
        
        uploaded_files = {}
        parsed_data = None
        
        # Process EHR file
        if upload_data.ehr_file:
            file_content = base64.b64decode(upload_data.ehr_file.split(',')[1])
            file_path = f"backend/uploads/{patient_id}_ehr_{upload_data.filename}"
            with open(file_path, "wb") as f:
                f.write(file_content)
            uploaded_files["ehr_file"] = file_path
            parsed_data = EMRParser.parse_emr_file(file_content, upload_data.file_type, upload_data.filename)
        
        # Process doctor notes
        if upload_data.notes_file:
            file_content = base64.b64decode(upload_data.notes_file.split(',')[1])
            file_path = f"backend/uploads/{patient_id}_notes_{upload_data.filename}"
            with open(file_path, "wb") as f:
                f.write(file_content)
            uploaded_files["doctor_notes"] = file_content.decode('utf-8', errors='ignore')

        # Process discharge summary
        if upload_data.summary_file:
            file_content = base64.b64decode(upload_data.summary_file.split(',')[1])
            file_path = f"backend/uploads/{patient_id}_summary_{upload_data.filename}"
            with open(file_path, "wb") as f:
                f.write(file_content)
            uploaded_files["discharge_summary"] = file_content.decode('utf-8', errors='ignore')

        # Parse all uploaded files and combine their data
        all_medications = []
        all_clinical_notes = []
        patient_demographics = None
        
        # Parse each file type
        for file_key, file_content in [
            ("ehr_file", upload_data.ehr_file),
            ("notes_file", upload_data.notes_file), 
            ("summary_file", upload_data.summary_file)
        ]:
            if file_content:
                # Decode base64 content
                try:
                    content_bytes = base64.b64decode(file_content.split(',')[1])
                    content_str = content_bytes.decode('utf-8', errors='ignore')
                    
                    # Parse the content
                    file_parsed_data = EMRParser.parse_emr_file(content_str, "text", f"{file_key}.txt")
                    
                    if file_parsed_data:
                        # Combine data from all files
                        if not patient_demographics:
                            patient_demographics = file_parsed_data.patient_demographics
                        all_medications.extend(file_parsed_data.medications)
                        all_clinical_notes.extend(file_parsed_data.clinical_notes)
                        
                except Exception as e:
                    logger.error(f"Error parsing {file_key}: {e}")
        
        # Create combined parsed data
        if not patient_demographics:
            from ..models.emr import PatientDemographics
            patient_demographics = PatientDemographics(
                mrn="12345678",
                name="John Anderson", 
                age=59,
                gender="Male"
            )
        
        parsed_data = ParsedEMRData(
            patient_demographics=patient_demographics,
            conditions=[],
            medications=all_medications,
            vital_signs=[],
            lab_results=[],
            clinical_notes=all_clinical_notes,
            data_source="Combined File Upload",
            parsed_at=datetime.now(),
            total_entries=len(all_medications) + len(all_clinical_notes)
        )
        
        # Generate AI summary of the uploaded documents
        ai_service = AIService()
        visit_summary = ai_service.generate_visit_summary(parsed_data)
        parsed_data.visit_summary = visit_summary
        
        # Save patient data persistently to SQLite database
        logger.info(f"About to save patient data for {patient_id}")
        save_result = database_service.save_patient_data(patient_id, parsed_data, uploaded_files)
        logger.info(f"Database save result: {save_result}")
        
        logger.info(f"Successfully processed and saved patient data for {patient_id}")
        
        return EMRParseResponse(
            success=True,
            message=f"Successfully processed {len(uploaded_files)} files for patient {patient_id}",
            data=parsed_data
        )
        
    except Exception as e:
        logger.error(f"Error processing EMR file {upload_data.filename}: {str(e)}")
        return EMRParseResponse(
            success=False,
            message="Failed to process EMR file",
            error=str(e)
        )

@router.post("/generate-summary")
async def generate_visit_summary(emr_data: dict):
    """
    Generate AI summary from already parsed EMR data
    """
    try:
        ai_service = AIService()
        
        # Convert dict to ParsedEMRData if needed
        if isinstance(emr_data, dict):
            parsed_data = ParsedEMRData(**emr_data)
        else:
            parsed_data = emr_data
            
        visit_summary = await ai_service.generate_visit_summary(parsed_data)
        
        return {
            "success": True,
            "summary": visit_summary
        }
        
    except Exception as e:
        logger.error(f"Error generating visit summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate visit summary: {str(e)}"
        )

@router.get("/patient/{patient_id}/data")
async def get_patient_data(patient_id: str):
    """
    Get stored patient data
    """
    try:
        data = database_service.get_patient_data(patient_id)
        if not data:
            return {"success": False, "message": "No data found for patient"}
        
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Error retrieving patient data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve patient data: {str(e)}"
        )

@router.get("/patient/{patient_id}/status")
async def get_patient_status(patient_id: str):
    """
    Get patient connection status
    """
    try:
        status = database_service.get_patient_status(patient_id)
        return {"status": status}
    except Exception as e:
        logger.error(f"Error retrieving patient status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve patient status: {str(e)}"
        )

@router.get("/patient/{patient_id}/discharge-summary")
async def get_discharge_summary(patient_id: str):
    """
    Get discharge summary text for patient instructions
    """
    try:
        summary = database_service.get_discharge_summary(patient_id)
        return {"discharge_summary": summary}
    except Exception as e:
        logger.error(f"Error retrieving discharge summary: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve discharge summary: {str(e)}"
        )
