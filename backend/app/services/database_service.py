"""
Database Service for Patient Data Management
Replaces the JSON file-based storage with proper SQLite database
"""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime
import json
import os
import logging

from ..core.database import SessionLocal, Patient, MedicationAnalysis, PatientInstructions
from ..models.emr import ParsedEMRData

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for managing patient data in SQLite database"""
    
    def __init__(self):
        self.uploads_dir = "uploads"
        os.makedirs(self.uploads_dir, exist_ok=True)
    
    def get_db(self) -> Session:
        """Get database session"""
        return SessionLocal()
    
    def save_patient_data(
        self, 
        patient_id: str, 
        emr_data: ParsedEMRData, 
        uploaded_files: Dict[str, str] = None
    ) -> bool:
        """Save patient EMR data and uploaded files to database"""
        db = self.get_db()
        try:
            # Check if patient exists by ID or MRN
            patient = db.query(Patient).filter(
                (Patient.id == patient_id) | (Patient.mrn == emr_data.patient_demographics.mrn)
            ).first()
            
            if not patient:
                # Create new patient
                patient = Patient(
                    id=patient_id,
                    name=emr_data.patient_demographics.name,
                    mrn=emr_data.patient_demographics.mrn,
                    status="connected"
                )
                db.add(patient)
            else:
                # Update existing patient info
                patient.id = patient_id  # Update ID in case it was found by MRN
                patient.name = emr_data.patient_demographics.name
                patient.mrn = emr_data.patient_demographics.mrn
            
            # Update EMR data - convert datetime objects to strings for JSON serialization
            emr_dict = emr_data.dict()
            # Convert datetime objects to ISO strings
            if 'parsed_at' in emr_dict:
                emr_dict['parsed_at'] = emr_dict['parsed_at'].isoformat() if emr_dict['parsed_at'] else None
            if 'visit_summary' in emr_dict and emr_dict['visit_summary']:
                if 'visit_date' in emr_dict['visit_summary']:
                    emr_dict['visit_summary']['visit_date'] = emr_dict['visit_summary']['visit_date'].isoformat() if emr_dict['visit_summary']['visit_date'] else None
            # Convert clinical notes timestamps
            if 'clinical_notes' in emr_dict:
                for note in emr_dict['clinical_notes']:
                    if 'timestamp' in note and note['timestamp']:
                        note['timestamp'] = note['timestamp'].isoformat() if hasattr(note['timestamp'], 'isoformat') else note['timestamp']
            
            patient.emr_data = emr_dict
            patient.status = "connected"
            patient.updated_at = datetime.utcnow()
            
            # Save uploaded files to disk and store paths
            if uploaded_files:
                if uploaded_files.get("ehr_file"):
                    file_path = f"{self.uploads_dir}/{patient_id}_ehr.json"
                    with open(file_path, 'w') as f:
                        json.dump({"content": uploaded_files["ehr_file"]}, f)
                    patient.ehr_file_path = file_path
                
                if uploaded_files.get("doctor_notes"):
                    file_path = f"{self.uploads_dir}/{patient_id}_notes.txt"
                    with open(file_path, 'w') as f:
                        f.write(uploaded_files["doctor_notes"])
                    patient.doctor_notes_path = file_path
                
                if uploaded_files.get("discharge_summary"):
                    file_path = f"{self.uploads_dir}/{patient_id}_summary.txt"
                    with open(file_path, 'w') as f:
                        f.write(uploaded_files["discharge_summary"])
                    patient.discharge_summary_path = file_path
            
            db.commit()
            logger.info(f"Successfully saved patient data to database for {patient_id}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving patient data: {e}")
            print(f"Error saving patient data: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            db.close()
    
    def get_patient_data(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve patient data from database"""
        db = self.get_db()
        try:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            
            if not patient:
                return None
            
            # Load uploaded file contents
            uploaded_files = {}
            if patient.ehr_file_path and os.path.exists(patient.ehr_file_path):
                with open(patient.ehr_file_path, 'r') as f:
                    uploaded_files["ehr_file"] = json.load(f).get("content", "")
            
            if patient.doctor_notes_path and os.path.exists(patient.doctor_notes_path):
                with open(patient.doctor_notes_path, 'r') as f:
                    uploaded_files["doctor_notes"] = f.read()
            
            if patient.discharge_summary_path and os.path.exists(patient.discharge_summary_path):
                with open(patient.discharge_summary_path, 'r') as f:
                    uploaded_files["discharge_summary"] = f.read()
            
            return {
                "patient_id": patient.id,
                "emr_data": patient.emr_data,
                "uploaded_files": uploaded_files,
                "status": patient.status,
                "last_updated": patient.updated_at.isoformat() if patient.updated_at else None
            }
            
        except Exception as e:
            print(f"Error loading patient data: {e}")
            return None
        finally:
            db.close()
    
    def get_patient_status(self, patient_id: str) -> str:
        """Get patient connection status"""
        db = self.get_db()
        try:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            return patient.status if patient else "not-connected"
        finally:
            db.close()
    
    def get_discharge_summary(self, patient_id: str) -> Optional[str]:
        """Get discharge summary text for patient"""
        db = self.get_db()
        try:
            patient = db.query(Patient).filter(Patient.id == patient_id).first()
            
            if not patient or not patient.discharge_summary_path:
                return None
            
            if os.path.exists(patient.discharge_summary_path):
                with open(patient.discharge_summary_path, 'r') as f:
                    return f.read()
            
            return None
        finally:
            db.close()
    
    def save_medication_analysis(
        self, 
        patient_id: str, 
        analysis: Dict[str, Any]
    ) -> bool:
        """Save medication analysis results"""
        db = self.get_db()
        try:
            med_analysis = MedicationAnalysis(
                patient_id=patient_id,
                interactions=analysis.get("interactions", []),
                duplicates=analysis.get("duplicates", []),
                clinical_concerns=analysis.get("clinical_concerns", []),
                summary=analysis.get("summary", "")
            )
            db.add(med_analysis)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error saving medication analysis: {e}")
            return False
        finally:
            db.close()
    
    def save_patient_instructions(
        self,
        patient_id: str,
        original_instructions: str,
        translated_instructions: str = None,
        language: str = "en",
        literacy_level: str = "high-school"
    ) -> bool:
        """Save patient instructions"""
        db = self.get_db()
        try:
            instructions = PatientInstructions(
                patient_id=patient_id,
                original_instructions=original_instructions,
                translated_instructions=translated_instructions,
                language=language,
                literacy_level=literacy_level
            )
            db.add(instructions)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error saving patient instructions: {e}")
            return False
        finally:
            db.close()

