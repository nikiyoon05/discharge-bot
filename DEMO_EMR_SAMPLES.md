# 🏥 Demo EMR File Upload Guide

## Overview
Your discharge planning bot now supports uploading **real EMR files** for demo purposes! This allows you to test with realistic clinical data before connecting to live Epic APIs.

## 📁 Supported File Formats

### ✅ **FHIR JSON Bundle** (Recommended)
- **Format**: `.json`
- **Standard**: HL7 FHIR R4
- **Best for**: Comprehensive patient data with multiple resources

### ✅ **C-CDA XML Document**
- **Format**: `.xml`
- **Standard**: HL7 C-CDA
- **Best for**: Clinical document-based data

### ⚠️ **PDF Reports** (Limited)
- **Format**: `.pdf`
- **Parsing**: Basic text extraction only
- **Note**: JSON/XML preferred for structured data

---

## 🔗 **Where to Find Real EMR Sample Files**

### **1. Synthea - Synthetic Patient Generator**
**URL**: https://synthea.mitre.org/
- **Best for**: Realistic synthetic patient data
- **Formats**: FHIR JSON, C-CDA XML, CSV
- **Download**: Pre-generated samples or run generator
- **Sample**: Download from their GitHub releases

### **2. HL7 FHIR Official Examples**
**URL**: https://www.hl7.org/fhir/examples.html
- **Best for**: Standard-compliant FHIR resources
- **Formats**: FHIR JSON
- **Content**: Individual resources and bundles

### **3. SMART on FHIR Sample Patients**
**URL**: https://github.com/smart-on-fhir/sample-patients
- **Best for**: App development and testing
- **Formats**: FHIR JSON bundles
- **Content**: Complete patient records

### **4. MITRE Patient Data**
**URL**: https://github.com/synthetichealth/synthea-sample-data
- **Best for**: Large datasets
- **Formats**: FHIR JSON, C-CDA XML
- **Content**: 1K+ synthetic patients

---

## 📋 **Quick Start Guide**

### **Step 1: Download Sample Data**
```bash
# Option 1: Download from Synthea
curl -L https://github.com/synthetichealth/synthea-sample-data/raw/main/fhir/Abernathy123_Jacinda456_2c4b5b6c-9b7a-4c8d-9e6f-1a2b3c4d5e6f.json

# Option 2: Use built-in sample generator
# Click "Download Sample FHIR Bundle" in the app
```

### **Step 2: Upload to Demo**
1. Navigate to **Patient Dashboard** → **Patient EHR Chart**
2. You'll see **Demo Mode** section (purple banner)
3. Click **"Choose File"** and select your EMR file
4. Wait for processing (2-3 seconds)
5. View parsed clinical data!

### **Step 3: Verify Data**
- Check **Demographics** section for patient info
- Review **Diagnoses** from uploaded file
- Examine **Medications** and dosages
- Look at **Clinical Notes** showing parsing results

---

## 🎯 **Sample FHIR Bundle Structure**

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-123",
        "identifier": [{"value": "MRN-123456789"}],
        "name": [{"given": ["John"], "family": "Doe"}],
        "gender": "male",
        "birthDate": "1965-03-15"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "code": {
          "coding": [{"display": "Type 2 Diabetes"}]
        }
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "medicationCodeableConcept": {
          "coding": [{"display": "Metformin 500mg"}]
        }
      }
    }
  ]
}
```

---

## 🛠️ **What Gets Parsed**

### **From FHIR JSON:**
- ✅ **Patient Demographics** (name, MRN, age, gender)
- ✅ **Conditions/Diagnoses** (primary, secondary)
- ✅ **Medications** (name, dosage, frequency)
- ✅ **Vital Signs** (BP, HR, temp, O2 sat)
- ✅ **Lab Results** (with reference ranges)
- ✅ **Clinical Notes** (discharge-relevant)

### **From C-CDA XML:**
- ✅ **Basic Demographics**
- ✅ **Problem List**
- ✅ **Medication List**
- ⚠️ **Limited Observations** (XML parsing complexity)

---

## 🔄 **Demo vs Live Mode**

### **Demo Mode** (Upload Files)
- 🟣 **Purple badge**: "Demo Mode"
- 📁 **File upload**: Accepts EMR files
- 🔄 **Data source**: "Uploaded File"
- ✨ **Perfect for**: Testing, demos, development

### **Live Mode** (Epic API)
- 🟢 **Green badge**: "Epic Connected"
- 🔗 **API integration**: Real Epic FHIR calls
- 🔄 **Data source**: "Live Epic"
- 🏥 **Perfect for**: Production, real patients

---

## 🎪 **Demo Workflow**

1. **Start in Demo Mode** (default)
2. **Download sample FHIR** from app or external sources
3. **Upload EMR file** via file input
4. **Watch parsing** in real-time (blue progress indicator)
5. **View clinical data** extracted from file
6. **Test discharge planning** with realistic data
7. **Switch to Live Epic** when ready for production

---

## 💡 **Pro Tips**

### **For Best Results:**
- Use **FHIR R4 JSON** bundles (most comprehensive)
- Look for files with **multiple resource types**
- **Synthea data** is most realistic for testing
- Files should be **<5MB** for best performance

### **Common Issues:**
- **Empty data**: File may not have expected FHIR structure
- **Parsing errors**: Check JSON validity
- **Missing fields**: Some FHIR resources may lack required fields

### **Recommended Test Files:**
1. **Synthea cardiac patient** (heart conditions, medications)
2. **Diabetes management** (chronic disease, multiple meds)
3. **Post-surgical patient** (procedures, follow-up care)

---

## 🚀 **Next Steps**

Once you've tested with demo data:

1. **Set up Epic credentials** in system settings
2. **Configure FHIR endpoints** for your Epic environment
3. **Switch to Live Mode** for real patient data
4. **Deploy with confidence** knowing the system works!

---

**Ready to test? Click "Download Sample FHIR Bundle" in the app to get started! 🎯**