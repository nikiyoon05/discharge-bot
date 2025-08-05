import React from 'react';
import { useParams } from 'react-router-dom';
import DischargeMeeting from '@/components/features/DischargeMeeting';
import BackButton from '@/components/common/BackButton';

export default function DischargeMeetingPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <DischargeMeeting />
    </div>
  );
}