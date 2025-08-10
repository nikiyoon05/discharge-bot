import { useState, useCallback, useEffect } from 'react';
import { usePatientLanguage } from './usePatientLanguage';
import { translationService, TranslationResult } from '@/services/translationService';

export interface TranslationHookResult {
  translateMessage: (message: string, direction: 'doctor-to-patient' | 'patient-to-doctor') => Promise<TranslationResult>;
  isTranslationAvailable: boolean;
  isTranslating: boolean;
  lastTranslationResult: TranslationResult | null;
}

/**
 * Hook for handling message translation in chat components
 */
export function useTranslation(): TranslationHookResult {
  const { languageCode } = usePatientLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslationAvailable, setIsTranslationAvailable] = useState(false);
  const [lastTranslationResult, setLastTranslationResult] = useState<TranslationResult | null>(null);

  // Check if translation service is available when the hook is used
  useEffect(() => {
    const verifyService = async () => {
      const available = await translationService.checkAvailability();
      setIsTranslationAvailable(available);
    };
    verifyService();
  }, []);

  /**
   * Translate a message based on direction
   */
  const translateMessage = useCallback(async (
    message: string, 
    direction: 'doctor-to-patient' | 'patient-to-doctor'
  ): Promise<TranslationResult> => {
    setIsTranslating(true);
    
    // Fallback result in case of any errors
    const fallbackResult: TranslationResult = {
      translatedText: message,
      originalText: message,
      sourceLanguage: direction === 'doctor-to-patient' ? 'en' : languageCode,
      targetLanguage: direction === 'doctor-to-patient' ? languageCode : 'en',
      isTranslated: false
    };
    
    try {
      let result: TranslationResult;
      
      if (direction === 'doctor-to-patient') {
        // Doctor writes in English, translate to patient's language
        result = await translationService.translateDoctorToPatient(message, languageCode);
      } else {
        // Patient writes in their language, translate to English for doctor
        result = await translationService.translatePatientToDoctor(message, languageCode);
      }
      
      console.log(`[useTranslation] Translating from ${result.sourceLanguage} to ${result.targetLanguage}. Result:`, result);

      setLastTranslationResult(result);
      return result;
    } catch (error) {
      console.error('Translation failed:', error);
      setLastTranslationResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsTranslating(false);
    }
  }, [languageCode]);

  return {
    translateMessage,
    isTranslationAvailable,
    isTranslating,
    lastTranslationResult
  };
}