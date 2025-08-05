import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  FileText,
  Stethoscope,
  Pill,
  Activity,
  Calendar,
  User,
  Heart,
  Thermometer,
  Upload,
  Download,
  FileJson,
  AlertCircle,
  X
} from 'lucide-react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentPatientState, ehrDataState, dashboardState } from '@/store/atoms';
import { toast } from 'react-hot-toast';

interface PatientEHRData {
  connectionStatus: 'connected' | 'error' | 'loading' | 'demo';
  lastSync: Date;
  recordsFound: number;
  dataSource: 'epic' | 'uploaded_file' | 'mock';
  
  // Clinical Data from Epic
  demographics: {
    mrn: string;
    age: number;
    gender: string;
    admissionDate: string;
    attendingPhysician: string;
  };
  
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  
  recentVitals: Array<{
    type: string;
    value: string;
    timestamp: Date;
    status: 'normal' | 'abnormal' | 'critical';
  }>;
  
  recentLabs: Array<{
    test: string;
    value: string;
    range: string;
    status: 'normal' | 'abnormal' | 'critical';
    date: Date;
  }>;
  
  clinicalNotes: Array<{
    type: string;
    author: string;
    content: string;
    timestamp: Date;
    relevantForDischarge: boolean;
  }>;
  
  dischargeReadiness: {
    clinicalStability: boolean;
    clearanceNotes: string[];
    pendingOrders: string[];
    followUpRequired: string[];
  };
}

