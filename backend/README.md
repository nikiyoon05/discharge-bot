# CareExit Discharge Planning Bot - Backend

## 🏥 Real-World Hospital Discharge Planning Context

This Python backend implements an AI-powered discharge planning bot that automates the complex workflow of transitioning patients from hospital to home or post-acute care. It integrates with Epic EMR systems via FHIR APIs to provide intelligent discharge planning assistance.

### What This System Does

**Core Functions:**
1. **Clinical Data Integration** - Pulls patient data from Epic EMR via FHIR APIs
2. **Complexity Assessment** - AI-powered analysis of discharge complexity factors
3. **Readiness Assessment** - Systematic evaluation of discharge readiness criteria
4. **Workflow Automation** - Orchestrates tasks across multiple care teams
5. **Risk Prediction** - ML-based readmission risk assessment
6. **Documentation Generation** - AI-generated discharge summaries and patient instructions

### Real-World Discharge Planning Workflow

```mermaid
graph TD
    A[Patient Admission] --> B[Early Discharge Planning]
    B --> C[Assess Complexity Factors]
    C --> D{Simple or Complex?}
    
    D -->|Simple| E[Standard Discharge Workflow]
    D -->|Complex| F[Multidisciplinary Care Team]
    
    F --> G[Social Work Assessment]
    F --> H[Case Management]
    F --> I[Clinical Assessment]
    
    G --> J[Coordinate Care Transitions]
    H --> J
    I --> J
    
    J --> K[Generate Discharge Plan]
    K --> L[AI Risk Assessment]
    L --> M[Patient Education]
    M --> N[Follow-up Scheduling]
    N --> O[Medication Reconciliation]
    O --> P[Equipment/DME Setup]
    P --> Q{Ready for Discharge?}
    
    Q -->|No| R[Address Barriers] --> Q
    Q -->|Yes| S[Execute Discharge]
    S --> T[Post-Discharge Monitoring]
```

## 📊 Epic EMR Integration - Data Inputs

### FHIR Resources Required
- **Patient** - Demographics, insurance, contacts
- **Encounter** - Admission details, location, attending
- **Condition** - Diagnoses, problem list, clinical status
- **MedicationRequest** - Current meds, home meds, new Rxs
- **Observation** - Vitals, labs, functional assessments
- **Procedure** - Surgeries, treatments performed
- **CarePlan** - Treatment goals, discharge planning notes
- **Appointment** - Scheduled follow-ups

### Complexity Assessment Factors
```python
COMPLEXITY_FACTORS = {
    "clinical": [
        "multiple_comorbidities", "polypharmacy", "wound_care", 
        "dialysis_required", "oxygen_dependency", "pain_management"
    ],
    "behavioral": [
        "substance_use_disorder", "mental_health_conditions",
        "medication_adherence_issues", "cognitive_impairment"
    ],
    "social": [
        "homelessness_risk", "inadequate_social_support", 
        "insurance_issues", "transportation_barriers", "language_barriers"
    ],
    "functional": [
        "mobility_impairment", "assistance_with_adls",
        "fall_risk", "nutritional_concerns"
    ]
}
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- PostgreSQL
- Redis (for caching/task queue)
- Epic FHIR API credentials

### Installation

1. **Clone and setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Environment Configuration:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup:**
```bash
# Create PostgreSQL database
createdb careexit_db

# Run migrations
alembic upgrade head
```

4. **Start the API:**
```bash
uvicorn main:app --reload --port 3001
```

### Configuration (.env file)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost/careexit_db

# Epic FHIR API
EPIC_FHIR_BASE_URL=https://fhir.epic.com/interconnect-fhir-oauth
EPIC_CLIENT_ID=your_client_id
EPIC_CLIENT_SECRET=your_client_secret

# AI Services
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-change-in-production
```

## 🏗️ Architecture

### API Endpoints

**Discharge Planning:**
- `POST /api/discharge/plan` - Create discharge plan
- `GET /api/discharge/plan/{patient_id}` - Get discharge plan
- `POST /api/discharge/risk-assessment` - Assess readmission risk
- `GET /api/discharge/workflow/{patient_id}` - Get workflow tasks

**AI Services:**
- `POST /api/ai/summary/generate` - Generate discharge summary
- `POST /api/ai/instructions/generate` - Generate patient instructions
- `POST /api/ai/complexity/assess` - Assess discharge complexity

**FHIR Integration:**
- `GET /api/fhir/patient/{id}` - Get patient data
- `GET /api/fhir/encounter/{id}` - Get encounter data
- `GET /api/fhir/conditions/{patient_id}` - Get conditions
- `GET /api/fhir/medications/{patient_id}` - Get medications

### Key Components

1. **FHIR Service** (`app/services/fhir_service.py`)
   - Epic EMR integration via FHIR APIs
   - OAuth2 authentication
   - Comprehensive patient data retrieval

2. **AI Service** (`app/services/ai_service.py`)
   - OpenAI integration for NLP tasks
   - Risk prediction models
   - Clinical decision support

3. **Discharge Service** (`app/services/discharge_service.py`)
   - Core discharge planning logic
   - Workflow orchestration
   - Complexity assessment

## 🤖 AI/ML Components

### 1. Discharge Complexity Assessment
- **Input**: Patient clinical data, social factors, functional status
- **Output**: Complexity score (0-100) with specific risk factors
- **Method**: Rule-based logic + ML classification

### 2. Readmission Risk Prediction
- **Input**: Demographics, diagnoses, medications, social factors
- **Output**: 30-day readmission probability + interventions
- **Method**: Ensemble ML model (XGBoost + Neural Network)

### 3. Discharge Summary Generation
- **Input**: Clinical notes, lab results, procedures, medications
- **Output**: Structured discharge summary
- **Method**: GPT-4 with clinical prompting

### 4. Patient Instruction Generation
- **Input**: Clinical data, literacy level, language preference
- **Output**: Patient-friendly discharge instructions
- **Method**: GPT-4 with health literacy optimization

## 📈 Next Steps

1. **Database Integration** - Set up PostgreSQL schemas and models
2. **Epic FHIR Authentication** - Implement OAuth2 flow for Epic APIs
3. **ML Model Training** - Train readmission risk prediction models
4. **Workflow Engine** - Implement task orchestration and notifications
5. **Testing** - Comprehensive unit and integration tests
6. **Production Deployment** - Docker containerization and CI/CD

## 🔐 Security & Compliance

- **HIPAA Compliance** - Encrypted data transmission and storage
- **Epic App Orchard** - Follow Epic's app certification requirements
- **Audit Logging** - Comprehensive access and action logging
- **Data Minimization** - Only access necessary patient data

## 📞 Support

For questions about implementation or Epic integration:
- Review Epic's FHIR documentation: https://fhir.epic.com/
- Check Epic's App Orchard requirements
- Consider Epic's sandbox environment for testing