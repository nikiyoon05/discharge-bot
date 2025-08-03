import { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { currentPatientState } from '@/store/atoms';
import { fhirService } from '@/services/fhir';
import { FileText, Edit3, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';

export default function SummaryEditor() {
  const patient = useRecoilValue(currentPatientState);
  const [originalNotes, setOriginalNotes] = useState<string[]>([]);
  const [aiDraft, setAiDraft] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDiff, setShowDiff] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadEncounterData();
  }, [patient.id]);

  const loadEncounterData = async () => {
    try {
      setIsLoading(true);
      const notes = await fhirService.getEncounterNotes(patient.id);
      setOriginalNotes(notes);
      
      // Simulate AI draft generation
      const draft = generateAIDraft(notes);
      setAiDraft(draft);
      setEditedSummary(draft);
    } catch (error) {
      toast.error('Failed to load encounter notes');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIDraft = (notes: string[]): string => {
    // Mock AI-generated summary
    return `DISCHARGE SUMMARY

PATIENT: ${patient.name}
MRN: ${patient.mrn}
DOB: ${patient.dob}
ADMISSION DATE: ${patient.admissionDate}
DISCHARGE DATE: ${new Date().toLocaleDateString()}

PRINCIPAL DIAGNOSIS: ${patient.primaryDiagnosis}

HISTORY OF PRESENT ILLNESS:
Patient was admitted with acute pneumonia presenting with cough, shortness of breath, and fever. Chest imaging confirmed consolidation in the right lower lobe.

HOSPITAL COURSE:
The patient was treated with appropriate antibiotic therapy (azithromycin 500mg daily). Vital signs remained stable throughout the admission. Repeat imaging showed significant improvement in consolidation. Patient responded well to treatment with resolution of symptoms.

DISCHARGE CONDITION:
Patient is stable and ready for discharge. Ambulatory without assistance, vital signs normal, and symptoms resolved.

DISCHARGE MEDICATIONS:
- Continue azithromycin 500mg daily for 3 more days
- Resume home medications as previously prescribed

FOLLOW-UP:
Primary care appointment scheduled within 1 week of discharge.

DISCHARGE INSTRUCTIONS:
Patient advised to complete antibiotic course, maintain activity as tolerated, and seek immediate medical attention for worsening symptoms.`;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await fhirService.submitDischargeSummary(patient.id, editedSummary);
      
      if (result.success) {
        toast.success('Discharge summary saved successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to save discharge summary');
      }
    } catch (error) {
      toast.error('Error saving discharge summary');
    } finally {
      setIsSaving(false);
    }
  };

  const getDiffHighlight = (original: string, edited: string) => {
    // Simple diff highlighting - in production, use a proper diff library
    if (original === edited) return 'bg-background';
    return 'bg-clinical-warning/20';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1 flex items-center space-x-2">
            <FileText className="h-8 w-8 text-primary" />
            <span>Discharge Summary</span>
          </h1>
          <p className="clinical-body text-muted-foreground mt-2">
            AI-generated summary ready for review and editing
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center space-x-2"
          >
            {showDiff ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showDiff ? 'Hide' : 'Show'} Diff</span>
          </Button>
          
          {isEditing ? (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="clinical-button-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Sign & File'}</span>
            </Button>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="clinical-button-primary flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Summary</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Notes */}
        {showDiff && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Badge variant="outline">Original</Badge>
                <span>Encounter Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {originalNotes.map((note, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="clinical-small">{note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Draft / Editor */}
        <Card className={showDiff ? '' : 'lg:col-span-2'}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant={isEditing ? "destructive" : "secondary"}>
                {isEditing ? 'Editing' : 'AI Draft'}
              </Badge>
              <span>Discharge Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className={`min-h-96 font-mono text-sm ${getDiffHighlight(aiDraft, editedSummary)}`}
                placeholder="Edit the discharge summary..."
              />
            ) : (
              <div className="min-h-96 p-4 bg-muted/30 rounded-lg">
                <pre className="whitespace-pre-wrap clinical-small font-mono">{aiDraft}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Change Summary */}
      {isEditing && editedSummary !== aiDraft && (
        <Card>
          <CardHeader>
            <CardTitle className="text-clinical-warning">Pending Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="clinical-small text-muted-foreground">
              You have unsaved changes to the discharge summary. Click "Sign & File" to submit to the EHR.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}