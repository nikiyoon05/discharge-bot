import { useState, useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { medicationsSelector, currentPatientState, dashboardState } from '@/store/atoms';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pill, AlertTriangle, Check, X, FileDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  indication?: string;
  status: 'active' | 'discontinued' | 'hold' | 'modified';
  category: 'home' | 'hospital' | 'discharge';
  conflicts?: string[];
  isReconciled?: boolean;
}

const mockMedications: Medication[] = [
  // Home medications
  {
    id: 'home-1',
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Daily',
    route: 'PO',
    indication: 'Hypertension',
    status: 'active',
    category: 'home',
    isReconciled: false
  },
  {
    id: 'home-2',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily',
    route: 'PO',
    indication: 'Diabetes mellitus',
    status: 'active',
    category: 'home',
    isReconciled: false
  },
  // Hospital medications
  {
    id: 'hospital-1',
    name: 'Azithromycin',
    dosage: '500mg',
    frequency: 'Daily',
    route: 'PO',
    indication: 'Pneumonia',
    status: 'active',
    category: 'hospital',
    isReconciled: false
  },
  {
    id: 'hospital-2',
    name: 'Albuterol',
    dosage: '2.5mg',
    frequency: 'Q6H PRN',
    route: 'Nebulizer',
    indication: 'Bronchospasm',
    status: 'discontinued',
    category: 'hospital',
    isReconciled: false
  },
  // Planned discharge medications
  {
    id: 'discharge-1',
    name: 'Azithromycin',
    dosage: '500mg',
    frequency: 'Daily x 3 days',
    route: 'PO',
    indication: 'Complete antibiotic course',
    status: 'active',
    category: 'discharge',
    isReconciled: false,
    conflicts: ['Continue from hospital - verify patient understands course completion']
  }
];

