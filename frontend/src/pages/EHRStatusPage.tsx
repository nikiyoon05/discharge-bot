import React from 'react';
import { useParams } from 'react-router-dom';
import PatientEHRChart from '@/components/features/PatientEHRChart';
import BackButton from '@/components/common/BackButton';

export default function PatientEHRPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <PatientEHRChart />
    </div>
  );
}