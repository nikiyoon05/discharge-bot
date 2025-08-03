import { useParams } from 'react-router-dom';
import Scheduler from '@/components/features/Scheduler';
import BackButton from '@/components/common/BackButton';

export default function PatientSchedule() {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <Scheduler />
    </div>
  );
}