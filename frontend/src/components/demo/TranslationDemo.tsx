import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages, ArrowRight, Loader2 } from 'lucide-react';
import { translationService, LANGUAGE_MAPPING } from '@/services/translationService';
import { usePatientLanguage } from '@/hooks/usePatientLanguage';

export default function TranslationDemo() {
  const { languageOptions, currentLanguage } = usePatientLanguage();
  const [testText, setTestText] = useState('How are you feeling today?');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');

  const handleTranslate = async () => {
    if (!testText.trim()) return;

    setIsTranslating(true);
    try {
      const result = await translationService.translateText(testText, sourceLanguage, targetLanguage);
      setTranslatedText(result.translatedText);
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslatedText('Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const sampleTexts = {
    en: [
      'How are you feeling today?',
      'Please take your medication as prescribed.',
      'Your follow-up appointment is scheduled for next week.',
      'Do you have any questions about your discharge instructions?'
    ],
    es: [
      'Me siento mejor, gracias.',
      '¿Puedo hacer ejercicio?',
      'Tengo una pregunta sobre mis medicamentos.',
      'Necesito ayuda con mi cita.'
    ],
    fr: [
      'Je me sens mieux aujourd\'hui.',
      'Quand puis-je reprendre le travail?',
      'J\'ai des douleurs dans la poitrine.',
      'Merci pour votre aide.'
    ]
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" />
          Translation Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the LibreTranslate integration. Current patient language: <strong>{currentLanguage.flag} {currentLanguage.name}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">From Language</label>
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">To Language</label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sample Text Buttons */}
        <div>
          <label className="text-sm font-medium">Sample Texts</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {sampleTexts[sourceLanguage as keyof typeof sampleTexts]?.map((text, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-left justify-start h-auto p-2"
                onClick={() => setTestText(text)}
              >
                {text}
              </Button>
            ))}
          </div>
        </div>

        {/* Translation Input/Output */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium">Original Text</label>
            <Input
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to translate..."
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !testText.trim()}
              className="w-full lg:w-auto"
            >
              {isTranslating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="lg:col-span-2">
            <label className="text-sm font-medium">Translated Text</label>
            <Input
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              className="mt-1 bg-muted"
            />
          </div>
        </div>

        {/* Service Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              translationService.isServiceAvailable() ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">
              Translation Service: {translationService.isServiceAvailable() ? 'Available' : 'Unavailable'}
            </span>
          </div>
          
          {!translationService.isServiceAvailable() && (
            <div className="text-xs text-muted-foreground">
              Install LibreTranslate locally or configure API key
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>💡 Quick Test:</strong></p>
          <p>1. Set patient language to Spanish in the header</p>
          <p>2. Go to Post-Discharge Chat and type a message</p>
          <p>3. See automatic translation with badges</p>
          <p>4. Click "Show Original" to toggle between versions</p>
        </div>
      </CardContent>
    </Card>
  );
}