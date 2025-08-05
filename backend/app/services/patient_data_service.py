"""
Patient Data Service
Handles persistent storage and retrieval of patient data
"""

from typing import Dict, Optional, Any
import json
import os
from datetime import datetime
from ..models.emr import ParsedEMRData, EMRParseResponse

class PatientDataService:
    """Service for managing patient data persistence"""
    
    def __init__(self):
        self.data_dir = "backend/patient_data"
        os.makedirs(self.data_dir, exist_ok=True)
        
    def save_patient_data(self, patient_id: str, emr_data: ParsedEMRData, uploaded_files: Dict[str, str] = None) -> bool:
        """Save patient EMR data and uploaded files"""
        try:
            patient_file = os.path.join(self.data_dir, f"{patient_id}.json")
            
            # Convert to dict for JSON serialization
            data_dict = {
                "patient_id": patient_id,
                "emr_data": emr_data.dict(),
                "uploaded_files": uploaded_files or {},
                "last_updated": datetime.now().isoformat(),
                "status": "connected"
            }
            
            with open(patient_file, 'w') as f:
                json.dump(data_dict, f, indent=2, default=str)
                
            return True
        except Exception as e:
            print(f"Error saving patient data: {e}")
            return False
    
    def get_patient_data(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve patient data"""
        try:
            patient_file = os.path.join(self.data_dir, f"{patient_id}.json")
            
            if not os.path.exists(patient_file):
                return None
                
            with open(patient_file, 'r') as f:
                data = json.load(f)
                
            return data
        except Exception as e:
            print(f"Error loading patient data: {e}")
            return None
    
    def get_patient_status(self, patient_id: str) -> str:
        """Get patient connection status"""
        data = self.get_patient_data(patient_id)
        if data:
            return data.get("status", "not-connected")
        return "not-connected"
    
    def get_discharge_summary(self, patient_id: str) -> Optional[str]:
        """Get discharge summary text from uploaded files"""
        data = self.get_patient_data(patient_id)
        if data and "uploaded_files" in data:
            return data["uploaded_files"].get("discharge_summary")
        return None
    
    def update_patient_status(self, patient_id: str, status: str) -> bool:
        """Update patient status"""
        try:
            data = self.get_patient_data(patient_id)
            if data:
                data["status"] = status
                data["last_updated"] = datetime.now().isoformat()
                
                patient_file = os.path.join(self.data_dir, f"{patient_id}.json")
                with open(patient_file, 'w') as f:
                    json.dump(data, f, indent=2, default=str)
                return True
        except Exception as e:
            print(f"Error updating patient status: {e}")
        return False

# Global instance
patient_data_service = PatientDataService()