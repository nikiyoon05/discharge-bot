import { useEffect, useState, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { dashboardState } from '@/store/atoms';
import { v4 as uuidv4 } from 'uuid';

export interface ConversationMessage {
  id: string;
  speaker: 'patient' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  questionId?: string; // Optional field to link bot messages to specific questions
  audioUrl?: string;   // Optional TTS audio URL for bot messages
}

export interface DischargeQuestion {
  id: string;
  question: string;
  category: 'teach-back' | 'medication' | 'follow-up' | 'other';
  answered: boolean;
  answer?: string;
}

export type MeetingStatus = 'not-started' | 'in-progress' | 'completed';

export const useDischargeMeeting = () => {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || (typeof window !== 'undefined' && window.location && window.location.port === '8080' ? 'http://localhost:8000/api' : '/api');
  const [status, setStatus] = useState<MeetingStatus>('not-started');
  const [questions, setQuestions] = useState<DischargeQuestion[]>([
    // Teach-back Questions
    { id: uuidv4(), question: 'To make sure we are on the same page, can you tell me in your own words what this new medication, [Medication Name], is for?', category: 'teach-back', answered: false },
    { id: uuidv4(), question: 'How would you describe the key warning signs we discussed that would require you to call the doctor?', category: 'teach-back', answered: false },
    { id: uuidv4(), question: 'Can you show me how you would use the [Medical Device, e.g., Inhaler]?', category: 'teach-back', answered: false },
    
    // Medication Questions
    { id: uuidv4(), question: 'Do you have all the medications and supplies you need before you leave?', category: 'medication', answered: false },
    { id: uuidv4(), question: 'Are there any concerns about taking your medications as prescribed, such as cost or side effects?', category: 'medication', answered: false },
    
    // Follow-up Questions
    { id: uuidv4(), question: 'What are the best days and times for us to schedule your follow-up appointment next week?', category: 'follow-up', answered: false },
    
    // Other Important Questions
    { id: uuidv4(), question: 'On a scale from 1 to 10, with 10 being the highest, how confident do you feel in managing your care at home?', category: 'other', answered: false },
  ]);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [extractedAnswers, setExtractedAnswers] = useState<Record<string, string>>({});
  // Controlled conversation flow
  const [planSteps, setPlanSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [waitingForAnswer, setWaitingForAnswer] = useState<boolean>(false);
  // Refs to always have latest state inside callbacks
  const currentStepIndexRef = useRef<number>(currentStepIndex);
  const waitingForAnswerRef = useRef<boolean>(waitingForAnswer);
  const isSpeakingRef = useRef<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const patientIdRef = useRef<string | null>(null);
  const setDashboard = useSetRecoilState(dashboardState);

  // Keep refs in sync
  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    waitingForAnswerRef.current = waitingForAnswer;
  }, [waitingForAnswer]);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);

  // Removed auto-kickoff on planSteps change to avoid duplicate first messages

  const addQuestion = (question: string, category: DischargeQuestion['category']) => {
    const newQuestion: DischargeQuestion = { id: uuidv4(), question, category, answered: false };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    // Clean up any extracted answers for the removed question
    setExtractedAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[id];
      return newAnswers;
    });
  };

  const updateQuestion = (id: string, updatedQuestion: Partial<DischargeQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updatedQuestion } : q));
    
    // If the question text was changed, clear any existing extracted answer
    // since it might not be relevant to the new question
    if (updatedQuestion.question) {
      setExtractedAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[id];
        return newAnswers;
      });
    }
  };
  
  const startMeeting = async (patientId: string) => {
    patientIdRef.current = patientId;
    setStatus('in-progress');
    setDashboard(prev => ({ ...prev, 'pre-discharge-meeting': 'in-progress' }));
    
    // Step 1: Add a system message to indicate the start
    addConversationMessage({
      speaker: 'system',
      content: 'Generating conversation plan based on patient data and discharge summary...'
    });

    try {
      // Step 2: Call the backend to get the AI-generated plan
      const response = await fetch(`${API_BASE}/meeting/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          custom_questions: questions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate conversation plan: ${errorText}`);
      }

      const planResponse = await response.json();
      
      // Step 3: Clear initial messages and add plan confirmation
      setConversation([]);
      addConversationMessage({
        speaker: 'system',
        content: `Conversation plan generated successfully. Starting meeting with ${planResponse.plan.length} conversation steps...`
      });
      
      // Step 4: Controlled flow (one step at a time)
      setPlanSteps(planResponse.plan);
      setCurrentStepIndex(-1);
      setWaitingForAnswer(false);
      await new Promise(res => setTimeout(res, 200));
      // Speak first step directly to avoid race
      if (planResponse.plan.length > 0) {
        const step = planResponse.plan[0];
        const msg = { speaker: 'bot' as const, content: step.content, questionId: step.question_id };
        addConversationMessage(msg);
        // Relay bot speech text to patient view for live transcript
        try { if (patientIdRef.current) new BroadcastChannel(`meeting-${patientIdRef.current}`).postMessage({ type: 'bot_message', text: msg.content }); } catch {}
        await playSpeech(msg.content);
        if ((step as any).step_type === 'question' || String(step.content || '').trim().endsWith('?')) {
          setWaitingForAnswer(true);
          currentStepIndexRef.current = 0;
          setCurrentStepIndex(0);
        } else {
          setCurrentStepIndex(0);
          // Auto-advance if the first step is not a question
          setTimeout(() => { void playNextStep(); }, 250);
        }
      }
      
    } catch (error) {
      console.error(error);
      addConversationMessage({
        speaker: 'system',
        content: `Error generating plan: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support.`,
      });
      
      // Reset status on error
      setStatus('not-started');
    }
  };

  const addConversationMessage = (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    const newMessage = { ...message, id: uuidv4(), timestamp: new Date() };
    setConversation(prev => [...prev, newMessage]);

    console.log('[AddMessage]', newMessage, { waitingForAnswer: waitingForAnswerRef.current, currentStepIndex: currentStepIndexRef.current });
    
    // If this is a patient response, try to extract answers in real-time
    if (message.speaker === 'patient' && status === 'in-progress') {
      // If bot is speaking, ignore input to avoid it hearing itself
      if (isSpeakingRef.current) {
        console.log('[IgnoredPatientWhileSpeaking]', newMessage.content);
        return;
      }
      extractAnswersFromLatestResponse(newMessage.content);
      // Only advance if we are actually waiting for an answer to a question
      if (!waitingForAnswerRef.current) {
        return;
      }
      // First, react contextually to the patient's reply via backend
      (async () => {
        try {
          const reactiveResp = await fetch(`${API_BASE}/meeting/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patient_id: 'unknown',
              transcript: conversation,
              last_patient_message: newMessage.content,
              context_step: 'question',
            }),
          });
          if (reactiveResp.ok) {
            const data = await reactiveResp.json();
          // Ensure non-question when follow_up_needed is false
          let reactiveText: string = String(data.reply || '').trim();
          if (!Boolean(data.follow_up_needed) && reactiveText.endsWith('?')) {
            reactiveText = reactiveText.replace(/\?+$/,'').trim() + '.';
          }
          const msg = { speaker: 'bot' as const, content: reactiveText, questionId: undefined };
            addConversationMessage(msg);
            await playSpeech(msg.content);
            // If follow-up needed, stay on current question
            if (Boolean(data.follow_up_needed)) {
              return;
            }
          }
        } catch {}

        // Clear waiting flag now that we acknowledged patient's reply
        setWaitingForAnswer(false);
        waitingForAnswerRef.current = false;

        // Compute next step and set index immediately to avoid races with TTS
        const nextIndex = currentStepIndexRef.current + 1;
        console.log('[PatientReply] advancing to index', nextIndex, 'planSteps length', planSteps.length);
        setTimeout(async () => {
          if (nextIndex >= planSteps.length) return;
          const step = planSteps[nextIndex];
          console.log('[NextStep]', step);
          const msg = { speaker: 'bot' as const, content: step.content, questionId: step.question_id };
          // Set current step immediately
          currentStepIndexRef.current = nextIndex;
          setCurrentStepIndex(nextIndex);
          // Pre-mark waiting if this is a question
          const requiresAnswer = (step as any).step_type === 'question' || String(step.content || '').trim().endsWith('?');
          if (requiresAnswer) {
            setWaitingForAnswer(true);
            waitingForAnswerRef.current = true;
          }
          addConversationMessage(msg);
          try { if (patientIdRef.current) new BroadcastChannel(`meeting-${patientIdRef.current}`).postMessage({ type: 'bot_message', text: msg.content }); } catch {}
          await playSpeech(msg.content);
          if (!requiresAnswer) {
            // auto-advance further after non-question
            setTimeout(() => { void playNextStep(); }, 250);
          }
        }, 150);
      })();
    }
  };

  // Synthesize bot speech using backend ElevenLabs endpoint (with caching)
  const speakBot = async (text: string): Promise<string | undefined> => {
    try {
      const url = `${API_BASE}/voice/speak?text=${encodeURIComponent(text)}`;
      // Stream as a blob and create an object URL
      const resp = await fetch(url, { method: 'POST' });
      if (!resp.ok) return undefined;
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      return objectUrl;
    } catch {
      return undefined;
    }
  };

  // Play TTS for last bot message (conservative: only key steps)
  const playBotIfNeeded = async (msg: { speaker: 'bot'; content: string }) => {
    await playSpeech(msg.content);
  };

  // Centralized audio playback to avoid overlaps and echo
  const playSpeech = async (text: string): Promise<void> => {
    try {
      const url = await speakBot(text);
      if (!url) return;
      // Stop any current playback
      if (currentAudioRef.current) {
        try { currentAudioRef.current.pause(); } catch {}
        currentAudioRef.current.src = '';
        try { currentAudioRef.current.load(); } catch {}
      }
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      isSpeakingRef.current = true;
      // Notify patient demo to pause listening
      try { if (patientIdRef.current) new BroadcastChannel(`meeting-${patientIdRef.current}`).postMessage({ type: 'speaking_start' }); } catch {}
      await new Promise<void>((resolve) => {
        audio.addEventListener('ended', () => { setTimeout(() => { isSpeakingRef.current = false; try { if (patientIdRef.current) new BroadcastChannel(`meeting-${patientIdRef.current}`).postMessage({ type: 'speaking_end' }); } catch {}; }, 100); resolve(); });
        audio.addEventListener('error', () => { setTimeout(() => { isSpeakingRef.current = false; try { if (patientIdRef.current) new BroadcastChannel(`meeting-${patientIdRef.current}`).postMessage({ type: 'speaking_end' }); } catch {}; }, 100); resolve(); });
        audio.play().catch(() => { setTimeout(() => { isSpeakingRef.current = false; try { if (patientIdRef.current) new BroadcastChannel(`meeting-${patientIdRef.current}`).postMessage({ type: 'speaking_end' }); } catch {}; }, 100); resolve(); });
      });
    } catch {
      isSpeakingRef.current = false;
    }
  };

  // Determine if a step requires a patient answer
  const stepRequiresAnswer = (step: any): boolean => {
    if (!step) return false;
    if (step.step_type === 'question') return true;
    // Heuristic: treat content that ends with '?' as needing an answer
    const c = String(step.content || '').trim();
    return c.endsWith('?');
  };

  // Main step advancement routine
  const playNextStep = async (): Promise<void> => {
    if (isAdvancing) return;
    // If we are waiting for answer, do not advance
    if (waitingForAnswerRef.current) return;
    const nextIndex = currentStepIndexRef.current + 1;
    if (nextIndex >= planSteps.length) return;
    setIsAdvancing(true);
    try {
      const step = planSteps[nextIndex];
      const msg = { speaker: 'bot' as const, content: step.content, questionId: step.question_id };
      // Set index immediately to avoid repeats while TTS plays
      currentStepIndexRef.current = nextIndex;
      setCurrentStepIndex(nextIndex);
      // If this requires an answer, mark waiting before playing audio
      if (stepRequiresAnswer(step)) {
        setWaitingForAnswer(true);
        waitingForAnswerRef.current = true;
      }
      addConversationMessage(msg);
      try { if (patientIdRef.current) new BroadcastChannel(`meeting-${patientIdRef.current}`).postMessage({ type: 'bot_message', text: msg.content }); } catch {}
      await playBotIfNeeded(msg);
      if (stepRequiresAnswer(step)) {
        return;
      }
      // Auto-advance to next non-question step after a short delay
      setTimeout(() => { void playNextStep(); }, 300);
    } finally {
      setIsAdvancing(false);
    }
  };

  const extractAnswersFromLatestResponse = (patientResponse: string) => {
    // Simple real-time answer extraction based on recent bot questions
    // This provides immediate feedback during the conversation
    const recentBotMessages = conversation
      .filter(msg => msg.speaker === 'bot' && msg.questionId)
      .slice(-3); // Look at last 3 bot questions
    
    // For demo purposes, we'll do basic keyword matching
    // In a real implementation, this could call a lightweight AI service
    const newAnswers = { ...extractedAnswers };
    let hasNewAnswers = false;
    
    recentBotMessages.forEach(async (botMsg) => {
      if (botMsg.questionId && !newAnswers[botMsg.questionId]) {
        // Simple heuristic: if patient response contains certain keywords, consider it an answer
        if (patientResponse.toLowerCase().includes('yes') || 
            patientResponse.toLowerCase().includes('no') ||
            patientResponse.toLowerCase().includes('tuesday') ||
            patientResponse.toLowerCase().includes('wednesday') ||
            patientResponse.toLowerCase().includes('morning') ||
            patientResponse.toLowerCase().includes('afternoon') ||
            patientResponse.length > 20) { // Substantial response
          newAnswers[botMsg.questionId] = patientResponse;
          hasNewAnswers = true;
          // If follow-up category (availability), upsert canonical key to backend
          const q = questions.find(q => q.id === botMsg.questionId);
          if (q && q.category === 'follow-up' && patientIdRef.current) {
            try {
              await fetch(`${API_BASE}/meeting/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: patientIdRef.current, answers: { '__availability__': patientResponse } }),
              });
            } catch {}
          }
        }
      }
    });
    
    if (hasNewAnswers) {
      setExtractedAnswers(newAnswers);
    }
  };

  const completeMeeting = async (patientId: string) => {
    setStatus('completed');
    addConversationMessage({
      speaker: 'system',
      content: 'Meeting has concluded. Generating summary and extracting answers...',
    });

    try {
      const response = await fetch(`${API_BASE}/meeting/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          transcript: conversation,
          questions: questions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate summary: ${errorText}`);
      }

      const summaryResponse = await response.json();
      setSummary(summaryResponse.summary);
      setExtractedAnswers(summaryResponse.extracted_answers);
      setDashboard(prev => ({ ...prev, 'pre-discharge-meeting': 'completed' }));

      // Add confirmation message
      addConversationMessage({
        speaker: 'system',
        content: 'Summary generated successfully. Meeting analysis complete.',
      });

    } catch (error) {
      console.error(error);
      addConversationMessage({
        speaker: 'system',
        content: `Error generating summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };
  
  return {
    status,
    questions,
    conversation,
    summary,
    extractedAnswers,
    actions: {
      addQuestion,
      removeQuestion,
      updateQuestion,
      startMeeting,
      addConversationMessage,
      completeMeeting,
      setSummary,
      setExtractedAnswers,
    },
  };
};