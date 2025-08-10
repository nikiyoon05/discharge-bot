import { useRecoilState } from 'recoil';
import { currentPatientState } from '@/store/atoms';
import { Calendar, Clock, AlertTriangle, User, Languages, Pencil, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatientLanguage } from '@/hooks/usePatientLanguage';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import React from 'react';

export default function PatientHeader() {
  const [patient, setPatient] = useRecoilState(currentPatientState);
  const { currentLanguage, languageOptions, setLanguage } = usePatientLanguage();

  if (!patient) return null;

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getStatusColor = (los: number) => {
    if (los <= 2) return 'status-success';
    if (los <= 5) return 'status-warning';
    return 'status-danger';
  };

  const [editingAdmission, setEditingAdmission] = React.useState(false);
  const [tempAdmission, setTempAdmission] = React.useState<string>(patient.admissionDate);

  const computeLosFromAdmission = (admissionISO: string): number => {
    try {
      const start = new Date(admissionISO);
      const today = new Date();
      // normalize to midnight to avoid timezone drift
      const startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffMs = todayMid.getTime() - startMid.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      // Inclusive count (at least 1 day if admitted today)
      return Math.max(1, days + 1);
    } catch {
      return patient.los ?? 1;
    }
  };

  const saveAdmissionDate = async () => {
    if (!tempAdmission) return setEditingAdmission(false);
    
    try {
      // Update backend first
      const response = await fetch(`http://localhost:8000/api/emr/patient/${patient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admission_date: tempAdmission
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update admission date');
      }

      // Update local state only after successful backend update
      const newLos = computeLosFromAdmission(tempAdmission);
      setPatient(prev => ({ ...prev, admissionDate: tempAdmission, los: newLos }));
      setEditingAdmission(false);
      toast.success('Admission date updated successfully');
      
    } catch (error) {
      console.error('Error updating admission date:', error);
      toast.error('Failed to update admission date');
      // Reset to original value on error
      setTempAdmission(patient.admissionDate);
      setEditingAdmission(false);
    }
  };


  return (
    <div className="sticky top-16 z-40 border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-screen-2xl px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Patient Identity */}
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="clinical-h2">{patient.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>MRN: {patient.mrn}</span>
                <span>Age: {calculateAge(patient.dob)}</span>
                <span>Room: {patient.room}</span>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Length of Stay */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(patient.los)}`}>
              <Clock className="h-4 w-4" />
              <span className="clinical-small font-semibold">LOS: {patient.los} days</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border-2 border-primary/20 bg-primary/5">
              <Languages className="h-4 w-4 text-primary" />
              <Select value={patient.language} onValueChange={setLanguage}>
                <SelectTrigger className="h-8 w-auto border-0 bg-transparent px-2 py-0 focus:ring-0 focus:ring-offset-0">
                  <SelectValue>
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">{currentLanguage.flag}</span>
                      <span className="clinical-small font-semibold">{currentLanguage.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{language.flag}</span>
                        <span>{language.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <Badge variant="outline" className="clinical-small border-2 px-3 py-1">
              {patient.unit}
            </Badge>

            {/* Primary Diagnosis */}
            <Badge variant="secondary" className="clinical-small border-2 px-3 py-1">
              {patient.primaryDiagnosis}
            </Badge>

            {/* Allergies Alert */}
            {patient.allergies?.length > 0 && (
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg border-2 status-danger">
                <AlertTriangle className="h-4 w-4" />
                <span className="clinical-small font-semibold">
                  Allergies: {patient.allergies.join(', ')}
                </span>
              </div>
            )}

            {/* Admission Date (editable) */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground px-3 py-2 border-2 border-border rounded-lg">
              <Calendar className="h-4 w-4" />
              {!editingAdmission ? (
                <div className="flex items-center gap-2">
                  <span>Admitted: {new Date(patient.admissionDate).toLocaleDateString()}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setTempAdmission(patient.admissionDate); setEditingAdmission(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-foreground bg-background"
                    value={(() => { const d = new Date(tempAdmission); const yyyy = d.getFullYear(); const mm = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}`; })()}
                    onChange={(e) => setTempAdmission(e.target.value)}
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveAdmissionDate}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingAdmission(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}