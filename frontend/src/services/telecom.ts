// Mock telecom service for patient communication
import { v4 as uuidv4 } from 'uuid';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SMSMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
  direction: 'inbound' | 'outbound';
}

export interface VoiceCall {
  id: string;
  from: string;
  to: string;
  duration: number; // in seconds
  timestamp: string;
  status: 'completed' | 'failed' | 'busy' | 'no-answer';
  transcript?: string;
  summary?: string;
}

export const telecomService = {
  // SMS Operations
  async sendSMS(to: string, body: string): Promise<SMSMessage> {
    await delay(300);
    return {
      id: uuidv4(),
      from: '+15551234567', // Hospital number
      to,
      body,
      timestamp: new Date().toISOString(),
      status: 'sent',
      direction: 'outbound'
    };
  },

  async getSMSHistory(patientPhone: string, limit: number = 50): Promise<SMSMessage[]> {
    await delay(400);
    return [
      {
        id: 'sms-001',
        from: '+15551234567',
        to: patientPhone,
        body: 'Reminder: Your follow-up appointment is tomorrow at 2 PM with Dr. Martinez.',
        timestamp: '2024-08-02T14:30:00Z',
        status: 'delivered',
        direction: 'outbound'
      },
      {
        id: 'sms-002',
        from: patientPhone,
        to: '+15551234567',
        body: 'Thank you. I will be there.',
        timestamp: '2024-08-02T14:35:00Z',
        status: 'delivered',
        direction: 'inbound'
      },
      {
        id: 'sms-003',
        from: patientPhone,
        to: '+15551234567',
        body: 'I have a question about my medication. Can someone call me?',
        timestamp: '2024-08-02T16:15:00Z',
        status: 'delivered',
        direction: 'inbound'
      }
    ];
  },

  // Voice Operations
  async initiateCall(to: string, from?: string): Promise<VoiceCall> {
    await delay(500);
    return {
      id: uuidv4(),
      from: from || '+15551234567',
      to,
      duration: 0,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
  },

  async getCallHistory(patientPhone: string, limit: number = 20): Promise<VoiceCall[]> {
    await delay(300);
    return [
      {
        id: 'call-001',
        from: '+15551234567',
        to: patientPhone,
        duration: 180, // 3 minutes
        timestamp: '2024-08-02T16:30:00Z',
        status: 'completed',
        transcript: 'Discussed medication concerns. Patient understands dosing instructions.',
        summary: 'Medication consultation - resolved concerns about timing and dosage'
      },
      {
        id: 'call-002',
        from: patientPhone,
        to: '+15551234567',
        duration: 45,
        timestamp: '2024-08-01T10:15:00Z',
        status: 'completed',
        summary: 'Brief check-in call about discharge planning'
      }
    ];
  },

  // Mock Twilio voice bot simulation
  async startVoiceBot(patientPhone: string, script: string): Promise<{
    callId: string;
    status: 'initiated' | 'failed';
    estimatedDuration: number;
  }> {
    await delay(600);
    return {
      callId: uuidv4(),
      status: 'initiated',
      estimatedDuration: 120 // 2 minutes estimated
    };
  },

  // Notification preferences
  async getNotificationPreferences(patientId: string): Promise<{
    sms: boolean;
    voice: boolean;
    email: boolean;
    preferredLanguage: string;
    bestTimeToContact: string;
  }> {
    await delay(200);
    return {
      sms: true,
      voice: true,
      email: false,
      preferredLanguage: 'en',
      bestTimeToContact: '9AM-5PM'
    };
  }
};