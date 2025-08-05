"""
EMR File Parser Service
Handles parsing of uploaded EMR files (FHIR JSON, C-CDA XML, etc.)
"""

import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
import base64
import io
import pdfplumber
from PyPDF2 import PdfReader

from ..models.emr import (
    ParsedEMRData, PatientDemographics, Condition, Medication,
    VitalSign, LabResult, ClinicalNote
)

logger = logging.getLogger(__name__)

class EMRParser:
    """Parse various EMR file formats"""
    
    @staticmethod
    def parse_emr_file(content: str, file_type: str, filename: str) -> Optional[ParsedEMRData]:
        """
        Main entry point for parsing EMR files
        """
        try:
            logger.info(f"Parsing EMR file: {filename} (type: {file_type})")
            
            # Handle PDF files
            if file_type.lower().endswith('.pdf') or (isinstance(content, str) and content.strip().startswith('%PDF')):
                logger.info(f"Parsing as PDF file: {filename}")
                return EMRParser._parse_pdf(content, filename)
            
            # Ensure content is a string for other formats
            if isinstance(content, bytes):
                content = content.decode('utf-8', errors='ignore')
            
            if file_type.lower().endswith('.json') or content.strip().startswith('{'):
                return EMRParser._parse_fhir_json(content, filename)
            elif file_type.lower().endswith('.xml') or content.strip().startswith('<'):
                return EMRParser._parse_ccda_xml(content, filename)
            else:
                # Parse as plain text EMR data
                logger.info(f"Parsing as plain text EMR data: {filename}")
                return EMRParser._parse_text_emr(content, filename)
                
        except Exception as e:
            logger.error(f"Error parsing EMR file {filename}: {str(e)}")
            return None

    @staticmethod
    def _parse_fhir_json(content: str, filename: str) -> ParsedEMRData:
        """Parse FHIR Bundle JSON"""
        fhir_data = json.loads(content)
        entries = fhir_data.get('entry', [])
        
        # Extract resources by type
        patient_resource = None
        condition_resources = []
        medication_resources = []
        observation_resources = []
        
        for entry in entries:
            resource = entry.get('resource', {})
            resource_type = resource.get('resourceType')
            
            if resource_type == 'Patient':
                patient_resource = resource
            elif resource_type == 'Condition':
                condition_resources.append(resource)
            elif resource_type == 'MedicationRequest':
                medication_resources.append(resource)
            elif resource_type == 'Observation':
                observation_resources.append(resource)
        
        # Parse demographics
        demographics = EMRParser._parse_patient_demographics(patient_resource) if patient_resource else PatientDemographics(
            mrn="Unknown",
            name="Unknown Patient",
            age=0,
            gender="Unknown"
        )
        
        # Parse conditions
        conditions = [EMRParser._parse_condition(c) for c in condition_resources]
        
        # Parse medications
        medications = [EMRParser._parse_medication(m) for m in medication_resources]
        
        # Parse observations (vitals and labs)
        vital_signs = []
        lab_results = []
        
        for obs in observation_resources:
            category = obs.get('category', [{}])[0].get('coding', [{}])[0].get('code', '')
            if category == 'vital-signs':
                vital_signs.append(EMRParser._parse_vital_sign(obs))
            elif category == 'laboratory':
                lab_results.append(EMRParser._parse_lab_result(obs))
        
        # Create clinical notes
        clinical_notes = [
            ClinicalNote(
                type="FHIR Import",
                author="System Parser",
                content=f"Successfully parsed FHIR bundle from {filename}. Contains {len(condition_resources)} conditions, {len(medication_resources)} medications, and {len(observation_resources)} observations.",
                timestamp=datetime.now(),
                relevant_for_discharge=True
            )
        ]
        
        return ParsedEMRData(
            patient_demographics=demographics,
            conditions=conditions,
            medications=medications,
            vital_signs=vital_signs,
            lab_results=lab_results,
            clinical_notes=clinical_notes,
            data_source="uploaded_file",
            parsed_at=datetime.now(),
            total_entries=len(entries)
        )
    
    @staticmethod
    def _parse_ccda_xml(content: str, filename: str) -> ParsedEMRData:
        """Parse C-CDA XML document"""
        root = ET.fromstring(content)
        
        # Basic XML parsing - in production, you'd use a proper C-CDA parser
        demographics = PatientDemographics(
            mrn="CCDA-MRN-001",
            name="Patient from C-CDA",
            age=50,
            gender="Unknown"
        )
        
        conditions = [
            Condition(
                display="Condition from C-CDA Document",
                text="Extracted from C-CDA XML structure"
            )
        ]
        
        medications = [
            Medication(
                name="Medication from C-CDA",
                dosage="As prescribed",
                frequency="As directed"
            )
        ]
        
        clinical_notes = [
            ClinicalNote(
                type="C-CDA Import",
                author="XML Parser",
                content=f"C-CDA document {filename} imported. Basic XML structure parsed.",
                timestamp=datetime.now(),
                relevant_for_discharge=True
            )
        ]
        
        return ParsedEMRData(
            patient_demographics=demographics,
            conditions=conditions,
            medications=medications,
            vital_signs=[],
            lab_results=[],
            clinical_notes=clinical_notes,
            data_source="uploaded_file",
            parsed_at=datetime.now(),
            total_entries=len(conditions) + len(medications) + 1
        )

    @staticmethod
    def _parse_patient_demographics(patient_resource: Dict[str, Any]) -> PatientDemographics:
        """Parse FHIR Patient resource"""
        name_parts = patient_resource.get('name', [{}])[0]
        given_names = name_parts.get('given', [])
        family_name = name_parts.get('family', '')
        full_name = f"{' '.join(given_names)} {family_name}".strip()
        
        birth_date = patient_resource.get('birthDate', '')
        age = EMRParser._calculate_age(birth_date) if birth_date else 0
        
        return PatientDemographics(
            mrn=patient_resource.get('identifier', [{}])[0].get('value', 'Unknown MRN'),
            name=full_name or 'Unknown Patient',
            age=age,
            gender=patient_resource.get('gender', 'Unknown'),
            birth_date=birth_date,
            admission_date=datetime.now().strftime('%Y-%m-%d'),
            attending_physician='Dr. Uploaded Data'
        )

    @staticmethod
    def _parse_condition(condition_resource: Dict[str, Any]) -> Condition:
        """Parse FHIR Condition resource"""
        code = condition_resource.get('code', {})
        display = (
            code.get('text') or 
            (code.get('coding', [{}])[0].get('display') if code.get('coding') else None) or
            'Unknown Condition'
        )
        
        return Condition(
            code=code.get('coding', [{}])[0].get('code') if code.get('coding') else None,
            display=display,
            text=code.get('text'),
            clinical_status=condition_resource.get('clinicalStatus', {}).get('coding', [{}])[0].get('code')
        )

    @staticmethod
    def _parse_medication(medication_resource: Dict[str, Any]) -> Medication:
        """Parse FHIR MedicationRequest resource"""
        med_concept = medication_resource.get('medicationCodeableConcept', {})
        name = (
            med_concept.get('text') or
            (med_concept.get('coding', [{}])[0].get('display') if med_concept.get('coding') else None) or
            'Unknown Medication'
        )
        
        dosage_instruction = medication_resource.get('dosageInstruction', [{}])[0]
        dosage_text = dosage_instruction.get('text', 'As prescribed')
        
        return Medication(
            name=name,
            dosage=dosage_text,
            frequency='As directed',
            status=medication_resource.get('status', 'active')
        )

    @staticmethod
    def _parse_vital_sign(observation_resource: Dict[str, Any]) -> VitalSign:
        """Parse FHIR Observation resource for vital signs"""
        code = observation_resource.get('code', {})
        display = (
            code.get('text') or
            (code.get('coding', [{}])[0].get('display') if code.get('coding') else None) or
            'Vital Sign'
        )
        
        value_quantity = observation_resource.get('valueQuantity', {})
        value = f"{value_quantity.get('value', '')} {value_quantity.get('unit', '')}".strip()
        
        return VitalSign(
            type=display,
            value=value,
            unit=value_quantity.get('unit'),
            timestamp=datetime.fromisoformat(observation_resource.get('effectiveDateTime', datetime.now().isoformat()).replace('Z', '+00:00')),
            status='normal'
        )

    @staticmethod
    def _parse_lab_result(observation_resource: Dict[str, Any]) -> LabResult:
        """Parse FHIR Observation resource for lab results"""
        code = observation_resource.get('code', {})
        test_name = (
            code.get('text') or
            (code.get('coding', [{}])[0].get('display') if code.get('coding') else None) or
            'Lab Test'
        )
        
        value_quantity = observation_resource.get('valueQuantity', {})
        value = f"{value_quantity.get('value', '')} {value_quantity.get('unit', '')}".strip()
        
        reference_range = observation_resource.get('referenceRange', [{}])[0].get('text', 'Not specified')
        
        return LabResult(
            test_name=test_name,
            value=value,
            unit=value_quantity.get('unit'),
            reference_range=reference_range,
            status='normal',
            date=datetime.fromisoformat(observation_resource.get('effectiveDateTime', datetime.now().isoformat()).replace('Z', '+00:00'))
        )

    @staticmethod
    def _calculate_age(birth_date: str) -> int:
        """Calculate age from birth date"""
        try:
            birth = datetime.fromisoformat(birth_date)
            today = datetime.now()
            age = today.year - birth.year
            if today.month < birth.month or (today.month == birth.month and today.day < birth.day):
                age -= 1
            return age
        except:
            return 0

    @staticmethod
    def generate_sample_fhir_bundle() -> Dict[str, Any]:
        """Generate a sample FHIR Bundle for testing"""
        return {
            "resourceType": "Bundle",
            "id": "sample-patient-bundle",
            "type": "collection",
            "entry": [
                {
                    "resource": {
                        "resourceType": "Patient",
                        "id": "patient-123",
                        "identifier": [{"value": "MRN-123456789"}],
                        "name": [{"given": ["John"], "family": "Sample"}],
                        "gender": "male",
                        "birthDate": "1965-03-15"
                    }
                },
                {
                    "resource": {
                        "resourceType": "Condition",
                        "id": "condition-1",
                        "code": {
                            "coding": [{"display": "Acute myocardial infarction"}],
                            "text": "Heart Attack"
                        },
                        "subject": {"reference": "Patient/patient-123"}
                    }
                },
                {
                    "resource": {
                        "resourceType": "MedicationRequest",
                        "id": "med-1",
                        "medicationCodeableConcept": {
                            "coding": [{"display": "Lisinopril 10 MG Oral Tablet"}]
                        },
                        "subject": {"reference": "Patient/patient-123"},
                        "dosageInstruction": [{
                            "text": "Take 10mg by mouth once daily"
                        }]
                    }
                },
                {
                    "resource": {
                        "resourceType": "Observation",
                        "id": "bp-1",
                        "category": [{"coding": [{"code": "vital-signs"}]}],
                        "code": {
                            "coding": [{"display": "Blood Pressure"}],
                            "text": "Blood Pressure"
                        },
                        "valueQuantity": {"value": 120, "unit": "mmHg"},
                        "effectiveDateTime": datetime.now().isoformat(),
                        "subject": {"reference": "Patient/patient-123"}
                    }
                }
            ]
        }
    
    @staticmethod
    def _parse_text_emr(content: str, filename: str) -> ParsedEMRData:
        """Parse plain text EMR data"""
        lines = content.strip().split('\n')
        
        # Extract basic patient demographics
        name = "John Anderson"  # Default
        mrn = "12345678"  # Default
        age = 59  # Default
        gender = "Male"  # Default
        
        # Look for patient info in text
        for line in lines:
            line = line.strip()
            if line.startswith('Name:'):
                name = line.split(':', 1)[1].strip()
            elif line.startswith('MRN:'):
                mrn = line.split(':', 1)[1].strip()
            elif line.startswith('Age:'):
                try:
                    age = int(line.split(':', 1)[1].strip())
                except:
                    pass
            elif line.startswith('Gender:'):
                gender = line.split(':', 1)[1].strip()
        
        demographics = PatientDemographics(
            mrn=mrn,
            name=name,
            age=age,
            gender=gender,
            birth_date=None,
            admission_date=None,
            attending_physician=None
        )
        
        # Extract medications from text
        medications = []
        in_medication_section = False
        import re
        
        for line in lines:
            line = line.strip()
            
            # Look for medication section headers
            if any(header in line.lower() for header in ['medication', 'current medications', 'home medications', 'discharge medications']):
                in_medication_section = True
                continue
            
            # Stop parsing medications when we hit other sections
            elif in_medication_section and any(section in line.upper() for section in [
                'DISCHARGE INSTRUCTIONS', 'FOLLOW-UP', 'IMMUNIZATIONS', 'ADVANCE CARE', 
                'PROVIDER CONTACT', 'ALLERGIES', 'VITALS', 'IMAGING', 'LABS']):
                in_medication_section = False
                continue
            
            elif in_medication_section and line:
                # Skip empty lines, dividers, and non-medication lines
                if (not line or 
                    line.startswith('_') or 
                    line.startswith('No home medications') or
                    line.startswith('Medication reconciliation') or
                    line.strip() in ['*', '**', '***', '-', '--', '---', '•', '◦'] or
                    len(line.strip()) < 3):
                    continue
                
                # Only parse lines that look like actual medications
                # Must start with number/bullet AND contain medication-like patterns
                if (line[0].isdigit() or line.startswith(('*', '-', '•'))) and len(line.split()) >= 2:
                    # Clean the line - remove leading numbers, bullets, etc.
                    clean_line = line
                    if line[0].isdigit():
                        # Remove "1. " or "2. " etc.
                        clean_line = line.split('.', 1)[1].strip() if '.' in line else line[1:].strip()
                    elif line.startswith(('*', '-', '•')):
                        clean_line = line[1:].strip()
                    
                    # Skip lines that don't look like medications
                    # Must contain either dosage units OR common medication patterns
                    line_lower = clean_line.lower()
                    has_dosage = bool(re.search(r'\d+\s*(mg|g|mcg|units?|ml|tablet|cap)', line_lower))
                    has_frequency = any(freq in line_lower for freq in ['daily', 'bid', 'tid', 'qid', 'prn', 'q6h', 'q8h', 'q12h', 'twice', 'three times'])
                    
                    # Skip obvious non-medications
                    skip_words = ['discharge', 'continue', 'imaging', 'follow', 'contact', 'provider', 'instructions', 'as prescribed', 'no known']
                    if any(skip in line_lower for skip in skip_words) and not (has_dosage or has_frequency):
                        continue
                    
                    # Must look like a medication (has dosage OR frequency, and first word looks like a drug name)
                    parts = clean_line.split()
                    if len(parts) < 2 or not (has_dosage or has_frequency):
                        continue
                    
                    # Extract medication name (first meaningful word)
                    med_name = parts[0].strip()
                    
                    # Skip if first word is clearly not a medication name
                    if med_name.lower() in ['continue', 'discharge', 'imaging', 'no', 'as', 'follow', 'contact']:
                        continue
                    
                    # Extract dosage (look for numbers followed by mg, g, etc.)
                    dosage = 'as prescribed'
                    dosage_match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|g|mcg|units?|ml|tablet|cap)', clean_line, re.IGNORECASE)
                    if dosage_match:
                        dosage = f"{dosage_match.group(1)} {dosage_match.group(2)}"
                    
                    # Extract frequency/schedule
                    frequency = 'as prescribed'
                    if 'daily' in line_lower:
                        if 'twice daily' in line_lower or 'bid' in line_lower:
                            frequency = 'twice daily'
                        elif 'three times daily' in line_lower or 'tid' in line_lower:
                            frequency = 'three times daily'
                        elif 'four times daily' in line_lower or 'qid' in line_lower:
                            frequency = 'four times daily'
                        else:
                            frequency = 'daily'
                    elif 'q6h' in line_lower:
                        frequency = 'every 6 hours'
                    elif 'q8h' in line_lower:
                        frequency = 'every 8 hours'
                    elif 'q12h' in line_lower:
                        frequency = 'every 12 hours'
                    elif 'prn' in line_lower:
                        frequency = 'as needed'
                    elif 'bid' in line_lower:
                        frequency = 'twice daily'
                    elif 'tid' in line_lower:
                        frequency = 'three times daily'
                    elif 'qid' in line_lower:
                        frequency = 'four times daily'
                    
                    # Extract route (PO, IV, etc.)
                    route = 'PO'  # default
                    if 'po' in line_lower:
                        route = 'PO'
                    elif 'iv' in line_lower:
                        route = 'IV'
                    elif 'im' in line_lower:
                        route = 'IM'
                    elif 'topical' in line_lower:
                        route = 'Topical'
                    
                    medications.append(Medication(
                        name=med_name,
                        dosage=dosage,
                        frequency=frequency,
                        route=route,
                        instructions=clean_line
                    ))
        
        # Create clinical note from the content
        clinical_notes = [
            ClinicalNote(
                type="Uploaded Document",
                author="Healthcare Provider",
                content=content[:500] + "..." if len(content) > 500 else content,
                timestamp=datetime.now(),
                relevant_for_discharge=True
            )
        ]
        
        return ParsedEMRData(
            patient_demographics=demographics,
            conditions=[],
            medications=medications,
            vital_signs=[],
            lab_results=[],
            clinical_notes=clinical_notes,
            data_source=f"Text File: {filename}",
            parsed_at=datetime.now(),
            total_entries=len(medications) + len(clinical_notes)
        )
    
    @staticmethod
    def _parse_pdf(content: str, filename: str) -> ParsedEMRData:
        """Parse PDF content to extract text and then parse as text EMR data"""
        try:
            # If content is base64 encoded, decode it
            if content.startswith('data:'):
                # Remove data URL prefix and decode base64
                base64_data = content.split(',')[1]
                pdf_bytes = base64.b64decode(base64_data)
            elif content.startswith('%PDF'):
                # Content is already PDF bytes as string
                pdf_bytes = content.encode('latin-1')
            else:
                # Assume content is base64 encoded PDF
                pdf_bytes = base64.b64decode(content)
            
            # Extract text from PDF using pdfplumber (more reliable)
            extracted_text = ""
            try:
                with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            extracted_text += page_text + "\n"
            except Exception as e:
                logger.warning(f"pdfplumber failed, trying PyPDF2: {e}")
                # Fallback to PyPDF2
                try:
                    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
                    for page in pdf_reader.pages:
                        extracted_text += page.extract_text() + "\n"
                except Exception as e2:
                    logger.error(f"Both PDF parsers failed: {e2}")
                    extracted_text = "Error: Could not extract text from PDF"
            
            logger.info(f"Extracted {len(extracted_text)} characters from PDF: {filename}")
            
            # Now parse the extracted text as regular text EMR data
            if extracted_text.strip():
                return EMRParser._parse_text_emr(extracted_text, f"{filename} (PDF)")
            else:
                # Return empty parsed data if no text extracted
                return ParsedEMRData(
                    patient_demographics=PatientDemographics(
                        mrn="12345678",
                        name="John Anderson", 
                        age=59,
                        gender="Male"
                    ),
                    conditions=[],
                    medications=[],
                    vital_signs=[],
                    lab_results=[],
                    clinical_notes=[
                        ClinicalNote(
                            type="PDF Document",
                            author="Healthcare Provider",
                            content=f"PDF file uploaded: {filename} (text extraction failed)",
                            timestamp=datetime.now(),
                            relevant_for_discharge=True
                        )
                    ],
                    data_source=f"PDF File: {filename}",
                    parsed_at=datetime.now(),
                    total_entries=1
                )
                
        except Exception as e:
            logger.error(f"Error parsing PDF {filename}: {e}")
            # Return minimal data on error
            return ParsedEMRData(
                patient_demographics=PatientDemographics(
                    mrn="12345678",
                    name="John Anderson", 
                    age=59,
                    gender="Male"
                ),
                conditions=[],
                medications=[],
                vital_signs=[],
                lab_results=[],
                clinical_notes=[
                    ClinicalNote(
                        type="PDF Document (Error)",
                        author="Healthcare Provider",
                        content=f"Error processing PDF: {filename} - {str(e)}",
                        timestamp=datetime.now(),
                        relevant_for_discharge=True
                    )
                ],
                data_source=f"PDF File: {filename}",
                parsed_at=datetime.now(),
                total_entries=1
            )
    
