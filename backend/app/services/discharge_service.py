"""
Discharge Planning Service
Core business logic for hospital discharge planning workflow
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio

from app.models.discharge import (
    DischargePlan, 
    DischargeReadiness, 
    DischargeWorkflowTask,
    DischargeDisposition,
    PatientComplexityFactors
)
from app.services.fhir_service import EpicFHIRService
from app.services.ai_service import AIService

class DischargeService:
    """Core discharge planning business logic"""
    
    def __init__(self):
        self.fhir_service = EpicFHIRService()
        self.ai_service = AIService()
    
    async def get_patient_clinical_data(self, patient_id: str) -> Dict[str, Any]:
        """Get comprehensive clinical data for discharge planning"""
        return await self.fhir_service.get_comprehensive_patient_data(patient_id)
    
    async def assess_discharge_complexity(self, patient_data: Dict[str, Any]) -> PatientComplexityFactors:
        """Assess discharge complexity using AI and clinical rules"""
        return await self.ai_service.assess_discharge_complexity(patient_data)
    
    async def assess_discharge_readiness(self, patient_id: str) -> DischargeReadiness:
        """
        Comprehensive assessment of patient readiness for discharge
        Checks multiple criteria required for safe discharge
        """
        
        # In real implementation, these would come from Epic FHIR data
        # For now, using mock assessment logic
        
        # Clinical stability assessment
        clinical_stability = await self._assess_clinical_stability(patient_id)
        
        # Medication reconciliation status
        medication_reconciled = await self._check_medication_reconciliation(patient_id)
        
        # Patient education completion
        patient_education_complete = await self._check_patient_education(patient_id)
        
        # Equipment and DME arrangements
        equipment_arranged = await self._check_equipment_arrangements(patient_id)
        
        # Follow-up appointments
        followup_scheduled = await self._check_followup_appointments(patient_id)
        
        # Transportation
        transportation_confirmed = await self._check_transportation(patient_id)
        
        # Determine overall readiness
        all_criteria = [
            clinical_stability,
            medication_reconciled, 
            patient_education_complete,
            equipment_arranged,
            followup_scheduled,
            transportation_confirmed
        ]
        
        overall_ready = all(all_criteria)
        
        # Identify barriers
        barriers = []
        if not clinical_stability:
            barriers.append("Clinical instability")
        if not medication_reconciled:
            barriers.append("Medication reconciliation pending")
        if not patient_education_complete:
            barriers.append("Patient education incomplete")
        if not equipment_arranged:
            barriers.append("Equipment/DME not arranged")
        if not followup_scheduled:
            barriers.append("Follow-up appointments not scheduled")
        if not transportation_confirmed:
            barriers.append("Transportation not confirmed")
        
        return DischargeReadiness(
            clinical_stability=clinical_stability,
            medication_reconciled=medication_reconciled,
            patient_education_complete=patient_education_complete,
            equipment_arranged=equipment_arranged,
            followup_scheduled=followup_scheduled,
            transportation_confirmed=transportation_confirmed,
            overall_ready=overall_ready,
            barriers=barriers
        )
    
    async def create_discharge_plan(
        self, 
        patient_id: str, 
        encounter_id: str,
        patient_data: Dict[str, Any],
        complexity_assessment: PatientComplexityFactors
    ) -> DischargePlan:
        """
        Create comprehensive discharge plan based on patient data and complexity
        """
        
        # Assess discharge readiness
        readiness_assessment = await self.assess_discharge_readiness(patient_id)
        
        # Determine appropriate disposition based on complexity and needs
        planned_disposition = self._determine_disposition(complexity_assessment, patient_data)
        
        # Extract clinical information
        conditions = patient_data.get("conditions", [])
        primary_diagnosis = conditions[0].get("code", {}).get("coding", [{}])[0].get("display", "Unknown") if conditions else "Unknown"
        secondary_diagnoses = [c.get("code", {}).get("coding", [{}])[0].get("display", "Unknown") for c in conditions[1:]]
        
        # Process medications
        medications = patient_data.get("medications", [])
        discharge_medications = [
            {
                "name": med.get("medicationCodeableConcept", {}).get("coding", [{}])[0].get("display", "Unknown"),
                "dosage": med.get("dosageInstruction", [{}])[0].get("text", "As directed"),
                "frequency": "As prescribed"  # Would extract from dosage instructions
            }
            for med in medications
        ]
        
        # Generate follow-up appointments based on conditions
        follow_up_appointments = await self._generate_followup_appointments(patient_data, complexity_assessment)
        
        # Determine home health and equipment needs
        home_health_orders = self._determine_home_health_needs(complexity_assessment)
        equipment_needs = self._determine_equipment_needs(patient_data, complexity_assessment)
        
        return DischargePlan(
            patient_id=patient_id,
            encounter_id=encounter_id,
            planned_disposition=planned_disposition,
            complexity_assessment=complexity_assessment,
            readiness_assessment=readiness_assessment,
            primary_diagnosis=primary_diagnosis,
            secondary_diagnoses=secondary_diagnoses,
            discharge_medications=discharge_medications,
            follow_up_appointments=follow_up_appointments,
            home_health_orders=home_health_orders,
            equipment_needs=equipment_needs,
            created_by="discharge_bot",
            status="draft"
        )
    
    async def get_workflow_tasks(self, patient_id: str) -> List[DischargeWorkflowTask]:
        """Get all discharge workflow tasks for a patient"""
        
        # Mock workflow tasks - in real implementation, retrieve from database
        tasks = [
            DischargeWorkflowTask(
                task_id="task_1",
                patient_id=patient_id,
                task_type="medication_reconciliation",
                description="Complete medication reconciliation with pharmacist",
                assigned_to="pharmacy_team",
                due_date=datetime.now() + timedelta(hours=4),
                status="pending",
                priority="high"
            ),
            DischargeWorkflowTask(
                task_id="task_2",
                patient_id=patient_id,
                task_type="patient_education",
                description="Provide diabetes management education",
                assigned_to="diabetes_educator",
                due_date=datetime.now() + timedelta(hours=8),
                status="in_progress",
                priority="medium"
            ),
            DischargeWorkflowTask(
                task_id="task_3",
                patient_id=patient_id,
                task_type="followup_scheduling",
                description="Schedule follow-up with primary care physician",
                assigned_to="case_manager",
                due_date=datetime.now() + timedelta(hours=12),
                status="pending",
                priority="medium"
            )
        ]
        
        return tasks
    
    # Helper methods
    
    async def _assess_clinical_stability(self, patient_id: str) -> bool:
        """Check if patient meets clinical stability criteria"""
        # Mock assessment - in real implementation, check vital signs, lab values, etc.
        return True
    
    async def _check_medication_reconciliation(self, patient_id: str) -> bool:
        """Check if medication reconciliation is complete"""
        # Mock check - in real implementation, query Epic for med rec status
        return False  # Assume needs completion
    
    async def _check_patient_education(self, patient_id: str) -> bool:
        """Check if required patient education is complete"""
        return False  # Assume needs completion
    
    async def _check_equipment_arrangements(self, patient_id: str) -> bool:
        """Check if necessary equipment/DME is arranged"""
        return True
    
    async def _check_followup_appointments(self, patient_id: str) -> bool:
        """Check if required follow-up appointments are scheduled"""
        return False  # Assume needs scheduling
    
    async def _check_transportation(self, patient_id: str) -> bool:
        """Check if transportation home is arranged"""
        return True
    
    def _determine_disposition(self, complexity: PatientComplexityFactors, patient_data: Dict[str, Any]) -> DischargeDisposition:
        """Determine appropriate discharge disposition based on complexity"""
        
        if complexity.complexity_score >= 80:
            return DischargeDisposition.SNF  # Skilled nursing facility
        elif complexity.complexity_score >= 60:
            return DischargeDisposition.HOME_HEALTH  # Home with health services
        elif len(complexity.functional_factors) > 2:
            return DischargeDisposition.REHAB  # Inpatient rehabilitation
        else:
            return DischargeDisposition.HOME  # Home
    
    async def _generate_followup_appointments(self, patient_data: Dict[str, Any], complexity: PatientComplexityFactors) -> List[Dict[str, Any]]:
        """Generate appropriate follow-up appointments based on conditions"""
        
        appointments = []
        conditions = patient_data.get("conditions", [])
        
        # Primary care follow-up (always needed)
        appointments.append({
            "provider": "Primary Care Physician",
            "specialty": "Internal Medicine",
            "timeframe": "1-2 weeks",
            "reason": "Post-discharge follow-up",
            "priority": "high"
        })
        
        # Condition-specific follow-ups
        for condition in conditions:
            condition_display = condition.get("code", {}).get("coding", [{}])[0].get("display", "").lower()
            
            if "diabetes" in condition_display:
                appointments.append({
                    "provider": "Endocrinologist",
                    "specialty": "Endocrinology", 
                    "timeframe": "2-4 weeks",
                    "reason": "Diabetes management",
                    "priority": "medium"
                })
            
            if "copd" in condition_display or "asthma" in condition_display:
                appointments.append({
                    "provider": "Pulmonologist",
                    "specialty": "Pulmonology",
                    "timeframe": "1-2 weeks", 
                    "reason": "Respiratory condition management",
                    "priority": "high"
                })
        
        return appointments
    
    def _determine_home_health_needs(self, complexity: PatientComplexityFactors) -> List[str]:
        """Determine home health services needed"""
        services = []
        
        if complexity.complexity_score >= 60:
            services.append("Skilled nursing visits")
        
        if "medication_management" in complexity.clinical_factors:
            services.append("Medication management")
        
        if len(complexity.functional_factors) > 0:
            services.extend(["Physical therapy", "Occupational therapy"])
        
        return services
    
    def _determine_equipment_needs(self, patient_data: Dict[str, Any], complexity: PatientComplexityFactors) -> List[str]:
        """Determine DME and equipment needs"""
        equipment = []
        
        if "mobility_impairment" in complexity.functional_factors:
            equipment.extend(["Walker", "Hospital bed"])
        
        conditions = patient_data.get("conditions", [])
        for condition in conditions:
            condition_display = condition.get("code", {}).get("coding", [{}])[0].get("display", "").lower()
            if "copd" in condition_display:
                equipment.append("Oxygen concentrator")
            if "diabetes" in condition_display:
                equipment.append("Blood glucose monitor")
        
        return equipment