# Global instance
database_service = DatabaseService()

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_patient_summary(patient_id: str) -> str:
    """
    Generates a brief, human-readable summary of a patient's EMR data
    for use in AI prompts.
    """
    db_service = DatabaseService()
    patient_data = db_service.get_patient_data(patient_id)

    if not patient_data or not patient_data.get("emr_data"):
        return "No EMR data found for this patient."

    emr = patient_data["emr_data"]
    demographics = emr.get("patient_demographics", {})
    summary_points = [
        f"Patient: {demographics.get('name', 'N/A')}, MRN: {demographics.get('mrn', 'N/A')}",
    ]

    # Add conditions
    conditions = emr.get("conditions", [])
    if conditions:
        condition_names = [c.get('description', 'N/A') for c in conditions[:3]]
        summary_points.append(f"Primary Conditions: {', '.join(condition_names)}")

    # Add medications
    meds = emr.get("medications", [])
    if meds:
        med_names = [m.get('medication_name', 'N/A') for m in meds[:3]]
        summary_points.append(f"Key Medications: {', '.join(med_names)}")

    # Add key note
    notes = emr.get("clinical_notes", [])
    if notes:
        summary_points.append(f"Recent Note: {notes[0].get('content', 'N/A')[:100]}...")

    return "\n".join(summary_points)
