"""
Discharge Planning API Routes
Core discharge planning workflow automation
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import asyncio
from datetime import datetime

from app.models.discharge import (
    DischargePlan, 
    DischargeRiskPrediction, 
    DischargeComplexity,
    DischargeWorkflowTask
)
from app.services.discharge_service import DischargeService
from app.services.ai_service import AIService

router = APIRouter()

@router.post("/plan", response_model=DischargePlan)
async def create_discharge_plan(
    patient_id: str,
    encounter_id: str,
    discharge_service: DischargeService = Depends()
):
    """
    Create a comprehensive discharge plan for a patient
    Integrates Epic FHIR data with AI-powered assessments
    """
    try:
        # Get patient data from Epic FHIR
        patient_data = await discharge_service.get_patient_clinical_data(patient_id)
        
        # Assess discharge complexity using AI
        complexity_assessment = await discharge_service.assess_discharge_complexity(patient_data)
        
        # Generate discharge plan
        discharge_plan = await discharge_service.create_discharge_plan(
            patient_id=patient_id,
            encounter_id=encounter_id,
            patient_data=patient_data,
            complexity_assessment=complexity_assessment
        )
        
        return discharge_plan
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create discharge plan: {str(e)}")

@router.get("/plan/{patient_id}", response_model=DischargePlan)
async def get_discharge_plan(
    patient_id: str,
    discharge_service: DischargeService = Depends()
):
    """Get existing discharge plan for patient"""
    plan = await discharge_service.get_discharge_plan(patient_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Discharge plan not found")
    return plan

@router.post("/risk-assessment", response_model=DischargeRiskPrediction)
async def assess_readmission_risk(
    patient_id: str,
    ai_service: AIService = Depends()
):
    """
    AI-powered readmission risk assessment
    Uses clinical data to predict 30-day readmission probability
    """
    try:
        risk_prediction = await ai_service.predict_readmission_risk(patient_id)
        return risk_prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk assessment failed: {str(e)}")

@router.get("/workflow/{patient_id}", response_model=List[DischargeWorkflowTask])
async def get_discharge_workflow(
    patient_id: str,
    discharge_service: DischargeService = Depends()
):
    """Get all workflow tasks for patient discharge"""
    tasks = await discharge_service.get_workflow_tasks(patient_id)
    return tasks

@router.post("/workflow/task", response_model=DischargeWorkflowTask)
async def create_workflow_task(
    task: DischargeWorkflowTask,
    discharge_service: DischargeService = Depends()
):
    """Create a new discharge workflow task"""
    created_task = await discharge_service.create_workflow_task(task)
    return created_task

@router.put("/workflow/task/{task_id}")
async def update_task_status(
    task_id: str,
    status: str,
    discharge_service: DischargeService = Depends()
):
    """Update discharge workflow task status"""
    await discharge_service.update_task_status(task_id, status)
    return {"message": "Task updated successfully"}

@router.post("/instructions/generate")
async def generate_patient_instructions(
    patient_id: str,
    literacy_level: str = "high-school",
    language: str = "en",
    ai_service: AIService = Depends()
):
    """
    Generate patient-friendly discharge instructions
    Uses AI to adapt language based on health literacy level
    """
    try:
        instructions = await ai_service.generate_discharge_instructions(
            patient_id=patient_id,
            literacy_level=literacy_level,
            language=language
        )
        return {"instructions": instructions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Instruction generation failed: {str(e)}")

@router.post("/summary/generate")
async def generate_discharge_summary(
    patient_id: str,
    encounter_id: str,
    ai_service: AIService = Depends()
):
    """
    Generate AI-powered discharge summary from clinical notes
    """
    try:
        summary = await ai_service.generate_discharge_summary(patient_id, encounter_id)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")