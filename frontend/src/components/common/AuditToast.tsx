import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { auditLogState } from '@/store/atoms';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface AuditLogEntry {
  action: string;
  resource: string;
  userId: string;
  patientId?: string;
  data?: any;
}

export const useAuditLog = () => {
  const [auditLog, setAuditLog] = useRecoilState(auditLogState);

  const logAction = (entry: AuditLogEntry) => {
    // Create a hash of the data for audit purposes (mock implementation)
    const dataHash = btoa(JSON.stringify(entry.data || {})).substring(0, 16);
    
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      action: entry.action,
      resource: entry.resource,
      userId: entry.userId,
      patientId: entry.patientId,
      dataHash
    };

    setAuditLog(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 entries

    // Show audit toast for critical actions
    if (['DISCHARGE_SUMMARY_SIGNED', 'MEDICATION_RECONCILED', 'APPOINTMENT_BOOKED'].includes(entry.action)) {
      toast.success(`Action logged: ${entry.action} (${dataHash})`, {
        duration: 3000,
        position: 'bottom-right'
      });
    }

    return logEntry;
  };

  return { auditLog, logAction };
};

export default function AuditToast() {
  // This component is used to initialize audit logging
  // The actual logging is done via the useAuditLog hook
  return null;
}