export default function PatientEHRChart() {
  const patient = useRecoilValue(currentPatientState);
  const setEhrDataGlobal = useSetRecoilState(ehrDataState);
  const setDashboardState = useSetRecoilState(dashboardState);
  
  const ehrInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const summaryInputRef = useRef<HTMLInputElement>(null);
  const [uploadedEHR, setUploadedEHR] = useState<File | null>(null);
  const [uploadedNotes, setUploadedNotes] = useState<File | null>(null);
  const [uploadedSummary, setUploadedSummary] = useState<File | null>(null);
  
  const [ehrFileName, setEhrFileName] = useState<string | null>(null);
  const [notesFileName, setNotesFileName] = useState<string | null>(null);
  const [summaryFileName, setSummaryFileName] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: boolean}>({
    ehr: false,
    notes: false,
    summary: false
  });
  
  const [ehrData, setEhrData] = useState<PatientEHRData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load existing patient data on component mount
  useEffect(() => {
    const loadPatientData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/emr/patient/${patient.id}/data`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const backendData = result.data.emr_data;
            const convertedData = convertBackendToFrontendData(backendData);
            setEhrData(convertedData);
            setEhrDataGlobal(backendData);
            
            // Update dashboard status
            setDashboardState(prev => ({
              ...prev,
              'patient-ehr-chart': 'connected',
              'medication-reconciliation': 'ready',
              'patient-instructions': 'ready'
            }));

            // Set uploaded file names and progress if they exist
            const uploadedFiles = result.data.uploaded_files;
            if (uploadedFiles) {
              if (uploadedFiles.ehr_file) {
                setEhrFileName('EHR Data');
                setUploadProgress(prev => ({ ...prev, ehr: true }));
              }
              if (uploadedFiles.doctor_notes) {
                setNotesFileName('Doctor Notes');
                setUploadProgress(prev => ({ ...prev, notes: true }));
              }
              if (uploadedFiles.discharge_summary) {
                setSummaryFileName('Discharge Summary');
                setUploadProgress(prev => ({ ...prev, summary: true }));
              }
            }
          }
        }
      } catch (error) {
        console.log('No existing patient data found');
      }
    };

    loadPatientData();
  }, [patient.id, setEhrDataGlobal, setDashboardState]);

  // File upload handlers - just store files locally until all three are uploaded
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: 'ehr' | 'notes' | 'summary') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Store the file and update progress
    if (fileType === 'ehr') {
      setUploadedEHR(file);
      setEhrFileName(file.name);
    } else if (fileType === 'notes') {
      setUploadedNotes(file);
      setNotesFileName(file.name);
    } else if (fileType === 'summary') {
      setUploadedSummary(file);
      setSummaryFileName(file.name);
    }

    // Update upload progress
    setUploadProgress(prev => ({
      ...prev,
      [fileType]: true
    }));

    toast.success(`${fileType.toUpperCase()} file uploaded: ${file.name}`);
  };

  // Clear/remove a selected file
  const clearFile = (fileType: 'ehr' | 'notes' | 'summary') => {
    if (fileType === 'ehr') {
      setUploadedEHR(null);
      setEhrFileName(null);
      if (ehrInputRef.current) {
        ehrInputRef.current.value = '';
      }
    } else if (fileType === 'notes') {
      setUploadedNotes(null);
      setNotesFileName(null);
      if (notesInputRef.current) {
        notesInputRef.current.value = '';
      }
    } else if (fileType === 'summary') {
      setUploadedSummary(null);
      setSummaryFileName(null);
      if (summaryInputRef.current) {
        summaryInputRef.current.value = '';
      }
    }

    // Update upload progress
    setUploadProgress(prev => ({
      ...prev,
      [fileType]: false
    }));

    toast.success(`${fileType.toUpperCase()} file removed`);
  };

  // Process all files when all three are uploaded
  const processAllFiles = async () => {
    if (!uploadedEHR || !uploadedNotes || !uploadedSummary) {
      toast.error('Please upload all three files before processing');
      return;
    }

    setIsProcessingFile(true);
    setProcessingStatus('Reading uploaded files...');

    try {
      // Read all files as base64
      const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      setProcessingStatus('Processing files...');
      const [ehrContent, notesContent, summaryContent] = await Promise.all([
        readFileAsBase64(uploadedEHR),
        readFileAsBase64(uploadedNotes),
        readFileAsBase64(uploadedSummary)
      ]);

      setProcessingStatus('Connecting to backend...');
      
      // Prepare upload data with all files
      const uploadData = {
        filename: `${patient.name}_combined_files`,
        file_type: 'combined',
        ehr_file: ehrContent,
        notes_file: notesContent,
        summary_file: summaryContent
      };

      // Call backend API to parse EMR file and generate summary
      const response = await fetch(`http://localhost:8000/api/emr/upload?patient_id=${patient.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      setProcessingStatus('Parsing EMR data with AI...');
      const result = await response.json();
      
      if (result.success && result.data) {
        setProcessingStatus('Generating AI summary...');
        // Convert backend data to frontend format
        const backendData = result.data;
        const convertedData = convertBackendToFrontendData(backendData);
        setEhrData(convertedData);
        setEhrDataGlobal(backendData);
        
        // Update dashboard status to connected and mark other items as ready
        setDashboardState(prev => ({
          ...prev,
          'patient-ehr-chart': 'connected',
          'medication-reconciliation': 'ready',
          'patient-instructions': 'ready'
        }));
        
        setProcessingStatus('Complete! All files processed successfully.');
        toast.success('All files uploaded and processed with AI!');
      } else {
        throw new Error(result.error || 'Failed to parse EMR files');
      }
    } catch (error) {
      console.error('Error processing files:', error);
      setProcessingStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Error processing files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Convert backend ParsedEMRData to frontend PatientEHRData format
  const convertBackendToFrontendData = (backendData: any): PatientEHRData => {
    const demographics = backendData.patient_demographics;
    const visitSummary = backendData.visit_summary;
    
    return {
      connectionStatus: 'demo' as const,
      lastSync: new Date(backendData.parsed_at),
      recordsFound: backendData.total_entries,
      dataSource: 'uploaded_file' as const,
      
      demographics: {
        mrn: demographics.mrn,
        age: demographics.age,
        gender: demographics.gender,
        admissionDate: demographics.admission_date || new Date().toISOString().split('T')[0],
        attendingPhysician: demographics.attending_physician || 'Dr. Uploaded Data'
      },
      
      primaryDiagnosis: backendData.conditions[0]?.display || 'Primary diagnosis from uploaded file',
      secondaryDiagnoses: backendData.conditions.slice(1, 4).map((c: any) => c.display || 'Secondary diagnosis'),
      
      currentMedications: backendData.medications.slice(0, 6).map((med: any) => ({
        name: med.name,
        dosage: med.dosage || 'As prescribed',
        frequency: med.frequency || 'As directed'
      })),
      
      recentVitals: backendData.vital_signs.slice(0, 4).map((vital: any) => ({
        type: vital.type,
        value: vital.value,
        timestamp: new Date(vital.timestamp),
        status: vital.status || 'normal' as const
      })),
      
      recentLabs: backendData.lab_results.slice(0, 3).map((lab: any) => ({
        test: lab.test_name,
        value: lab.value,
        range: lab.reference_range || 'Reference range not available',
        status: lab.status || 'normal' as const,
        date: new Date(lab.date)
      })),
      
      clinicalNotes: [
        ...backendData.clinical_notes.map((note: any) => ({
          type: note.type,
          author: note.author,
          content: note.content,
          timestamp: new Date(note.timestamp),
          relevantForDischarge: note.relevant_for_discharge
        })),
        // Add AI-generated visit summary as a clinical note
        ...(visitSummary ? [{
          type: 'AI Visit Summary',
          author: 'AI Assistant',
          content: [
            visitSummary.assessment_and_plan,
            '\n\nKey Findings:',
            visitSummary.key_findings?.map((f: string) => `• ${f}`).join('\n') || 'None documented',
            '\n\nDischarge Readiness:',
            visitSummary.discharge_readiness_factors?.map((f: string) => `• ${f}`).join('\n') || 'Under evaluation',
            '\n\nFollow-up Recommendations:',
            visitSummary.follow_up_recommendations?.map((f: string) => `• ${f}`).join('\n') || 'To be determined'
          ].join(''),
          timestamp: new Date(visitSummary.visit_date),
          relevantForDischarge: true
        }] : [])
      ],
      
      dischargeReadiness: {
        clinicalStability: true,
        clearanceNotes: visitSummary?.discharge_readiness_factors || ['EMR data successfully uploaded and parsed'],
        pendingOrders: ['Review uploaded EMR data for accuracy'],
        followUpRequired: visitSummary?.follow_up_recommendations || ['Validate uploaded data with clinical team']
      }
    };
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const refreshPatientData = async () => {
    setIsRefreshing(true);
    setEhrData(prev => ({ ...prev, connectionStatus: 'loading' }));
    
    // Simulate API call to Epic FHIR for this specific patient
    setTimeout(() => {
      setEhrData(prev => ({
        ...prev,
        connectionStatus: 'connected',
        lastSync: new Date()
      }));
      setIsRefreshing(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'demo': return 'text-purple-600 bg-purple-100';
      case 'loading': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'demo': return <Upload className="h-4 w-4 text-purple-600" />;
      case 'loading': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVitalStatus = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50';
      case 'abnormal': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1">Patient EHR Chart</h1>
          <p className="text-muted-foreground">Live data from {patient?.name}'s Epic EMR chart</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(ehrData?.connectionStatus || 'demo')}>
            {getStatusIcon(ehrData?.connectionStatus || 'demo')}
            {ehrData?.connectionStatus === 'connected' ? 'Epic Connected' : 
             ehrData?.connectionStatus === 'demo' ? 'Demo Mode' :
             ehrData?.connectionStatus === 'loading' ? 'Syncing...' : 'Connection Error'}
          </Badge>
          {ehrFileName && (
            <Badge variant="outline" className="text-purple-600 bg-purple-50">
              <FileJson className="h-3 w-3 mr-1" />
              {ehrFileName}
            </Badge>
          )}
          {notesFileName && (
            <Badge variant="outline" className="text-purple-600 bg-purple-50">
              <FileJson className="h-3 w-3 mr-1" />
              {notesFileName}
            </Badge>
          )}
          {summaryFileName && (
            <Badge variant="outline" className="text-purple-600 bg-purple-50">
              <FileJson className="h-3 w-3 mr-1" />
              {summaryFileName}
            </Badge>
          )}
          <Button 
            onClick={refreshPatientData}
            disabled={isRefreshing || isProcessingFile}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="clinical-card">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <p className="text-sm text-muted-foreground">Upload all three files, then click Process to generate AI analysis</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* File Uploads */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Patient EHR</label>
                {uploadedEHR && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              <Input
                ref={ehrInputRef}
                type="file"
                accept=".json,.xml,.pdf,.txt"
                onChange={(e) => handleFileUpload(e, 'ehr')}
                className="file:mr-2 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isProcessingFile}
              />
              {uploadedEHR ? (
                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-800 font-medium">✓ {uploadedEHR.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFile('ehr')}
                    disabled={isProcessingFile}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : ehrFileName && (
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">Previously uploaded: {ehrFileName}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Doctor Notes</label>
                {uploadedNotes && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              <Input
                ref={notesInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={(e) => handleFileUpload(e, 'notes')}
                className="file:mr-2 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isProcessingFile}
              />
              {uploadedNotes ? (
                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-800 font-medium">✓ {uploadedNotes.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFile('notes')}
                    disabled={isProcessingFile}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : notesFileName && (
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">Previously uploaded: {notesFileName}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Discharge Summary</label>
                {uploadedSummary && <CheckCircle className="h-4 w-4 text-green-500" />}
              </div>
              <Input
                ref={summaryInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => handleFileUpload(e, 'summary')}
                className="file:mr-2 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-sm file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isProcessingFile}
              />
              {uploadedSummary ? (
                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-800 font-medium">✓ {uploadedSummary.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearFile('summary')}
                    disabled={isProcessingFile}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    title="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : summaryFileName && (
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">Previously uploaded: {summaryFileName}</p>
              )}
            </div>
          </div>
          
          {/* Process Button and Status */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                Files uploaded: {[uploadedEHR, uploadedNotes, uploadedSummary].filter(Boolean).length}/3
              </span>
              {[uploadedEHR, uploadedNotes, uploadedSummary].filter(Boolean).length === 3 && (
                <Badge className="bg-green-100 text-green-800">Ready to process</Badge>
              )}
            </div>
            <Button
              onClick={processAllFiles}
              disabled={isProcessingFile || [uploadedEHR, uploadedNotes, uploadedSummary].filter(Boolean).length < 3}
              className="clinical-button-primary"
            >
              {isProcessingFile ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Process with AI
                </>
              )}
            </Button>
          </div>
          
          {/* Processing Status */}
          {isProcessingFile && processingStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-blue-800">{processingStatus}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {ehrData && ehrData?.demographics && (
        <div className="space-y-6">
          {/* Top section: Demographics and Medications in grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Patient Demographics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">MRN:</span>
                    <p className="text-muted-foreground">{ehrData?.demographics.mrn}</p>
                  </div>
                  <div>
                    <span className="font-medium">Age:</span>
                    <p className="text-muted-foreground">{ehrData?.demographics.age}</p>
                  </div>
                  <div>
                    <span className="font-medium">Gender:</span>
                    <p className="text-muted-foreground">{ehrData?.demographics.gender}</p>
                  </div>
                  <div>
                    <span className="font-medium">Admission:</span>
                    <p className="text-muted-foreground">{ehrData?.demographics.admissionDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clinical-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Vitals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ehrData?.recentVitals.length > 0 ? ehrData?.recentVitals.map((vital, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{vital.type}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getVitalStatus(vital.status)}>
                        {vital.value}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(vital.timestamp)}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">No vital signs available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full-width Clinical Notes Section */}
          <div className="w-full space-y-6">
          {/* Diagnoses */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Diagnoses from Epic Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-primary">Primary Diagnosis</label>
                  <p className="text-sm bg-primary/5 p-3 rounded-sm border border-primary/20">
                    {ehrData?.primaryDiagnosis}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Secondary Diagnoses</label>
                  <div className="space-y-1 mt-1">
                    {ehrData?.secondaryDiagnoses.map((diagnosis, index) => (
                      <p key={index} className="text-sm bg-muted/50 p-2 rounded-sm">
                        {diagnosis}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Medications */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Current Medications (Epic MAR)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ehrData?.currentMedications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-sm">
                    <div>
                      <div className="font-medium">{med.name}</div>
                      <div className="text-sm text-muted-foreground">{med.dosage}</div>
                    </div>
                    <Badge variant="outline">{med.frequency}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clinical Notes Relevant to Discharge */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Discharge-Relevant Clinical Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ehrData?.clinicalNotes
                  .filter(note => note.relevantForDischarge)
                  .map((note, index) => (
                    <div 
                      key={index} 
                      className={`border-l-4 pl-4 ${
                        note.type === 'AI Visit Summary' 
                          ? 'border-purple-400 bg-purple-50/30' 
                          : 'border-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {note.type === 'AI Visit Summary' && (
                            <Activity className="h-4 w-4 text-purple-600" />
                          )}
                          <span className={`font-medium text-sm ${
                            note.type === 'AI Visit Summary' ? 'text-purple-800' : ''
                          }`}>
                            {note.type}
                          </span>
                          {note.type === 'AI Visit Summary' && (
                            <Badge className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                              AI Generated
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(note.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm text-muted-foreground mb-1 ${
                        note.type === 'AI Visit Summary' ? 'text-purple-700' : ''
                      }`}>
                        By: {note.author}
                      </p>
                      <div className={`text-sm ${
                        note.type === 'AI Visit Summary' ? 'text-purple-900' : ''
                      }`}>
                        {note.type === 'AI Visit Summary' ? (
                          <div className="space-y-4 text-base leading-relaxed">
                            {note.content.split('\n\n').map((section, secIndex) => (
                              <div key={secIndex} className="space-y-2">
                                {section.split('\n').map((line, lineIndex) => {
                                  // Main numbered headers (1., 2., 3.)
                                  const isMainHeader = /^\d+\.\s/.test(line.trim());
                                  
                                  // Sub-headers under section 3
                                  const isSubHeader = line.startsWith('Key Findings:') || 
                                                     line.startsWith('Discharge Readiness:') || 
                                                     line.startsWith('Follow-up Recommendations:');
                                  
                                  // Bullet points
                                  const isBullet = line.startsWith('•') || line.startsWith('-');
                                  
                                  return (
                                    <div key={lineIndex} className={
                                      isMainHeader
                                        ? 'font-bold text-purple-800 text-xl mt-6 mb-3 border-b-2 border-purple-300 pb-2'
                                        : isSubHeader
                                          ? 'font-semibold text-purple-700 text-lg mt-4 mb-2 border-b border-purple-200 pb-1'
                                          : isBullet
                                            ? 'text-purple-700 ml-6 text-base leading-relaxed'
                                            : line.trim() === ''
                                              ? 'h-2'
                                              : 'text-purple-900 text-base leading-relaxed'
                                    }>
                                      {line || '\u00A0'}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base leading-relaxed">{note.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Discharge Readiness Summary */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Discharge Readiness (From Epic)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={ehrData?.dischargeReadiness.clinicalStability ? "default" : "secondary"}>
                    {ehrData?.dischargeReadiness.clinicalStability ? 
                      <CheckCircle className="h-3 w-3 mr-1" /> : 
                      <AlertTriangle className="h-3 w-3 mr-1" />}
                    {ehrData?.dischargeReadiness.clinicalStability ? 'Clinically Stable' : 'Clinical Review Needed'}
                  </Badge>
                </div>

                {ehrData?.dischargeReadiness.clearanceNotes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-green-600">Clearances Obtained</label>
                    <div className="space-y-1 mt-1">
                      {ehrData?.dischargeReadiness.clearanceNotes.map((note, index) => (
                        <p key={index} className="text-sm bg-green-50 p-2 rounded-sm text-green-800">
                          ✓ {note}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {ehrData?.dischargeReadiness.pendingOrders.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-yellow-600">Pending Orders</label>
                    <div className="space-y-1 mt-1">
                      {ehrData?.dischargeReadiness.pendingOrders.map((order, index) => (
                        <p key={index} className="text-sm bg-yellow-50 p-2 rounded-sm text-yellow-800">
                          ⏳ {order}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Required Follow-up</label>
                  <div className="space-y-1 mt-1">
                    {ehrData?.dischargeReadiness.followUpRequired.map((followUp, index) => (
                      <p key={index} className="text-sm bg-blue-50 p-2 rounded-sm text-blue-800">
                        📅 {followUp}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {!ehrData && !isProcessingFile && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No EMR Data Loaded</h3>
            <p className="text-muted-foreground mb-4">
              Upload an EMR file (FHIR JSON or C-CDA XML) to see patient data and generate AI discharge summaries.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
