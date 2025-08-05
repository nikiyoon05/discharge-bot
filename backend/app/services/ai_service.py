"""
AI Service for Discharge Planning Intelligence
Provides machine learning and NLP capabilities for discharge planning
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime
import asyncio
import logging

# Try to import openai, but don't fail if it's not available
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None

from app.core.config import settings
# from app.models.discharge import DischargeRiskPrediction, PatientComplexityFactors
from app.models.emr import ParsedEMRData, VisitSummary

logger = logging.getLogger(__name__)

class AIService:
    """AI-powered services for discharge planning"""
    
    def __init__(self):
        self.openai_available = OPENAI_AVAILABLE and bool(settings.OPENAI_API_KEY)
        if self.openai_available:
            try:
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI API configured successfully")
            except Exception as e:
                logger.warning(f"Failed to configure OpenAI: {e}")
                self.openai_available = False
        else:
            logger.info("OpenAI API not available - using template-based responses")
            self.client = None
    
    async def assess_discharge_complexity(self, patient_data: Dict[str, Any]):  # -> PatientComplexityFactors:
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
        
        return {
            'clinical_factors': clinical_factors,
            'behavioral_factors': behavioral_factors,
            'social_factors': social_factors,
            'functional_factors': functional_factors,
            'complexity_score': complexity_score
        }
    
    async def predict_readmission_risk(self, patient_id: str):  # -> DischargeRiskPrediction:
        """
        AI-powered prediction of 30-day readmission risk
        Uses patient clinical data and ML model
        """
        
        # Mock patient data for now (would be from FHIR service in production)
        patient_data = {"patient": {"birthDate": "1960-01-01"}, "conditions": [], "medications": []}
        
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
        
        return {
            'patient_id': patient_id,
            'readmission_risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommended_interventions': recommended_interventions,
            'confidence_score': 0.85,
            'model_version': "v1.0"
        }
    
    async def analyze_medication_list(self, medications: List[Dict[str, Any]], patient_context: str = "") -> Dict[str, Any]:
        """
        Analyze a list of medications for potential issues using AI
        """
        if self.openai_available:
            try:
                prompt = self._create_medrec_analysis_prompt(medications, patient_context)
                
                logger.info(f"Calling OpenAI API for medication analysis with {len(medications)} medications")
                
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a clinical pharmacist AI. Analyze the following medication list for potential drug interactions, duplicate therapies, and other clinical concerns. Provide your response as valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.3
                )
                
                response_content = response.choices[0].message.content.strip()
                logger.info(f"OpenAI response received: {response_content[:200]}...")
                
                # Try to parse JSON response
                try:
                    return json.loads(response_content)
                except json.JSONDecodeError:
                    # If JSON parsing fails, extract information manually
                    logger.warning("Failed to parse JSON response, using fallback parsing")
                    return self._parse_ai_response_fallback(response_content)
                
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}. Using template analysis.")
        
        return self._generate_template_medrec_analysis(medications)

    def _create_medrec_analysis_prompt(self, medications: List[Dict[str, Any]], patient_context: str = "") -> str:
        """Create prompt for medication reconciliation analysis"""
        med_list = "\n".join([f"- {m.get('name', 'Unknown')} {m.get('dosage', '')} {m.get('frequency', '')}" for m in medications])
        
        context_section = f"\n\nPatient Context:\n{patient_context}" if patient_context else ""
        
        return f"""
        Analyze the following reconciled medication list and provide a summary of potential issues.
        
        Medications:
        {med_list}{context_section}
        
        Please provide your analysis in a JSON object with the following keys:
        - "interactions": A list of potential drug-drug interactions (strings).
        - "duplicates": A list of potential duplicate therapies (strings).
        - "clinical_concerns": A list of other clinical concerns (strings).
        - "summary": A brief summary of your findings (string).
        
        If no issues are found, return empty lists and a summary stating that no issues were identified.
        Return ONLY the JSON object, no additional text.
        """

    def _parse_ai_response_fallback(self, response_content: str) -> Dict[str, Any]:
        """Parse AI response when JSON parsing fails"""
        # Simple text parsing fallback
        interactions = []
        duplicates = []
        clinical_concerns = []
        summary = "AI analysis completed but response format was not standard JSON."
        
        lines = response_content.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if 'interaction' in line.lower():
                current_section = 'interactions'
            elif 'duplicate' in line.lower():
                current_section = 'duplicates'
            elif 'concern' in line.lower():
                current_section = 'clinical_concerns'
            elif 'summary' in line.lower():
                current_section = 'summary'
            elif line.startswith('-') or line.startswith('•'):
                clean_line = line.lstrip('-• ').strip()
                if current_section == 'interactions':
                    interactions.append(clean_line)
                elif current_section == 'duplicates':
                    duplicates.append(clean_line)
                elif current_section == 'clinical_concerns':
                    clinical_concerns.append(clean_line)
        
        return {
            "interactions": interactions,
            "duplicates": duplicates,
            "clinical_concerns": clinical_concerns,
            "summary": summary
        }

    def _generate_template_medrec_analysis(self, medications: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback template-based medication reconciliation analysis"""
        med_names = [m.get('name', 'Unknown') for m in medications]
        
        return {
            "interactions": [f"Please review potential interactions between {med_names[0] if med_names else 'medications'} and other drugs."],
            "duplicates": ["No obvious duplicate therapies identified in this reconciliation."],
            "clinical_concerns": [f"Review dosing appropriateness for {len(medications)} reconciled medications."],
            "summary": f"Analyzed {len(medications)} medications. This is a template analysis - OpenAI API was not available."
        }

    
    async def generate_discharge_instructions(self, patient_id: str, literacy_level: str = "high-school", language: str = "en", emr_data = None) -> str:
        """
        Generate patient-friendly discharge instructions
        Adapts language based on health literacy level
        """
        
        if emr_data:
            # Handle both dict and ParsedEMRData objects
            if isinstance(emr_data, dict):
                return self.generate_instructions_from_dict(emr_data, literacy_level, language)
            else:
                return self.generate_instructions_from_ehr(emr_data, literacy_level, language)
        
        # Fallback for no EMR data
        return f"Basic discharge instructions for patient {patient_id}. Please follow up with your primary care provider."
    
    def generate_visit_summary(self, emr_data: ParsedEMRData) -> VisitSummary:
        """
        Generate AI-powered summary of the most recent visit from parsed EMR data
        """
        if self.openai_available:
            try:
                # Create prompt for visit summary
                prompt = self._create_visit_summary_prompt(emr_data)
                
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a clinical AI assistant specializing in visit summaries for discharge planning. Analyze the uploaded EMR data and create a comprehensive visit summary focusing on discharge readiness factors."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.3
                )
                
                # Parse AI response into structured format
                ai_response = response.choices[0].message.content
                logger.info("AI visit summary generated successfully")
                return self._parse_visit_summary_response(ai_response, emr_data)
                
            except Exception as e:
                logger.error(f"OpenAI API call failed: {str(e)} - Type: {type(e)} - Falling back to template summary.")
                import traceback
                logger.error(f"Full traceback: {traceback.format_exc()}")
        
        # Fallback to template-based summary (always works)
        logger.info("Using template-based visit summary")
        return self._generate_template_visit_summary(emr_data)
    
    def _create_visit_summary_prompt(self, emr_data: ParsedEMRData) -> str:
        """Create prompt for AI visit summary generation"""
        patient = emr_data.patient_demographics
        conditions = emr_data.conditions
        medications = emr_data.medications
        vitals = emr_data.vital_signs
        labs = emr_data.lab_results
        clinical_notes = emr_data.clinical_notes
        
        conditions_text = "\n".join([f"- {c.display}" for c in conditions])
        medications_text = "\n".join([f"- {m.name} ({m.dosage})" for m in medications])
        vitals_text = "\n".join([f"- {v.type}: {v.value}" for v in vitals])
        labs_text = "\n".join([f"- {l.test_name}: {l.value}" for l in labs])
        
        # Include clinical notes content - this is where the assessment and plan will be
        clinical_notes_text = ""
        for note in clinical_notes:
            clinical_notes_text += f"\n{note.type} (by {note.author}):\n{note.content}\n"
        
        return f"""
        Analyze this EMR data for patient {patient.name} (MRN: {patient.mrn}) and create a visit summary focused on discharge planning:

        PATIENT DEMOGRAPHICS:
        - Age: {patient.age}, Gender: {patient.gender}
        - Admission Date: {patient.admission_date}
        - Attending: {patient.attending_physician}

        CURRENT CONDITIONS:
        {conditions_text or "- No conditions documented"}

        CURRENT MEDICATIONS:
        {medications_text or "- No medications documented"}

        RECENT VITAL SIGNS:
        {vitals_text or "- No vital signs documented"}

        RECENT LAB RESULTS:
        {labs_text or "- No lab results documented"}

        CLINICAL NOTES AND DOCUMENTATION:
        {clinical_notes_text or "- No clinical notes available"}

        Based on ALL the above information, especially the clinical notes, please provide:
        1. Chief complaint or reason for visit (extract from clinical notes if available)
        2. Assessment and plan summary (extract the actual assessment from clinical notes)
        3. Key clinical findings (3-5 bullet points from the documentation)
        4. Discharge readiness factors (what supports safe discharge based on notes)
        5. Follow-up recommendations (from discharge planning in notes)
        6. Risk factors for readmission
        7. Any medication changes or new prescriptions

        IMPORTANT: Extract the actual chief complaint and assessment/plan from the clinical notes content above. Don't say "not documented" if it's actually in the clinical notes.
        Focus on information relevant to discharge planning and patient safety.
        """

    def _parse_visit_summary_response(self, ai_response: str, emr_data: ParsedEMRData) -> VisitSummary:
        """Parse AI response into structured VisitSummary"""
        # This is a simplified parser - in production, you'd use more sophisticated NLP
        lines = ai_response.split('\n')
        
        # Extract key information (simplified extraction)
        key_findings = []
        discharge_factors = []
        follow_up = []
        risk_factors = []
        medication_changes = []
        
        current_section = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if "key findings" in line.lower() or "clinical findings" in line.lower():
                current_section = "findings"
            elif "discharge readiness" in line.lower() or "discharge factors" in line.lower():
                current_section = "discharge"
            elif "follow-up" in line.lower() or "recommendations" in line.lower():
                current_section = "followup"
            elif "risk factors" in line.lower() or "readmission" in line.lower():
                current_section = "risk"
            elif "medication" in line.lower() and ("changes" in line.lower() or "new" in line.lower()):
                current_section = "meds"
            elif line.startswith('-') or line.startswith('•'):
                clean_line = line.lstrip('-• ').strip()
                if current_section == "findings":
                    key_findings.append(clean_line)
                elif current_section == "discharge":
                    discharge_factors.append(clean_line)
                elif current_section == "followup":
                    follow_up.append(clean_line)
                elif current_section == "risk":
                    risk_factors.append(clean_line)
                elif current_section == "meds":
                    medication_changes.append(clean_line)
        
        return VisitSummary(
            visit_date=emr_data.parsed_at,
            visit_type="EMR Upload Analysis",
            chief_complaint="Analysis of uploaded EMR data",
            assessment_and_plan=ai_response[:500] + "..." if len(ai_response) > 500 else ai_response,
            key_findings=key_findings[:5],  # Limit to 5
            discharge_readiness_factors=discharge_factors[:5],
            follow_up_recommendations=follow_up[:5],
            risk_factors=risk_factors[:5],
            medication_changes=medication_changes[:5]
        )

    def _generate_template_visit_summary(self, emr_data: ParsedEMRData) -> VisitSummary:
        """Fallback template-based visit summary"""
        return VisitSummary(
            visit_date=emr_data.parsed_at,
            visit_type="EMR Data Analysis",
            chief_complaint="Uploaded EMR file analysis for discharge planning",
            assessment_and_plan=f"Patient {emr_data.patient_demographics.name} has {len(emr_data.conditions)} documented conditions and {len(emr_data.medications)} medications. Clinical data successfully parsed from uploaded EMR file.",
            key_findings=[
                f"{len(emr_data.conditions)} active medical conditions",
                f"{len(emr_data.medications)} current medications",
                f"{len(emr_data.vital_signs)} recent vital sign measurements",
                f"{len(emr_data.lab_results)} recent laboratory results",
                "EMR data successfully imported and structured"
            ],
            discharge_readiness_factors=[
                "Clinical data available for review",
                "Medication list documented",
                "Patient demographics confirmed",
                "Ready for discharge planning workflow"
            ],
            follow_up_recommendations=[
                "Review all medications for interactions",
                "Confirm discharge diagnoses with clinical team",
                "Schedule appropriate follow-up appointments",
                "Provide patient education materials"
            ],
            risk_factors=[
                "Multiple medications requiring monitoring",
                "Complex medical history requiring careful transition",
                "Need for medication reconciliation"
            ],
            medication_changes=[
                "Review uploaded medication list for accuracy",
                "Confirm current vs discontinued medications",
                "Check for potential drug interactions"
            ]
        )
    
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
    
    def generate_instructions_from_ehr(self, emr_data: ParsedEMRData, literacy_level: str, language: str) -> str:
        """
        Generate patient-friendly discharge instructions from parsed EMR data
        """
        if self.openai_available:
            try:
                # Create prompt for patient instructions
                prompt = self._create_instructions_prompt_from_ehr(emr_data, literacy_level, language)
                
                response = self.client.chat.completions.create(
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
                logger.warning(f"OpenAI API call failed: {e}. Using template instructions.")
        
        return self._generate_template_instructions_from_ehr(emr_data, literacy_level)
    
    def generate_instructions_from_dict(self, emr_data: dict, literacy_level: str, language: str) -> str:
        """
        Generate patient-friendly discharge instructions from EMR data dict
        """
        if self.openai_available:
            try:
                # Create prompt for patient instructions from dict
                prompt = self._create_instructions_prompt_from_dict(emr_data, literacy_level, language)
                
                response = self.client.chat.completions.create(
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
                logger.warning(f"OpenAI API call failed: {e}. Using template instructions.")
        
        return self._generate_template_instructions_from_dict(emr_data, literacy_level)

    def _create_instructions_prompt_from_ehr(self, emr_data: ParsedEMRData, literacy_level: str, language: str) -> str:
        """Create prompt for patient instruction generation from parsed EMR data"""
        patient = emr_data.patient_demographics
        conditions = emr_data.conditions
        medications = emr_data.medications
        
        conditions_text = "\n".join([f"- {c.display}" for c in conditions])
        medications_text = "\n".join([f"- {m.name} ({m.dosage})" for m in medications])
        
        return f"""
        Create patient discharge instructions for {patient.name} at a {literacy_level} reading level in {language}.
        
        Patient has these conditions:
        {conditions_text}
        
        Patient medications:
        {medications_text}
        
        Include:
        1. How to take medications
        2. Warning signs to watch for
        3. When to call the doctor
        4. Activity restrictions
        5. Follow-up appointments
        
        Use simple, clear language appropriate for {literacy_level} level.
        """

    def _generate_template_instructions_from_ehr(self, emr_data: ParsedEMRData, literacy_level: str) -> str:
        """Fallback template-based instruction generation from parsed EMR data"""
        return f"""
        DISCHARGE INSTRUCTIONS FOR {emr_data.patient_demographics.name}
        
        Take your medicines exactly as prescribed.
        
        Call your doctor if you have:
        - Fever over 101°F
        - Trouble breathing
        - Chest pain
        - Any worsening symptoms
        
        Follow up with your doctor as scheduled.
        Take it easy for the first few days at home.
        """

    async def generate_discharge_summary(self, patient_id: str, encounter_id: str) -> str:
        """
        Generate AI-powered discharge summary from clinical notes
        """
        if self.openai_available:
            try:
                prompt = f"""
                Generate a comprehensive discharge summary for patient ID {patient_id}, encounter {encounter_id}.
                
                Include:
                1. Hospital course summary
                2. Primary and secondary diagnoses
                3. Procedures performed
                4. Discharge medications
                5. Follow-up recommendations
                6. Patient condition at discharge
                
                Format as a professional medical discharge summary.
                """
                
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a clinical documentation specialist. Generate a comprehensive discharge summary."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.3
                )
                
                return response.choices[0].message.content
                
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}. Using template summary.")
        
        return self._generate_template_discharge_summary(patient_id, encounter_id)

    def _generate_template_discharge_summary(self, patient_id: str, encounter_id: str) -> str:
        """Fallback template-based discharge summary generation"""
        return f"""
        DISCHARGE SUMMARY
        
        Patient ID: {patient_id}
        Encounter ID: {encounter_id}
        Discharge Date: {datetime.now().strftime('%Y-%m-%d')}
        
        HOSPITAL COURSE:
        Patient was admitted with acute exacerbation of chronic conditions.
        Hospital course was notable for stabilization of symptoms with medical management.
        Patient responded well to treatment and is being discharged home.
        
        DISCHARGE DIAGNOSES:
        - Primary diagnosis per admission
        - Secondary diagnoses as documented
        
        DISCHARGE MEDICATIONS:
        - Continue home medications as prescribed
        - New medications as indicated
        
        FOLLOW-UP:
        - Primary care physician in 1-2 weeks
        - Specialist follow-up as needed
        
        PATIENT CONDITION AT DISCHARGE:
        Stable and ready for discharge home with appropriate follow-up care.
        """
    
    def _create_instructions_prompt_from_dict(self, emr_data: dict, literacy_level: str, language: str) -> str:
        """Create prompt for patient instruction generation from EMR data dict"""
        patient_demographics = emr_data.get('patient_demographics', {})
        medications = emr_data.get('medications', [])
        conditions = emr_data.get('conditions', [])
        clinical_notes = emr_data.get('clinical_notes', [])
        visit_summary = emr_data.get('visit_summary', {})
        
        patient_name = patient_demographics.get('name', 'Patient')
        
        # Extract discharge summary from clinical notes if available
        discharge_summary = ""
        for note in clinical_notes:
            if 'discharge' in note.get('type', '').lower() or 'summary' in note.get('type', '').lower():
                discharge_summary = note.get('content', '')
                break
        
        prompt = f"""
        Create patient-friendly discharge instructions for {patient_name} at a {literacy_level} reading level in {language}.
        
        Patient Information:
        - Name: {patient_name}
        - Age: {patient_demographics.get('age', 'Unknown')}
        - MRN: {patient_demographics.get('mrn', 'Unknown')}
        
        Current Medications ({len(medications)} total):
        """
        
        for med in medications[:5]:  # Limit to first 5 medications
            prompt += f"- {med.get('name', 'Unknown')} {med.get('dosage', '')} {med.get('frequency', '')}\n"
        
        if discharge_summary:
            prompt += f"\nDischarge Summary:\n{discharge_summary}\n"
        
        if visit_summary:
            assessment = visit_summary.get('assessment_and_plan', '')
            if assessment:
                prompt += f"\nClinical Assessment:\n{assessment}\n"
        
        prompt += f"""
        
        IMPORTANT: Use the specific information from the discharge summary above to create detailed, personalized instructions. 
        
        Please create comprehensive discharge instructions that include:
        1. SPECIFIC medication instructions with exact names, doses, and schedules from the medication list above
        2. Activity restrictions and recommendations based on the patient's condition
        3. Follow-up care instructions with specific appointments if mentioned
        4. Warning signs to watch for related to the patient's condition
        5. When to contact healthcare providers
        
        DO NOT use generic phrases like "continue medications as prescribed by your doctor" - instead use the SPECIFIC medications, doses, and frequencies listed above.
        
        For example, if the patient is on "Azithromycin 500 mg daily x2 days", say "Take Azithromycin 500 mg by mouth once daily for 2 more days to complete your antibiotic course."
        
        Use simple language appropriate for {literacy_level} reading level.
        Make it clear and actionable for the patient.
        Reference the specific diagnosis and treatment plan from the discharge summary.
        """
        
        return prompt
    
    def _generate_template_instructions_from_dict(self, emr_data: dict, literacy_level: str) -> str:
        """Generate template discharge instructions from EMR data dict"""
        patient_demographics = emr_data.get('patient_demographics', {})
        medications = emr_data.get('medications', [])
        clinical_notes = emr_data.get('clinical_notes', [])
        patient_name = patient_demographics.get('name', 'Patient')
        
        # Extract discharge summary content
        discharge_instructions = ""
        discharge_summary = ""
        follow_up_info = ""
        
        for note in clinical_notes:
            content = note.get('content', '')
            if 'discharge' in note.get('type', '').lower():
                discharge_summary = content
                # Extract specific sections from discharge summary
                if 'DISCHARGE INSTRUCTIONS:' in content:
                    discharge_instructions = content.split('DISCHARGE INSTRUCTIONS:')[1].split('_____')[0].strip()
                if 'FOLLOW-UP' in content:
                    follow_up_section = content.split('FOLLOW-UP')[1].split('_____')[0].strip()
                    follow_up_info = follow_up_section
        
        instructions = f"""DISCHARGE INSTRUCTIONS FOR {patient_name.upper()}

MEDICATIONS:
"""
        
        if medications:
            for med in medications:
                name = med.get('name', 'medication')
                dosage = med.get('dosage', '')
                frequency = med.get('frequency', 'as prescribed')
                route = med.get('route', 'by mouth')
                
                # Create specific instruction
                instruction = f"• Take {name}"
                if dosage and dosage != 'as prescribed':
                    instruction += f" {dosage}"
                if route and route != 'PO':
                    instruction += f" {route.lower()}"
                if frequency and frequency != 'as prescribed':
                    instruction += f" {frequency}"
                
                # Add any special instructions from the medication
                med_instructions = med.get('instructions', '')
                if 'complete' in med_instructions.lower() and 'course' in med_instructions.lower():
                    instruction += " (complete the full course as prescribed)"
                elif 'prn' in med_instructions.lower():
                    instruction += " as needed"
                
                instructions += instruction + "\n"
        else:
            instructions += "• Continue your regular medications as prescribed by your doctor\n"
        
        # Add activity instructions from discharge summary or use defaults
        instructions += "\nACTIVITY:\n"
        if discharge_instructions and ('activity' in discharge_instructions.lower() or 'resume' in discharge_instructions.lower()):
            # Extract activity-related instructions from discharge summary
            activity_lines = [line.strip() for line in discharge_instructions.split('\n') if line.strip()]
            for line in activity_lines:
                if any(word in line.lower() for word in ['activity', 'resume', 'rest', 'exercise']):
                    instructions += f"• {line.replace('*', '').strip()}\n"
        else:
            instructions += "• You may return to your normal activities as tolerated\n"
            instructions += "• Avoid heavy lifting or strenuous exercise until cleared by your doctor\n"
            instructions += "• Get plenty of rest\n"

        # Add follow-up care from discharge summary
        instructions += "\nFOLLOW-UP CARE:\n"
        if follow_up_info:
            follow_up_lines = [line.strip() for line in follow_up_info.split('\n') if line.strip() and not line.startswith('_')]
            for line in follow_up_lines:
                if line and not line.startswith(':'):
                    instructions += f"• {line.replace('*', '').strip()}\n"
        else:
            instructions += "• Schedule an appointment with your primary care doctor within 1-2 weeks\n"
            instructions += "• Keep all scheduled appointments\n"

        # Add condition-specific warning signs or use defaults
        instructions += "\nWHEN TO CALL YOUR DOCTOR:\n"
        if discharge_instructions and ('monitor' in discharge_instructions.lower() or 'symptoms' in discharge_instructions.lower()):
            # Extract warning signs from discharge summary
            warning_lines = [line.strip() for line in discharge_instructions.split('\n') if line.strip()]
            for line in warning_lines:
                if any(word in line.lower() for word in ['monitor', 'symptoms', 'fever', 'pain', 'worsening']):
                    instructions += f"• {line.replace('*', '').strip()}\n"
        else:
            instructions += "• Fever over 101°F (38.3°C)\n"
            instructions += "• Difficulty breathing or shortness of breath\n"
            instructions += "• Chest pain\n"
            instructions += "• Severe nausea or vomiting\n"
            instructions += "• Any concerns about your condition\n"

        instructions += """
EMERGENCY SITUATIONS - CALL 911:
• Severe difficulty breathing
• Chest pain that doesn't go away
• Loss of consciousness
• Severe allergic reaction

If you have questions about your care, please contact your healthcare provider.
"""
        
        return instructions

    async def generate_chat_response(self, patient_id: str, chat_history: List[Dict[str, str]], emr_data: Optional[ParsedEMRData] = None) -> str:
        """
        Generate a helpful and empathetic chat response from an AI assistant.
        """
        if self.openai_available:
            try:
                prompt = self._create_chat_prompt(chat_history, emr_data)
                
                response = self.client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-4-turbo",
                    messages=[
                        {"role": "system", "content": "You are a friendly and empathetic post-discharge care assistant. Your goal is to help patients with their questions after they've left the hospital. Use the provided clinical context to give safe and helpful answers. Never give medical advice, but you can clarify instructions from the discharge summary. If a patient seems to be in distress or describes a serious symptom, advise them to call their doctor or 911 immediately."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=250,
                    temperature=0.5
                )
                
                return response.choices[0].message.content.strip()
                
            except Exception as e:
                logger.error(f"OpenAI API call failed: {e}")
                return "I'm sorry, I'm having a little trouble connecting to my brain right now. Please try again in a moment."
        
        return self._generate_template_chat_response(chat_history)

    def _create_chat_prompt(self, chat_history: List[Dict[str, str]], emr_data: Optional[ParsedEMRData] = None) -> str:
        """Create a detailed prompt for the AI chat assistant."""
        
        history_str = "\n".join([f"{msg['sender'].capitalize()}: {msg['message']}" for msg in chat_history])
        
        context_str = "No clinical context available."
        if emr_data:
            discharge_summary_note = next((note for note in emr_data.clinical_notes if 'discharge summary' in note.type.lower()), None)
            
            context_str = f"Here is the patient's clinical context from their discharge summary:\n"
            if emr_data.patient_demographics:
                context_str += f"- Patient: {emr_data.patient_demographics.name}, Age: {emr_data.patient_demographics.age}\n"
            if emr_data.conditions:
                context_str += f"- Diagnoses: {', '.join([c.display for c in emr_data.conditions])}\n"
            if emr_data.medications:
                med_list = [f"{m.name} ({m.dosage} {m.frequency})" for m in emr_data.medications]
                context_str += f"- Medications: {', '.join(med_list)}\n"
            if discharge_summary_note:
                # Use the most relevant parts of the discharge summary
                instructions_part = ""
                if "DISCHARGE INSTRUCTIONS:" in discharge_summary_note.content:
                    instructions_part = discharge_summary_note.content.split("DISCHARGE INSTRUCTIONS:")[1].split("_____")[0]
                
                context_str += f"- Key Instructions:\n{instructions_part.strip()}\n"

        return f"""
        A patient has sent the following message. Based on the chat history and the patient's clinical context, please provide a helpful and empathetic response.

        Clinical Context:
        {context_str}

        Chat History:
        {history_str}

        Latest message from Patient: "{chat_history[-1]['message']}"

        Please provide a response as the AI Care Assistant.
        """

    def _generate_template_chat_response(self, chat_history: List[Dict[str, str]]) -> str:
        """Fallback template-based chat response."""
        last_message = chat_history[-1]['message'].lower()
        if "thank" in last_message:
            return "You're very welcome! I'm here if you need anything else."
        elif "medication" in last_message or "pill" in last_message:
            return "I can see you have a question about your medication. It's always best to speak with your doctor or pharmacist about any medication questions. They can give you the most accurate information."
        else:
            return "Thank you for your message. I am an AI assistant and cannot provide medical advice, but I've noted your question. A member of your care team will get back to you shortly."
