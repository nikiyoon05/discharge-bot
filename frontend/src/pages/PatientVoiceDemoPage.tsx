import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PatientVoiceDemoPage() {
  const { id: patientId } = useParams<{ id: string }>();
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef<boolean>(false);
  const [conversation, setConversation] = useState<Array<{ speaker: 'bot' | 'patient'; text: string; ts: Date }>>([]);

  // Setup Web Speech API (browser STT)
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalText += res[0].transcript;
        }
        if (finalText && !speakingRef.current) setTranscript(finalText.trim());
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (recording) {
      rec.stop();
      setRecording(false);
    } else {
      setTranscript('');
      rec.start();
      setRecording(true);
    }
  };

  // When transcript updates meaningfully, send as a patient message to the meeting hook endpoint
  // This demo just emits an event; integrate as needed with your meeting flow.
  useEffect(() => {
    if (!patientId || !transcript || !recording || speakingRef.current) return;
    if (transcript.length < 3) return;
    const text = transcript;
    const channel = new BroadcastChannel(`meeting-${patientId}`);
    channel.postMessage({ type: 'patient_message', text });
    channel.close();
    setConversation(prev => [...prev, { speaker: 'patient', text, ts: new Date() }]);
    // Clear after send to avoid duplicate posts
    setTranscript('');
  }, [transcript, recording, patientId]);

  // Listen for speaking start/end to pause/resume STT
  useEffect(() => {
    if (!patientId) return;
    const channel = new BroadcastChannel(`meeting-${patientId}`);
    channel.onmessage = (event) => {
      const data = event.data;
      if (data?.type === 'speaking_start') {
        speakingRef.current = true;
        try { recognitionRef.current && recognitionRef.current.stop(); } catch {}
      }
      if (data?.type === 'speaking_end') {
        speakingRef.current = false;
        if (recording) {
          setTimeout(() => { try { recognitionRef.current && recognitionRef.current.start(); } catch {} }, 350);
        }
      }
      if (data?.type === 'bot_message' && typeof data.text === 'string') {
        setConversation(prev => [...prev, { speaker: 'bot', text: data.text, ts: new Date() }]);
      }
    };
    return () => channel.close();
  }, [patientId, recording]);

  return (
    <Card className="clinical-card">
      <CardHeader>
        <CardTitle>Patient Voice Demo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16">
            <span className={`absolute inset-0 rounded-full ${recording ? 'bg-green-400' : 'bg-gray-300'} opacity-70`}></span>
            {recording && <span className="absolute inset-0 rounded-full bg-green-400 animate-ping"></span>}
          </div>
          <Button onClick={toggleRecording} variant={recording ? 'destructive' : 'default'}>
            {recording ? 'Stop Listening' : 'Start Listening'}
          </Button>
        </div>
        <div className="text-sm">
          <p className="font-medium">Live Transcript (Patient):</p>
          <div className="mt-2 p-3 bg-muted rounded min-h-[80px]">{transcript || '...'}</div>
        </div>
        <div className="text-sm">
          <p className="font-medium">Conversation (Bot + You):</p>
          <div className="mt-2 p-3 bg-muted rounded h-40 overflow-y-auto space-y-2">
            {conversation.map((m, i) => (
              <div key={i} className={`text-sm ${m.speaker === 'bot' ? 'text-blue-800' : 'text-green-800'}`}>
                <span className="font-semibold mr-1">{m.speaker === 'bot' ? 'Bot' : 'You'}:</span>
                <span>{m.text}</span>
              </div>
            ))}
            {conversation.length === 0 && <div className="text-xs text-muted-foreground">Conversation will appear here.</div>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">This demo uses the browser SpeechRecognition API. In production, swap with a HIPAA-compliant STT provider.</p>
      </CardContent>
    </Card>
  );
}

