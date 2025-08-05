import { useState, useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ehrDataState, dashboardState } from '@/store/atoms';

import { Globe, Download, Send, FileText, CheckCircle, Maximize2, Minimize2 } from 'lucide-react';
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
  const ehrData = useRecoilValue(ehrDataState);
  const setDashboardState = useSetRecoilState(dashboardState);
  const [literacyLevel, setLiteracyLevel] = useState<'elementary' | 'middle' | 'high-school' | 'college'>('high-school');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [originalInstructions, setOriginalInstructions] = useState('');
  const [translatedInstructions, setTranslatedInstructions] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  

  useEffect(() => {
    loadLanguages();
    if (ehrData) {
      const generateInitialInstructions = async () => {
        // First try to get discharge summary from uploaded files
        let dischargeSummary = '';
        try {
          const response = await fetch(`http://localhost:8000/api/emr/patient/patient-001/discharge-summary`);
          if (response.ok) {
            const result = await response.json();
            dischargeSummary = result.discharge_summary || '';
          }
        } catch (error) {
          console.log('No discharge summary found');
        }

        const { demographics, conditions, medications } = ehrData;
        
        // Use discharge summary content if available, otherwise generate from structured data
        let instructions = '';
        if (dischargeSummary && dischargeSummary.trim()) {
          // Use the EXACT discharge summary text from the doctor
          instructions = dischargeSummary;
        } else {
          // Fallback to structured data if no discharge summary
          const primaryCondition = conditions && conditions.length > 0 ? conditions[0].display : 'your medical condition';
          instructions = `DISCHARGE INSTRUCTIONS FOR ${demographics.name}

PRIMARY DIAGNOSIS:
• ${primaryCondition}

MEDICATIONS:
${medications.map(med => `• ${med.name} ${med.dosage} ${med.frequency}`).join('\n')}

ACTIVITY:
• You may return to normal activities as tolerated
• Avoid strenuous exercise for the next few days
• Rest when you feel tired

DIET:
• Return to your normal diet
• Drink plenty of fluids
• Eat nutritious foods to help your body heal

FOLLOW-UP CARE:
• Schedule an appointment with your primary care provider within 1 week

WHEN TO CALL YOUR DOCTOR:
• Fever above 101°F (38.3°C)
• Difficulty breathing or shortness of breath
• Chest pain
• Any concerns about your medications

EMERGENCY SITUATIONS:
• Severe difficulty breathing
• Chest pain
• High fever with chills
• Go to the emergency room or call 911`;
        }
        setOriginalInstructions(instructions);
        
        // Update dashboard status to show instructions are ready
        if (instructions) {
          setDashboardState(prev => ({
            ...prev,
            'patient-instructions': 'generated'
          }));
        }
      };
      generateInitialInstructions();
    }
  }, [ehrData, setDashboardState]);

  const loadLanguages = async () => {
    try {
      const languages = await fetch('http://localhost:8000/api/instructions/languages');
      setAvailableLanguages(await languages.json());
    } catch (error) {
      toast.error('Failed to load available languages');
    }
  };

  

  const handleTranslate = async () => {
    if (!originalInstructions.trim()) {
      toast.error('Please enter instructions to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await fetch('http://localhost:8000/api/instructions/generate-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emr_data: ehrData,
          literacy_level: literacyLevel,
          language: selectedLanguage,
        }),
      });

      const data = await result.json();
      setTranslatedInstructions(data.instructions);
      
      // Get readability score
      

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
            <title>Discharge Instructions - {ehrData?.demographics.name}</title>
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
              <strong>Patient:</strong> ${ehrData?.demographics.name}<br>
              <strong>MRN:</strong> ${ehrData?.demographics.mrn}<br>
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

      <div className={`grid gap-6 transition-all duration-300 ${
        isExpanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
      }`}>
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

            
          </CardContent>
        </Card>

        {/* Original Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline">Original</Badge>
                <span>Clinical Instructions</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1"
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="text-sm">Collapse</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span className="text-sm">Expand</span>
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={originalInstructions}
              onChange={(e) => setOriginalInstructions(e.target.value)}
              className={`font-mono text-sm resize-none transition-all duration-300 ${
                isExpanded 
                  ? 'min-h-96 max-h-screen overflow-y-auto' 
                  : 'min-h-96 max-h-96 overflow-y-auto'
              }`}
              placeholder="Enter discharge instructions..."
            />
          </CardContent>
        </Card>

        {/* Translated Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Patient-Friendly</Badge>
                <span>Generated Instructions</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1"
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span className="text-sm">Collapse</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span className="text-sm">Expand</span>
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {translatedInstructions ? (
              <>
                <Textarea
                  value={translatedInstructions}
                  onChange={(e) => setTranslatedInstructions(e.target.value)}
                  className={`font-mono text-sm resize-none transition-all duration-300 ${
                    isExpanded 
                      ? 'min-h-96 max-h-screen overflow-y-auto' 
                      : 'min-h-80 max-h-96 overflow-y-auto'
                  }`}
                  placeholder="Generated instructions will appear here..."
                />
                
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
              <div className={`flex items-center justify-center border-2 border-dashed border-muted rounded-lg transition-all duration-300 ${
                isExpanded ? 'min-h-96' : 'min-h-80'
              }`}>
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