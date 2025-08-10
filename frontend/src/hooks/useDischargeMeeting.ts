import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface ConversationMessage {
  id: string;
  speaker: 'patient' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  questionId?: string; // Optional field to link bot messages to specific questions
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
    setStatus('in-progress');
    
    // Step 1: Add a system message to indicate the start
    addConversationMessage({
      speaker: 'system',
      content: 'Generating conversation plan based on patient data and discharge summary...'
    });

    try {
      // Step 2: Call the backend to get the AI-generated plan
      const response = await fetch('/api/meeting/plan', {
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
      
      // Step 4: Populate the conversation with the plan from the backend
      const planMessages = planResponse.plan.map((step: any) => ({
        speaker: 'bot',
        content: step.content,
        questionId: step.question_id, // Track which question this relates to
      }));

      // Add messages with realistic timing
      for (const msg of planMessages) {
        await new Promise(res => setTimeout(res, 1500)); // Slightly longer delay for realism
        addConversationMessage(msg);
      }

      // Add final system message
      addConversationMessage({
        speaker: 'system',
        content: 'Conversation plan complete. Waiting for patient responses...'
      });
      
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
    
    // If this is a patient response, try to extract answers in real-time
    if (message.speaker === 'patient' && status === 'in-progress') {
      extractAnswersFromLatestResponse(newMessage.content);
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
    
    recentBotMessages.forEach(botMsg => {
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
      const response = await fetch('/api/meeting/summarize', {
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