function SortableMedication({ medication, onToggleReconciled }: { 
  medication: Medication; 
  onToggleReconciled: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: medication.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="status-success">Active</Badge>;
      case 'discontinued':
        return <Badge variant="secondary">Discontinued</Badge>;
      case 'hold':
        return <Badge className="status-warning">Hold</Badge>;
      case 'modified':
        return <Badge className="status-info">Modified</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`clinical-card p-4 ${medication.isReconciled ? 'bg-clinical-success/5 border-clinical-success/30' : ''} 
        ${medication.conflicts?.length ? 'border-clinical-warning/50 bg-clinical-warning/5' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          
          <Checkbox
            checked={medication.isReconciled}
            onCheckedChange={() => onToggleReconciled(medication.id)}
            className="mt-1"
          />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <h4 className="clinical-small font-semibold">{medication.name}</h4>
              {getStatusBadge(medication.status)}
              {medication.conflicts?.length && (
                <AlertTriangle className="h-4 w-4 text-clinical-warning" />
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
              <span><strong>Dose:</strong> {medication.dosage}</span>
              <span><strong>Frequency:</strong> {medication.frequency}</span>
              <span><strong>Route:</strong> {medication.route}</span>
              {medication.indication && (
                <span><strong>For:</strong> {medication.indication}</span>
              )}
            </div>
            
            {medication.conflicts?.map((conflict, index) => (
              <div key={index} className="p-2 bg-clinical-warning/10 border border-clinical-warning/20 rounded text-sm">
                <AlertTriangle className="h-3 w-3 inline mr-1 text-clinical-warning" />
                {conflict}
              </div>
            ))}
          </div>
        </div>
        
        {medication.isReconciled && (
          <Check className="h-5 w-5 text-clinical-success mt-1" />
        )}
      </div>
    </div>
  );
}

export default function MedReconcile() {
  const medications = useRecoilValue(medicationsSelector);
  const patient = useRecoilValue(currentPatientState);
  const setDashboardState = useSetRecoilState(dashboardState);
  const [homeMeds, setHomeMeds] = useState<Medication[]>([]);
  const [hospitalMeds, setHospitalMeds] = useState<Medication[]>([]);
  const [dischargeMeds, setDischargeMeds] = useState<Medication[]>([]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const meds = medications.length > 0 ? medications : mockMedications;
    setHomeMeds(meds.filter(med => med.category === 'home'));
    setHospitalMeds(meds.filter(med => med.category === 'hospital'));
    setDischargeMeds(meds.filter(med => med.category === 'discharge'));
  }, [medications]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Handle drag and drop between categories
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId !== overId) {
      // Find which category the item is being moved to
      // This is a simplified version - in production, you'd want more sophisticated handling
      toast('Medication moved - reconciliation status updated');
    }
  };

  const handleToggleReconciled = (medId: string) => {
    const updateMedication = (meds: Medication[]) =>
      meds.map(med => 
        med.id === medId 
          ? { ...med, isReconciled: !med.isReconciled }
          : med
      );

    setHomeMeds(updateMedication);
    setHospitalMeds(updateMedication);
    setDischargeMeds(updateMedication);
  };

  const allMedications = [...homeMeds, ...hospitalMeds, ...dischargeMeds];
  const reconciledCount = allMedications.filter(med => med.isReconciled).length;
  const totalCount = allMedications.length;
  const conflictCount = allMedications.filter(med => med.conflicts?.length).length;

  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const generateReconciledList = async () => {
    const reconciledMeds = allMedications.filter(med => med.isReconciled && med.status === 'active');
    
    if (reconciledMeds.length === 0) {
      toast.error('No medications have been reconciled yet');
      return;
    }

    try {
      console.log('Sending medication analysis request:', { medications: reconciledMeds, patient_id: patient.id });
      
      const response = await fetch('http://localhost:8000/api/medrec/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medications: reconciledMeds,
          patient_id: patient.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received analysis result:', data);
      setAnalysisResult(data.analysis);
      
      // Update dashboard status to show analysis is complete
      setDashboardState(prev => ({
        ...prev,
        'medication-reconciliation': 'generated'
      }));
      
      toast.success('Medication list analyzed successfully with AI');
    } catch (error) {
      console.error('Medication analysis error:', error);
      toast.error('Failed to analyze medication list: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="clinical-h1 flex items-center space-x-2">
              <Pill className="h-8 w-8 text-primary" />
              <span>Medication Reconciliation</span>
            </h1>
            <p className="clinical-body text-muted-foreground mt-2">
              Review and reconcile patient medications across care transitions
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="clinical-small font-medium">
                Progress: {reconciledCount}/{totalCount} reconciled
              </p>
              {conflictCount > 0 && (
                <p className="text-sm text-clinical-warning">
                  {conflictCount} conflicts need attention
                </p>
              )}
            </div>
            
            <Button
              onClick={generateReconciledList}
              disabled={reconciledCount === 0}
              className="clinical-button-primary flex items-center space-x-2"
            >
              <FileDown className="h-4 w-4" />
              <span>Generate List</span>
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="status-info">
              {reconciledCount}/{totalCount} Reconciled
            </Badge>
            {conflictCount > 0 && (
              <Badge variant="outline" className="status-warning">
                {conflictCount} Conflicts
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {reconciledCount === totalCount ? 'All medications reconciled' : 'Reconciliation in progress'}
          </div>
        </div>

        {/* Medication Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Home Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Home Medications</span>
                <Badge variant="outline">{homeMeds.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SortableContext items={homeMeds.map(med => med.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {homeMeds.map((med) => (
                    <SortableMedication
                      key={med.id}
                      medication={med}
                      onToggleReconciled={handleToggleReconciled}
                    />
                  ))}
                  {homeMeds.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No home medications recorded
                    </p>
                  )}
                </div>
              </SortableContext>
            </CardContent>
          </Card>

          {/* Hospital Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>In-Hospital Medications</span>
                <Badge variant="outline">{hospitalMeds.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SortableContext items={hospitalMeds.map(med => med.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {hospitalMeds.map((med) => (
                    <SortableMedication
                      key={med.id}
                      medication={med}
                      onToggleReconciled={handleToggleReconciled}
                    />
                  ))}
                  {hospitalMeds.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hospital medications recorded
                    </p>
                  )}
                </div>
              </SortableContext>
            </CardContent>
          </Card>

          {/* Discharge Medications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Planned Discharge</span>
                <Badge variant="outline">{dischargeMeds.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SortableContext items={dischargeMeds.map(med => med.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {dischargeMeds.map((med) => (
                    <SortableMedication
                      key={med.id}
                      medication={med}
                      onToggleReconciled={handleToggleReconciled}
                    />
                  ))}
                  {dischargeMeds.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No discharge medications planned
                    </p>
                  )}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        </div>

        {/* Reconciliation Summary */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-clinical-info">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <h4 className="font-semibold">Interactions:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.interactions.map((interaction, index) => (
                      <li key={index}>{interaction}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Duplicates:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.duplicates.map((duplicate, index) => (
                      <li key={index}>{duplicate}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Clinical Concerns:</h4>
                  <ul className="list-disc pl-5">
                    {analysisResult.clinical_concerns.map((concern, index) => (
                      <li key={index}>{concern}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Summary:</h4>
                  <p>{analysisResult.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DndContext>
  );
}
