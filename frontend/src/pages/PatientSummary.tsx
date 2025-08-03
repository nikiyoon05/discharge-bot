import { useParams } from 'react-router-dom';
import SummaryEditor from '@/components/features/SummaryEditor';
import BackButton from '@/components/common/BackButton';

export default function PatientSummary() {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <SummaryEditor />
    </div>
  );
}