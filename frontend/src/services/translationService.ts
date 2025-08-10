/**
 * Translation Service using LibreTranslate
 * 
 * This service handles automatic translation of messages between doctor and patient
 * based on the patient's preferred language setting.
 */

export interface TranslationConfig {
  endpoint: string;
  apiKey?: string;
}

export interface TranslationResult {
  translatedText: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
  isTranslated: boolean;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

class TranslationService {
  private config: TranslationConfig;
  private isAvailable: boolean = false;

  constructor(config: TranslationConfig) {
    this.config = config;
    this.checkAvailability(); // Initial fire-and-forget check
  }

  /**
   * Check if LibreTranslate service is available
   */
  public async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/languages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });
      this.isAvailable = response.ok;
      
      if (this.isAvailable) {
        console.log('✅ LibreTranslate service is available');
      } else {
        console.warn(`⚠️ LibreTranslate service responded with status ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ LibreTranslate service check failed:', error);
      this.isAvailable = false;
    }
    return this.isAvailable;
  }

  /**
   * Get available languages from LibreTranslate
   */
  async getAvailableLanguages(): Promise<Array<{ code: string; name: string }>> {
    if (!this.isAvailable) return [];

    try {
      const response = await fetch(`${this.config.endpoint}/languages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get available languages:', error);
      return [];
    }
  }

  /**
   * Detect the language of a text
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult | null> {
    if (!this.isAvailable || !text.trim()) return null;

    try {
      const response = await fetch(`${this.config.endpoint}/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({ q: text })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        language: result[0]?.language || 'en',
        confidence: result[0]?.confidence || 0
      };
    } catch (error) {
      console.error('Language detection failed:', error);
      return null;
    }
  }

  /**
   * Translate text from source language to target language
   */
  async translateText(
    text: string, 
    sourceLanguage: string, 
    targetLanguage: string
  ): Promise<TranslationResult> {
    // If source and target are the same, no translation needed
    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        isTranslated: false
      };
    }

    // If service is not available, return original text
    if (!this.isAvailable) {
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        isTranslated: false
      };
    }

    try {
      const response = await fetch(`${this.config.endpoint}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('✅ LibreTranslate successful response:', result);
      
      return {
        translatedText: result.translatedText || text,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        isTranslated: true
      };
    } catch (error) {
      console.error('❌ LibreTranslate API Error:', error);
      // Return original text if translation fails
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage,
        targetLanguage,
        isTranslated: false
      };
    }
  }

  /**
   * Translate doctor message to patient's language
   */
  async translateDoctorToPatient(
    message: string, 
    patientLanguage: string
  ): Promise<TranslationResult> {
    return this.translateText(message, 'en', patientLanguage);
  }

  /**
   * Translate patient message to English for doctor
   */
  async translatePatientToDoctor(
    message: string, 
    patientLanguage: string
  ): Promise<TranslationResult> {
    return this.translateText(message, patientLanguage, 'en');
  }

  /**
   * Auto-detect and translate patient message to English
   */
  async autoTranslatePatientMessage(message: string): Promise<TranslationResult> {
    // First detect the language
    const detection = await this.detectLanguage(message);
    const sourceLanguage = detection?.language || 'en';
    
    return this.translateText(message, sourceLanguage, 'en');
  }

  /**
   * Check if translation service is available
   */
  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Update configuration
   */
  updateConfig(config: TranslationConfig): void {
    this.config = config;
    this.checkAvailability();
  }
}

// Create default translation service instance
// You can configure this with environment variables or settings
const defaultConfig: TranslationConfig = {
  endpoint: import.meta.env.VITE_LIBRETRANSLATE_ENDPOINT || 'http://localhost:5050',
  apiKey: import.meta.env.VITE_LIBRETRANSLATE_API_KEY || undefined
};

export const translationService = new TranslationService(defaultConfig);

// Language code mapping for common languages
export const LANGUAGE_MAPPING: Record<string, string> = {
  'en': 'en',   // English
  'es': 'es',   // Spanish
  'fr': 'fr',   // French
  'de': 'de',   // German
  'it': 'it',   // Italian
  'pt': 'pt',   // Portuguese
  'ru': 'ru',   // Russian
  'zh': 'zh',   // Chinese
  'ja': 'ja',   // Japanese
  'ko': 'ko',   // Korean
  'ar': 'ar',   // Arabic
  'hi': 'hi',   // Hindi
};

export default TranslationService;