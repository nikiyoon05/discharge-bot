"""
EMR Data Models
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class EMRFileUpload(BaseModel):
    """Model for EMR file upload request"""
    ehr_file: Optional[str] = None
    notes_file: Optional[str] = None
    summary_file: Optional[str] = None
    filename: str
    file_type: str

class PatientDemographics(BaseModel):
    """Patient demographic information"""
    mrn: str
    name: str
    age: int
    gender: str
    birth_date: Optional[str] = None
    admission_date: Optional[str] = None
    attending_physician: Optional[str] = None

class Condition(BaseModel):
    """Medical condition/diagnosis"""
    code: Optional[str] = None
    display: str
    text: Optional[str] = None
    onset_date: Optional[datetime] = None
    clinical_status: Optional[str] = None

class Medication(BaseModel):
    """Medication information"""
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    status: Optional[str] = None

class VitalSign(BaseModel):
    """Vital sign measurement"""
    type: str
    value: str
    unit: Optional[str] = None
    timestamp: datetime
    status: str = "normal"

class LabResult(BaseModel):
    """Laboratory result"""
    test_name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    status: str = "normal"
    date: datetime

class ClinicalNote(BaseModel):
    """Clinical note or observation"""
    type: str
    author: str
    content: str
    timestamp: datetime
    relevant_for_discharge: bool = False

class VisitSummary(BaseModel):
    """AI-generated visit summary"""
    visit_date: datetime
    visit_type: str
    chief_complaint: Optional[str] = None
    assessment_and_plan: str
    key_findings: List[str]
    discharge_readiness_factors: List[str]
    follow_up_recommendations: List[str]
    risk_factors: List[str]
    medication_changes: List[str]

class ParsedEMRData(BaseModel):
    """Complete parsed EMR data"""
    patient_demographics: PatientDemographics
    conditions: List[Condition]
    medications: List[Medication]
    vital_signs: List[VitalSign]
    lab_results: List[LabResult]
    clinical_notes: List[ClinicalNote]
    visit_summary: Optional[VisitSummary] = None
    data_source: str
    parsed_at: datetime
    total_entries: int

class EMRParseResponse(BaseModel):
    """Response from EMR parsing API"""
    success: bool
    message: str
    data: Optional[ParsedEMRData] = None
    error: Optional[str] = None