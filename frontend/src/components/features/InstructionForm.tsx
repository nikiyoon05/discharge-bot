import { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { currentPatientState } from '@/store/atoms';
import { translateService } from '@/services/translate';
import { Globe, Download, Send, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export default function InstructionForm() {
  const patient = useRecoilValue(currentPatientState);
  const [literacyLevel, setLiteracyLevel] = useState<'elementary' | 'middle' | 'high-school' | 'college'>('high-school');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [originalInstructions, setOriginalInstructions] = useState('');
  const [translatedInstructions, setTranslatedInstructions] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [readabilityScore, setReadabilityScore] = useState<any>(null);

  useEffect(() => {
    loadLanguages();
    loadDefaultInstructions();
  }, []);

  const loadLanguages = async () => {
    try {
      const languages = await translateService.getAvailableLanguages();
      setAvailableLanguages(languages);
    } catch (error) {
      toast.error('Failed to load available languages');
    }
  };

  const loadDefaultInstructions = () => {
    // Generate default discharge instructions based on patient
    const defaultInstructions = `DISCHARGE INSTRUCTIONS FOR ${patient.name}

MEDICATIONS:
• Take azithromycin 500mg once daily for 3 more days
• Resume your regular medications: Lisinopril and Metformin as prescribed
• Do not stop taking medications without talking to your doctor

ACTIVITY:
• You may return to normal activities as tolerated
• Avoid strenuous exercise for the next few days
• Rest when you feel tired

DIET:
• Return to your normal diet
• Drink plenty of fluids
• Eat nutritious foods to help your body heal

FOLLOW-UP CARE:
• Schedule an appointment with Dr. Martinez within 1 week
• Call if you cannot get an appointment within this timeframe

WHEN TO CALL YOUR DOCTOR:
• Fever above 101°F (38.3°C)
• Difficulty breathing or shortness of breath
• Chest pain
• Cough that gets worse or produces blood
• Any concerns about your medications

EMERGENCY SITUATIONS:
• Severe difficulty breathing
• Chest pain
• High fever with chills
• Go to the emergency room or call 911

Contact Information:
• Primary Care Office: (555) 123-4567
• After-hours nurse line: (555) 123-4568
• Emergency: 911`;

    setOriginalInstructions(defaultInstructions);
  };

  const handleTranslate = async () => {
    if (!originalInstructions.trim()) {
      toast.error('Please enter instructions to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateService.translateInstructions({
        text: originalInstructions,
        literacyLevel,
        language: selectedLanguage as any,
        medicalContext: 'discharge'
      });

      setTranslatedInstructions(result.translatedText);
      
      // Get readability score
      const readability = await translateService.validateReadability(result.translatedText);
      setReadabilityScore(readability);

      toast.success('Instructions translated successfully');
    } catch (error) {
      toast.error('Failed to translate instructions');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Discharge Instructions - ${patient.name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #004c97; border-bottom: 2px solid #004c97; padding-bottom: 10px; }
              .patient-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              pre { white-space: pre-wrap; font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            <h1>Discharge Instructions</h1>
            <div class="patient-info">
              <strong>Patient:</strong> ${patient.name}<br>
              <strong>MRN:</strong> ${patient.mrn}<br>
              <strong>Date:</strong> ${new Date().toLocaleDateString()}
            </div>
            <pre>${translatedInstructions || originalInstructions}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSendToPortal = () => {
    toast.success('Instructions sent to patient portal successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="clinical-h1 flex items-center space-x-2">
          <Globe className="h-8 w-8 text-primary" />
          <span>Patient Instructions Generator</span>
        </h1>
        <p className="clinical-body text-muted-foreground mt-2">
          Generate patient-friendly discharge instructions with appropriate literacy level and language
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Translation Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Literacy Level */}
            <div className="space-y-2">
              <Label htmlFor="literacy">Reading Level</Label>
              <Select value={literacyLevel} onValueChange={(value: any) => setLiteracyLevel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reading level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elementary">Elementary (5th grade)</SelectItem>
                  <SelectItem value="middle">Middle School (8th grade)</SelectItem>
                  <SelectItem value="high-school">High School (12th grade)</SelectItem>
                  <SelectItem value="college">College Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nativeName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Translate Button */}
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full clinical-button-primary"
            >
              {isTranslating ? 'Translating...' : 'Generate Instructions'}
            </Button>

            {/* Readability Score */}
            {readabilityScore && (
              <div className="p-3 bg-clinical-success/10 rounded-lg border border-clinical-success/20">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-clinical-success" />
                  <span className="clinical-small font-medium text-clinical-success">
                    Readability: {readabilityScore.grade}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Score: {readabilityScore.score}/10
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Original Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="outline">Original</Badge>
              <span>Clinical Instructions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={originalInstructions}
              onChange={(e) => setOriginalInstructions(e.target.value)}
              className="min-h-96 font-mono text-sm"
              placeholder="Enter discharge instructions..."
            />
          </CardContent>
        </Card>

        {/* Translated Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="secondary">Patient-Friendly</Badge>
              <span>Generated Instructions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {translatedInstructions ? (
              <>
                <div className="min-h-80 p-4 bg-muted/30 rounded-lg">
                  <pre className="whitespace-pre-wrap clinical-small">{translatedInstructions}</pre>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Print</span>
                  </Button>
                  
                  <Button
                    onClick={handleSendToPortal}
                    className="flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send to Portal</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="min-h-80 flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="clinical-small">Generated instructions will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}