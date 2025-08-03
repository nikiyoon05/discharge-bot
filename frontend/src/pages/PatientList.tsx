import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Users, Clock, AlertCircle } from 'lucide-react';
import BackButton from '@/components/common/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Patient {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  room: string;
  unit: string;
  admissionDate: string;
  los: number;
  primaryDiagnosis: string;
  status: 'stable' | 'critical' | 'discharge-pending' | 'observation';
  dischargeProgress: number;
  nextTask: string;
}

const mockPatients: Patient[] = [
  {
    id: 'patient-001',
    name: 'John Anderson',
    mrn: '12345678',
    age: 58,
    gender: 'M',
    room: '401B',
    unit: 'Med-Surg 4A',
    admissionDate: '2024-08-01',
    los: 3,
    primaryDiagnosis: 'Pneumonia',
    status: 'discharge-pending',
    dischargeProgress: 75,
    nextTask: 'Complete discharge summary'
  },
  {
    id: 'patient-002',
    name: 'Maria Rodriguez',
    mrn: '87654321',
    age: 45,
    gender: 'F',
    room: '302A',
    unit: 'ICU 3',
    admissionDate: '2024-07-30',
    los: 5,
    primaryDiagnosis: 'Acute MI',
    status: 'stable',
    dischargeProgress: 40,
    nextTask: 'Medication reconciliation'
  },
  {
    id: 'patient-003',
    name: 'Robert Chen',
    mrn: '11223344',
    age: 72,
    gender: 'M',
    room: '205C',
    unit: 'Cardiology 2',
    admissionDate: '2024-07-28',
    los: 7,
    primaryDiagnosis: 'CHF Exacerbation',
    status: 'observation',
    dischargeProgress: 60,
    nextTask: 'Schedule follow-up'
  },
  {
    id: 'patient-004',
    name: 'Sarah Johnson',
    mrn: '55667788',
    age: 34,
    gender: 'F',
    room: '101A',
    unit: 'Emergency',
    admissionDate: '2024-08-03',
    los: 1,
    primaryDiagnosis: 'Appendicitis',
    status: 'critical',
    dischargeProgress: 0,
    nextTask: 'Post-op monitoring'
  }
];

export default function PatientList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.mrn.includes(searchTerm) ||
                         patient.primaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = unitFilter === 'all' || patient.unit === unitFilter;
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesUnit && matchesStatus;
  });

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'critical': return 'status-danger';
      case 'discharge-pending': return 'status-warning';
      case 'stable': return 'status-success';
      case 'observation': return 'status-info';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: Patient['status']) => {
    switch (status) {
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      case 'discharge-pending': return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b-2 border-border bg-card">
        <div className="container max-w-screen-2xl mx-auto px-6 py-6">
          <BackButton to="/" label="Back to Home" className="mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="clinical-h1">Patient Census</h1>
              <p className="clinical-body text-muted-foreground mt-2">
                Select a patient to manage their discharge workflow
              </p>
            </div>
            <Button className="clinical-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-screen-2xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, MRN, or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2"
            />
          </div>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="w-full sm:w-[200px] border-2">
              <SelectValue placeholder="Filter by unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              <SelectItem value="ICU 3">ICU 3</SelectItem>
              <SelectItem value="Med-Surg 4A">Med-Surg 4A</SelectItem>
              <SelectItem value="Cardiology 2">Cardiology 2</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] border-2">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="discharge-pending">Discharge Pending</SelectItem>
              <SelectItem value="observation">Observation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="clinical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="clinical-small">Total Patients</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{mockPatients.length}</div>
            </CardContent>
          </Card>
          <Card className="clinical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="clinical-small">Critical</CardTitle>
              <AlertCircle className="h-5 w-5 text-clinical-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-clinical-danger">
                {mockPatients.filter(p => p.status === 'critical').length}
              </div>
            </CardContent>
          </Card>
          <Card className="clinical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="clinical-small">Discharge Pending</CardTitle>
              <Clock className="h-5 w-5 text-clinical-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-clinical-warning">
                {mockPatients.filter(p => p.status === 'discharge-pending').length}
              </div>
            </CardContent>
          </Card>
          <Card className="clinical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="clinical-small">Avg LOS</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(mockPatients.reduce((acc, p) => acc + p.los, 0) / mockPatients.length)} days
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className="clinical-card-hover cursor-pointer"
              onClick={() => navigate(`/patient/${patient.id}/dashboard`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="clinical-h2 text-lg">{patient.name}</CardTitle>
                    <p className="clinical-small text-muted-foreground">
                      MRN: {patient.mrn} • {patient.age}y {patient.gender}
                    </p>
                  </div>
                  <Badge className={getStatusColor(patient.status)}>
                    {getStatusIcon(patient.status)}
                    <span className="ml-1 capitalize">{patient.status.replace('-', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="clinical-small font-semibold">Room</p>
                    <p className="text-sm text-muted-foreground">{patient.room}</p>
                  </div>
                  <div>
                    <p className="clinical-small font-semibold">Unit</p>
                    <p className="text-sm text-muted-foreground">{patient.unit}</p>
                  </div>
                  <div>
                    <p className="clinical-small font-semibold">LOS</p>
                    <p className="text-sm text-muted-foreground">{patient.los} days</p>
                  </div>
                  <div>
                    <p className="clinical-small font-semibold">Progress</p>
                    <p className="text-sm text-muted-foreground">{patient.dischargeProgress}%</p>
                  </div>
                </div>
                
                <div>
                  <p className="clinical-small font-semibold">Primary Diagnosis</p>
                  <p className="text-sm text-muted-foreground">{patient.primaryDiagnosis}</p>
                </div>
                
                <div>
                  <p className="clinical-small font-semibold">Next Task</p>
                  <p className="text-sm text-clinical-warning font-medium">{patient.nextTask}</p>
                </div>

                <div className="pt-2">
                  <Button className="w-full clinical-button-primary">
                    Open Patient Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="clinical-h2 text-muted-foreground">No patients found</h3>
            <p className="clinical-body text-muted-foreground">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}