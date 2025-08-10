/**
 * Example: How to integrate the patient language state in other components
 * 
 * This example shows how components can use the usePatientLanguage hook
 * to automatically default to the patient's preferred language and 
 * sync changes back to the patient record.
 */

import React, { useEffect, useState } from 'react';
import { usePatientLanguage } from '@/hooks/usePatientLanguage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

export default function LanguageIntegrationExample() {
  const { currentLanguage, languageOptions, setLanguage, languageCode } = usePatientLanguage();
  const [localLanguage, setLocalLanguage] = useState(languageCode);

  // Example 1: Use patient's language as default
  useEffect(() => {
    console.log(`Patient's preferred language: ${currentLanguage.name} (${currentLanguage.code})`);
    setLocalLanguage(languageCode);
  }, [languageCode, currentLanguage]);

  // Example 2: Sync local changes back to patient record
  const handleLanguageChange = (newLanguageCode: string) => {
    setLocalLanguage(newLanguageCode);
    setLanguage(newLanguageCode); // This updates the patient record
  };

  // Example 3: Access current language for conditional rendering
  const getLocalizedContent = () => {
    switch (currentLanguage.code) {
      case 'es':
        return 'Instrucciones de alta del paciente';
      case 'fr':
        return 'Instructions de sortie du patient';
      case 'de':
        return 'Entlassungsanweisungen für Patienten';
      default:
        return 'Patient Discharge Instructions';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Language Integration Example
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Current Patient Language:</label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{currentLanguage.flag}</span>
            <span>{currentLanguage.name}</span>
            <span className="text-muted-foreground">({currentLanguage.code})</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Change Language:</label>
          <Select value={localLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <div className="flex items-center space-x-2">
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Localized Content:</label>
          <div className="mt-1 p-3 bg-muted rounded-md">
            {getLocalizedContent()}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          💡 <strong>Integration Tips:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Use <code>usePatientLanguage()</code> hook to access current language</li>
            <li>Language changes automatically sync to patient record</li>
            <li>Use <code>currentLanguage.code</code> for conditional logic</li>
            <li>Use <code>currentLanguage.flag</code> and <code>currentLanguage.name</code> for UI display</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example integration in InstructionForm.tsx:
 * 
 * import { usePatientLanguage } from '@/hooks/usePatientLanguage';
 * 
 * export default function InstructionForm() {
 *   const { languageCode, setLanguage } = usePatientLanguage();
 *   const [selectedLanguage, setSelectedLanguage] = useState(languageCode); // Use patient's language as default
 *   
 *   // Sync local changes back to patient record
 *   const handleLanguageChange = (newLanguage: string) => {
 *     setSelectedLanguage(newLanguage);
 *     setLanguage(newLanguage); // Update patient record
 *   };
 *   
 *   // Rest of component...
 * }
 */