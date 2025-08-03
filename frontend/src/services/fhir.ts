// Mock FHIR service for healthcare data operations
import { v4 as uuidv4 } from 'uuid';

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    family: string;
    given: string[];
  }>;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status: 'in-progress' | 'finished';
  subject: { reference: string };
  period: {
    start: string;
    end?: string;
  };
  reasonCode?: Array<{
    text: string;
  }>;
}

export interface FHIRMedication {
  resourceType: 'Medication';
  id: string;
  code: {
    text: string;
  };
  form?: {
    text: string;
  };
}

export interface FHIRAppointment {
  resourceType: 'Appointment';
  id: string;
  status: 'booked' | 'cancelled' | 'fulfilled';
  serviceType: Array<{
    text: string;
  }>;
  start: string;
  end: string;
  participant: Array<{
    actor: { reference: string; display: string };
    status: 'accepted' | 'declined' | 'tentative';
  }>;
}

// Mock API responses with realistic delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fhirService = {
  // Get patient by ID
  async getPatient(patientId: string): Promise<FHIRPatient> {
    await delay(300);
    return {
      resourceType: 'Patient',
      id: patientId,
      identifier: [
        {
          system: 'hospital-mrn',
          value: '12345678'
        }
      ],
      name: [
        {
          family: 'Anderson',
          given: ['John', 'William']
        }
      ],
      birthDate: '1965-03-15',
      gender: 'male'
    };
  },

  // Get encounter notes for summary generation
  async getEncounterNotes(patientId: string): Promise<string[]> {
    await delay(500);
    return [
      "Patient admitted with acute pneumonia. Chest X-ray shows consolidation in right lower lobe.",
      "Vital signs stable. Temperature 99.2°F, BP 135/82, HR 88, RR 18, O2 sat 96% on room air.",
      "Started on azithromycin 500mg daily. Patient reports improvement in cough and shortness of breath.",
      "Repeat chest X-ray shows clearing of consolidation. Patient ambulating without difficulty.",
      "Ready for discharge with oral antibiotics. Follow-up arranged with primary care in 1 week."
    ];
  },

  // Get current medications
  async getCurrentMedications(patientId: string): Promise<FHIRMedication[]> {
    await delay(400);
    return [
      {
        resourceType: 'Medication',
        id: 'med-001',
        code: { text: 'Lisinopril 10mg' },
        form: { text: 'Tablet' }
      },
      {
        resourceType: 'Medication',
        id: 'med-002',
        code: { text: 'Metformin 500mg' },
        form: { text: 'Tablet' }
      },
      {
        resourceType: 'Medication',
        id: 'med-003',
        code: { text: 'Azithromycin 500mg' },
        form: { text: 'Tablet' }
      }
    ];
  },

  // Create appointment
  async createAppointment(appointmentData: {
    patientId: string;
    providerId: string;
    startTime: string;
    serviceType: string;
  }): Promise<FHIRAppointment> {
    await delay(600);
    const endTime = new Date(appointmentData.startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);
    
    return {
      resourceType: 'Appointment',
      id: uuidv4(),
      status: 'booked',
      serviceType: [{ text: appointmentData.serviceType }],
      start: appointmentData.startTime,
      end: endTime.toISOString(),
      participant: [
        {
          actor: { 
            reference: `Patient/${appointmentData.patientId}`,
            display: 'John Anderson'
          },
          status: 'accepted'
        },
        {
          actor: {
            reference: `Practitioner/${appointmentData.providerId}`,
            display: 'Dr. Martinez'
          },
          status: 'accepted'
        }
      ]
    };
  },

  // Submit discharge summary
  async submitDischargeSummary(patientId: string, summary: string): Promise<{ success: boolean; documentId: string }> {
    await delay(800);
    return {
      success: true,
      documentId: `doc-${uuidv4()}`
    };
  }
};