import { useParams } from 'react-router-dom';
import MedReconcile from '@/components/features/MedReconcile';
import BackButton from '@/components/common/BackButton';

export default function PatientMedRec() {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <MedReconcile />
    </div>
  );
}