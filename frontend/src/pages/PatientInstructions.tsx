import { useParams } from 'react-router-dom';
import InstructionForm from '@/components/features/InstructionForm';
import BackButton from '@/components/common/BackButton';

export default function PatientInstructions() {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <InstructionForm />
    </div>
  );
}