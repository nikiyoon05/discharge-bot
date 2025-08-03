"""
Pydantic models for discharge planning data structures
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DischargeComplexity(str, Enum):
    SIMPLE = "simple"
    MODERATE = "moderate" 
    COMPLEX = "complex"

class DischargeDisposition(str, Enum):
    HOME = "home"
    HOME_HEALTH = "home_health"
    SNF = "skilled_nursing_facility"
    REHAB = "inpatient_rehabilitation"
    LTAC = "long_term_acute_care"
    HOSPICE = "hospice"
    AMA = "against_medical_advice"

class PatientComplexityFactors(BaseModel):
    """Factors that contribute to discharge complexity"""
    clinical_factors: List[str] = []
    behavioral_factors: List[str] = []
    social_factors: List[str] = []
    functional_factors: List[str] = []
    complexity_score: float = Field(ge=0, le=100)

class DischargeReadiness(BaseModel):
    """Assessment of patient readiness for discharge"""
    clinical_stability: bool
    medication_reconciled: bool
    patient_education_complete: bool
    equipment_arranged: bool
    followup_scheduled: bool
    transportation_confirmed: bool
    overall_ready: bool
    barriers: List[str] = []

class DischargePlan(BaseModel):
    """Comprehensive discharge plan"""
    patient_id: str
    encounter_id: str
    planned_disposition: DischargeDisposition
    complexity_assessment: PatientComplexityFactors
    readiness_assessment: DischargeReadiness
    
    # Clinical Information
    primary_diagnosis: str
    secondary_diagnoses: List[str] = []
    discharge_medications: List[Dict[str, Any]] = []
    
    # Care Coordination
    follow_up_appointments: List[Dict[str, Any]] = []
    home_health_orders: List[str] = []
    equipment_needs: List[str] = []
    
    # Patient Instructions
    discharge_instructions: Optional[str] = None
    patient_education_materials: List[str] = []
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    created_by: str
    status: str = "draft"

class DischargeRiskPrediction(BaseModel):
    """AI-powered risk prediction for discharge outcomes"""
    patient_id: str
    readmission_risk_score: float = Field(ge=0, le=100)
    risk_factors: List[str]
    recommended_interventions: List[str]
    confidence_score: float = Field(ge=0, le=1)
    model_version: str

class DischargeWorkflowTask(BaseModel):
    """Individual task in discharge workflow"""
    task_id: str
    patient_id: str
    task_type: str
    description: str
    assigned_to: str
    due_date: datetime
    status: str = "pending"  # pending, in_progress, completed, overdue
    priority: str = "medium"  # low, medium, high, urgent
    dependencies: List[str] = []