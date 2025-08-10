import { useRecoilState, useRecoilValue } from 'recoil';
import { currentPatientState, languageOptionsState } from '@/store/atoms';

/**
 * Hook for managing patient language preferences
 * @returns Object with current language, available options, and setter function
 */
export function usePatientLanguage() {
  const [patient, setPatient] = useRecoilState(currentPatientState);
  const languageOptions = useRecoilValue(languageOptionsState);

  const currentLanguage = languageOptions.find(lang => lang.code === patient.language) || languageOptions[0];

  const setLanguage = (languageCode: string) => {
    setPatient({ ...patient, language: languageCode });
  };

  return {
    currentLanguage,
    languageOptions,
    setLanguage,
    languageCode: patient.language,
  };
}