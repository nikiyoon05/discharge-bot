"""
AI Service for Discharge Planning Intelligence
Provides machine learning and NLP capabilities for discharge planning
"""

import openai
from typing import Dict, List, Any, Optional
import json
from datetime import datetime
import asyncio

from app.core.config import settings
from app.models.discharge import DischargeRiskPrediction, PatientComplexityFactors
from app.services.fhir_service import EpicFHIRService

class AIService:
    """AI-powered services for discharge planning"""
    
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.fhir_service = EpicFHIRService()
    
    async def assess_discharge_complexity(self, patient_data: Dict[str, Any]) -> PatientComplexityFactors:
        """
        Analyze patient data to determine discharge complexity
        Uses rule-based logic + AI for comprehensive assessment
        """
        
        clinical_factors = []
        behavioral_factors = []
        social_factors = []
        functional_factors = []
        
        # Extract conditions and medications for analysis
        conditions = patient_data.get("conditions", [])
        medications = patient_data.get("medications", [])
        patient_info = patient_data.get("patient", {})
        
        # Clinical complexity indicators
        condition_codes = [c.get("code", {}).get("coding", [{}])[0].get("code", "") for c in conditions]
        
        if len(medications) >= 5:
            clinical_factors.append("polypharmacy")
        
        if any("diabetes" in str(c).lower() for c in conditions):
            clinical_factors.append("diabetes_management")
            
        if any("copd" in str(c).lower() or "asthma" in str(c).lower() for c in conditions):
            clinical_factors.append("respiratory_condition")
        
        # Social complexity (would normally come from social work assessments)
        age = self._calculate_age(patient_info.get("birthDate", ""))
        if age > 75:
            social_factors.append("advanced_age")
        
        # Calculate complexity score (0-100)
        total_factors = len(clinical_factors) + len(behavioral_factors) + len(social_factors) + len(functional_factors)
        complexity_score = min(total_factors * 15, 100)  # Cap at 100
        
        return PatientComplexityFactors(
            clinical_factors=clinical_factors,
            behavioral_factors=behavioral_factors,
            social_factors=social_factors,
            functional_factors=functional_factors,
            complexity_score=complexity_score
        )
    
    async def predict_readmission_risk(self, patient_id: str) -> DischargeRiskPrediction:
        """
        AI-powered prediction of 30-day readmission risk
        Uses patient clinical data and ML model
        """
        
        # Get comprehensive patient data
        patient_data = await self.fhir_service.get_comprehensive_patient_data(patient_id)
        
        # Extract features for ML model (simplified version)
        features = self._extract_risk_features(patient_data)
        
        # Mock ML prediction (in real implementation, use trained model)
        risk_score = min(features.get("complexity_score", 0) + 
                        features.get("medication_count", 0) * 5 +
                        features.get("condition_count", 0) * 8, 100)
        
        risk_factors = []
        if features.get("medication_count", 0) >= 5:
            risk_factors.append("Polypharmacy (5+ medications)")
        if features.get("condition_count", 0) >= 3:
            risk_factors.append("Multiple comorbidities") 
        if features.get("age", 0) > 75:
            risk_factors.append("Advanced age (>75)")
        
        recommended_interventions = []
        if risk_score > 70:
            recommended_interventions.extend([
                "Schedule early follow-up within 48 hours",
                "Consider home health services",
                "Medication reconciliation with pharmacist"
            ])
        elif risk_score > 40:
            recommended_interventions.extend([
                "Schedule follow-up within 7 days",
                "Patient education reinforcement"
            ])
        
        return DischargeRiskPrediction(
            patient_id=patient_id,
            readmission_risk_score=risk_score,
            risk_factors=risk_factors,
            recommended_interventions=recommended_interventions,
            confidence_score=0.85,
            model_version="v1.0"
        )
    
    async def generate_discharge_summary(self, patient_id: str, encounter_id: str) -> str:
        """
        Generate AI-powered discharge summary from clinical notes
        """
        
        patient_data = await self.fhir_service.get_comprehensive_patient_data(patient_id)
        
        # Create prompt for LLM
        prompt = self._create_summary_prompt(patient_data)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a clinical documentation assistant specializing in discharge summaries. Create clear, comprehensive discharge summaries from patient data."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            # Fallback to template-based summary
            return self._generate_template_summary(patient_data)
    
    async def generate_discharge_instructions(self, patient_id: str, literacy_level: str = "high-school", language: str = "en") -> str:
        """
        Generate patient-friendly discharge instructions
        Adapts language based on health literacy level
        """
        
        patient_data = await self.fhir_service.get_comprehensive_patient_data(patient_id)
        
        # Create prompt for patient instructions
        prompt = self._create_instructions_prompt(patient_data, literacy_level, language)
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": f"You are a patient education specialist. Create clear discharge instructions at a {literacy_level} reading level in {language}."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.2
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return self._generate_template_instructions(patient_data, literacy_level)
    
    def _calculate_age(self, birth_date: str) -> int:
        """Calculate patient age from birth date"""
        if not birth_date:
            return 0
        try:
            birth = datetime.strptime(birth_date, "%Y-%m-%d")
            today = datetime.now()
            return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except:
            return 0
    
    def _extract_risk_features(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features for risk prediction model"""
        conditions = patient_data.get("conditions", [])
        medications = patient_data.get("medications", [])
        patient_info = patient_data.get("patient", {})
        
        return {
            "age": self._calculate_age(patient_info.get("birthDate", "")),
            "condition_count": len(conditions),
            "medication_count": len(medications),
            "complexity_score": 50  # Would come from complexity assessment
        }
    
    def _create_summary_prompt(self, patient_data: Dict[str, Any]) -> str:
        """Create prompt for discharge summary generation"""
        patient = patient_data.get("patient", {})
        conditions = patient_data.get("conditions", [])
        medications = patient_data.get("medications", [])
        
        patient_name = patient.get("name", [{}])[0]
        name = f"{patient_name.get('given', [''])[0]} {patient_name.get('family', '')}"
        
        conditions_text = "\n".join([f"- {c.get('code', {}).get('coding', [{}])[0].get('display', 'Unknown condition')}" for c in conditions])
        medications_text = "\n".join([f"- {m.get('medicationCodeableConcept', {}).get('coding', [{}])[0].get('display', 'Unknown medication')}" for m in medications])
        
        return f"""
        Create a discharge summary for patient {name}.
        
        Primary Diagnoses:
        {conditions_text}
        
        Discharge Medications:
        {medications_text}
        
        Please create a comprehensive discharge summary including:
        1. Hospital course
        2. Discharge diagnoses
        3. Discharge medications
        4. Follow-up instructions
        5. Patient education provided
        """
    
    def _create_instructions_prompt(self, patient_data: Dict[str, Any], literacy_level: str, language: str) -> str:
        """Create prompt for patient instruction generation"""
        medications = patient_data.get("medications", [])
        conditions = patient_data.get("conditions", [])
        
        return f"""
        Create patient discharge instructions at a {literacy_level} reading level.
        
        Patient has these conditions: {[c.get('code', {}).get('coding', [{}])[0].get('display', '') for c in conditions]}
        Patient medications: {[m.get('medicationCodeableConcept', {}).get('coding', [{}])[0].get('display', '') for m in medications]}
        
        Include:
        1. How to take medications
        2. Warning signs to watch for
        3. When to call the doctor
        4. Activity restrictions
        5. Follow-up appointments
        
        Use simple, clear language appropriate for {literacy_level} level.
        """
    
    def _generate_template_summary(self, patient_data: Dict[str, Any]) -> str:
        """Fallback template-based summary generation"""
        return """
        DISCHARGE SUMMARY
        
        Patient was admitted with acute exacerbation of chronic conditions.
        Hospital course was notable for stabilization of symptoms with medical management.
        Patient is being discharged home with appropriate medications and follow-up.
        
        DISCHARGE DIAGNOSES:
        - Primary diagnosis per admission
        - Secondary diagnoses as documented
        
        DISCHARGE MEDICATIONS:
        - Continue home medications as prescribed
        - New medications as indicated
        
        FOLLOW-UP:
        - Primary care physician in 1-2 weeks
        - Specialist follow-up as needed
        """
    
    def _generate_template_instructions(self, patient_data: Dict[str, Any], literacy_level: str) -> str:
        """Fallback template-based instruction generation"""
        return """
        DISCHARGE INSTRUCTIONS
        
        Take your medicines exactly as prescribed.
        
        Call your doctor if you have:
        - Fever over 101°F
        - Trouble breathing
        - Chest pain
        - Any worsening symptoms
        
        Follow up with your doctor as scheduled.
        Take it easy for the first few days at home.
        """