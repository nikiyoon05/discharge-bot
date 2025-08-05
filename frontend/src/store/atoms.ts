import { atom, selector } from 'recoil';

// Auth state
export const authUserState = atom({
  key: 'authUserState',
  default: {
    id: 'dr-smith-001',
    name: 'Dr. Sarah Smith',
    role: 'clinician',
    department: 'Internal Medicine',
    isAuthenticated: true,
  },
});

// Theme state
export const themeState = atom({
  key: 'themeState',
  default: 'light' as 'light' | 'dark',
});

// Current patient context
export const currentPatientState = atom({
  key: 'currentPatientState',
  default: {
    id: 'patient-001',
    name: 'John Anderson',
    mrn: '12345678',
    dob: '1965-03-15',
    unit: 'Med-Surg 4A',
    room: '401B',
    los: 3, // Length of stay in days
    admissionDate: '2024-08-01',
    primaryDiagnosis: 'Pneumonia',
    allergies: ['Penicillin', 'Sulfa'],
  },
});

// Notification state
export const notificationState = atom({
  key: 'notificationState',
  default: {
    unreadMessages: 2,
    pendingApprovals: 1,
    criticalAlerts: 0,
  },
});

// Navigation state
export const sidebarOpenState = atom({
  key: 'sidebarOpenState',
  default: true,
});

// Audit logging
export const auditLogState = atom({
  key: 'auditLogState',
  default: [] as Array<{
    id: string;
    timestamp: string;
    action: string;
    resource: string;
    userId: string;
    patientId?: string;
    dataHash: string;
  }>,
});

export const ehrDataState = atom({
  key: 'ehrDataState',
  default: null,
});

export const medicationsSelector = selector({
  key: 'medicationsSelector',
  get: ({ get }) => {
    const ehrData = get(ehrDataState);
    if (!ehrData) {
      return [];
    }
    return ehrData.currentMedications;
  },
});

export const dashboardState = atom({
  key: 'dashboardState',
  default: {
    'pre-discharge-meeting': 'not-completed',
    'patient-ehr-chart': 'not-connected',
    'out-of-network-scheduling': 'to-do',
    'medication-reconciliation': 'not-generated',
    'patient-instructions': 'not-generated',
  },
});
