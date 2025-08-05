import React from 'react';
import EHRConnectionStatus from '@/components/features/EHRConnectionStatus';
import BackButton from '@/components/common/BackButton';

export default function SystemEpicIntegrationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-screen-2xl mx-auto px-6 py-6">
        <BackButton to="/patients" label="Back to Patient Census" className="mb-4" />
        <EHRConnectionStatus />
      </div>
    </div>
  );
}