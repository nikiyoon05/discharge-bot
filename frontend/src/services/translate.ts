// Mock translation service for patient-friendly instructions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface TranslationRequest {
  text: string;
  literacyLevel: 'elementary' | 'middle' | 'high-school' | 'college';
  language: 'en' | 'es' | 'fr' | 'zh' | 'ar';
  medicalContext: 'discharge' | 'medication' | 'followup' | 'general';
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  readingLevel: string;
  keyPoints: string[];
  warningFlags: string[];
}

export const translateService = {
  async translateInstructions(request: TranslationRequest): Promise<TranslationResponse> {
    await delay(1200); // Simulate AI processing time
    
    // Mock translation based on literacy level and language
    const simplifications = {
      elementary: {
        'monitor': 'check',
        'administer': 'give',
        'medication': 'medicine',
        'immediately': 'right away',
        'discontinue': 'stop taking'
      },
      middle: {
        'monitor': 'watch carefully',
        'administer': 'take',
        'immediately': 'right away'
      },
      'high-school': {
        'administer': 'take'
      },
      college: {}
    };

    let translatedText = request.text;
    const levelMappings = simplifications[request.literacyLevel] || {};
    
    Object.entries(levelMappings).forEach(([complex, simple]) => {
      translatedText = translatedText.replace(new RegExp(complex, 'gi'), simple as string);
    });

    // Add language-specific translations (mock)
    if (request.language === 'es') {
      translatedText = "Tome su medicina cada día. Llame al doctor si tiene problemas.";
    }

    return {
      originalText: request.text,
      translatedText,
      readingLevel: `${request.literacyLevel} level`,
      keyPoints: [
        'Take all medications as prescribed',
        'Follow up with your doctor',
        'Call if you have concerns'
      ],
      warningFlags: []
    };
  },

  async getAvailableLanguages(): Promise<Array<{ code: string; name: string; nativeName: string }>> {
    await delay(200);
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
    ];
  },

  async validateReadability(text: string): Promise<{
    score: number;
    grade: string;
    recommendations: string[];
  }> {
    await delay(400);
    return {
      score: 8.2,
      grade: '8th grade',
      recommendations: [
        'Use shorter sentences',
        'Replace medical jargon',
        'Add visual aids'
      ]
    };
  }
};