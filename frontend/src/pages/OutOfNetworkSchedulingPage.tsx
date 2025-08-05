import React from 'react';
import { useParams } from 'react-router-dom';
import OutOfNetworkScheduling from '@/components/features/OutOfNetworkScheduling';
import BackButton from '@/components/common/BackButton';

export default function OutOfNetworkSchedulingPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <OutOfNetworkScheduling />
    </div>
  );
}