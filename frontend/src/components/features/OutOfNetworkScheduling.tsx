import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  PhoneCall,
  Calendar,
  Clock,
  MapPin,
  User,
  Bot,
  CheckCircle,
  AlertCircle,
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  FileText,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface PatientAvailability {
  preferredDays: string[];
  preferredTimes: string[];
  unavailableDates: string[];
  timePreference: 'morning' | 'afternoon' | 'evening' | 'flexible';
  notes: string;
  capturedFrom: 'discharge_meeting' | 'manual_entry';
  lastUpdated: Date;
}

interface OutpatientClinic {
  id: string;
  name: string;
  specialty: string;
  address: string;
  phone: string;
  contactPerson: string;
  schedulingHours: string;
  acceptsNewPatients: boolean;
  waitTime: string;
  notes: string;
}

interface CallLog {
  id: string;
  clinicId: string;
  startTime: Date;
  endTime?: Date;
  status: 'calling' | 'completed' | 'failed' | 'no_answer' | 'busy';
  outcome: string;
  appointmentScheduled: boolean;
  appointmentDetails?: {
    date: string;
    time: string;
    provider: string;
    confirmationNumber: string;
  };
  transcript: CallTranscriptEntry[];
  notes: string;
}

interface CallTranscriptEntry {
  timestamp: Date;
  speaker: 'bot' | 'clinic_staff' | 'system';
  content: string;
  type: 'speech' | 'action' | 'note';
}

export default function OutOfNetworkScheduling() {
  const { id: patientId } = useParams<{ id: string }>();
  const [patientAvailability, setPatientAvailability] = useState<PatientAvailability | null>(null);

  const [selectedClinic, setSelectedClinic] = useState<OutpatientClinic>({
    id: 'clinic_1',
    name: 'Northwest Primary Care Associates',
    specialty: 'Internal Medicine',
    address: '1234 Medical Center Dr, Seattle, WA 98101',
    phone: '(206) 555-0123',
    contactPerson: 'Sarah Johnson, Scheduling Coordinator',
    schedulingHours: '8:00 AM - 5:00 PM, Mon-Fri',
    acceptsNewPatients: true,
    waitTime: '2-3 weeks',
    notes: 'Preferred provider for post-discharge follow-up. Dr. Martinez has excellent bedside manner.'
  });

  const [currentCall, setCurrentCall] = useState<CallLog | null>(null);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<CallTranscriptEntry[]>([]);

  const [isWrittenToEHR, setIsWrittenToEHR] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscript]);

  // Load availability captured from discharge meeting
  useEffect(() => {
    const API_BASE = (import.meta as any).env?.VITE_API_BASE || (typeof window !== 'undefined' && window.location && window.location.port === '8080' ? 'http://localhost:8000/api' : '/api');
    let cancelled = false;
    async function loadAvailability() {
      if (!patientId) return;
      try {
        const resp = await fetch(`${API_BASE}/meeting/latest?patient_id=${encodeURIComponent(patientId)}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const answers = data.extracted_answers || {};
        const availabilityText: string | undefined = answers['__availability__'] || answers['__availability_notes__'];
        if (!availabilityText) {
          if (!cancelled) setPatientAvailability(null);
          return;
        }
        // Simple parsing heuristics
        const daysAll = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
        const negative = /(not\s+free|can'?t|cannot|no\s+friday|no\s+mondays|except)/i;
        const foundDays = daysAll.filter(d => new RegExp(d, 'i').test(availabilityText) && !new RegExp(`not\\s+(${d})`, 'i').test(availabilityText));
        // Remove explicit negatives like "not free on Fridays"
        const cleanedDays = foundDays.filter(d => !/friday/i.test(d) || !/friday/i.test(availabilityText) || !negative.test(availabilityText));
        const times: string[] = [];
        const timePref = /morning|afternoon|evening/i.exec(availabilityText)?.[0]?.toLowerCase() as 'morning'|'afternoon'|'evening'|undefined;
        // Match formats like "9:00 AM - 12:00 PM"
        const rangeMatch = availabilityText.match(/(\d{1,2}:?\d{0,2}\s?(?:AM|PM))\s*(?:-|to|–)\s*(\d{1,2}:?\d{0,2}\s?(?:AM|PM))/i);
        if (rangeMatch) {
          times.push(`${rangeMatch[1]} - ${rangeMatch[2]}`);
        } else {
          // Fallback: "9:00 to 12:00" or "9 to 12" (no AM/PM)
          const alt = availabilityText.match(/(\d{1,2}(?::\d{2})?)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?)/i);
          if (alt) {
            const start = alt[1];
            const end = alt[2];
            times.push(`${start} - ${end}`);
          }
        }
        if (!times.length && timePref) {
          if (timePref === 'morning') times.push('9:00 AM - 12:00 PM');
          if (timePref === 'afternoon') times.push('1:00 PM - 4:00 PM');
          if (timePref === 'evening') times.push('5:00 PM - 7:00 PM');
        }
        if (!cancelled) setPatientAvailability({
          preferredDays: cleanedDays.length ? cleanedDays : [],
          preferredTimes: times,
          unavailableDates: [],
          timePreference: (timePref as any) || 'flexible',
          notes: availabilityText,
          capturedFrom: 'discharge_meeting',
          lastUpdated: new Date(),
        });
      } catch {
        // ignore
      }
    }
    void loadAvailability();
    return () => { cancelled = true; };
  }, [patientId]);

  const startCall = () => {
    const newCall: CallLog = {
      id: Date.now().toString(),
      clinicId: selectedClinic.id,
      startTime: new Date(),
      status: 'calling',
      outcome: '',
      appointmentScheduled: false,
      transcript: [],
      notes: ''
    };

    setCurrentCall(newCall);
    setIsCallActive(true);
    setLiveTranscript([
      {
        timestamp: new Date(),
        speaker: 'system',
        content: `Calling ${selectedClinic.name} at ${selectedClinic.phone}...`,
        type: 'action'
      }
    ]);

    // Simulate call connection
    setTimeout(() => {
      setLiveTranscript(prev => [...prev, {
        timestamp: new Date(),
        speaker: 'system',
        content: 'Call connected. Bot is speaking with clinic staff.',
        type: 'action'
      }]);
      simulateCallConversation();
    }, 3000);
  };

  const simulateCallConversation = () => {
    const conversation = [
      {
        speaker: 'clinic_staff' as const,
        content: 'Hello, Northwest Primary Care, this is Sarah speaking. How can I help you?',
        delay: 1000
      },
      {
        speaker: 'bot' as const,
        content: 'Hi Sarah, this is the Bela discharge planning assistant. I\'m calling to schedule a follow-up appointment for a patient who was recently discharged from the hospital.',
        delay: 2000
      },
      {
        speaker: 'clinic_staff' as const,
        content: 'Of course! I can help with that. Can you provide me with the patient\'s information?',
        delay: 1500
      },
      {
        speaker: 'bot' as const,
        content: 'Yes, the patient is John Anderson, DOB March 15, 1965. He was discharged today and needs a follow-up appointment for post-discharge care management.',
        delay: 2500
      },
      {
        speaker: 'clinic_staff' as const,
        content: 'Let me check our schedule. What days and times work best for Mr. Anderson?',
        delay: 2000
      },
      {
        speaker: 'bot' as const,
        content: 'Based on our conversation with the patient, he\'s available Monday through Wednesday, preferably in the morning between 9 AM and 12 PM. He cannot do appointments on Fridays due to dialysis.',
        delay: 3000
      },
      {
        speaker: 'clinic_staff' as const,
        content: 'Perfect! I have an opening next Tuesday, August 20th at 10:30 AM with Dr. Martinez. Would that work?',
        delay: 2500
      },
      {
        speaker: 'bot' as const,
        content: 'That sounds perfect. Let me confirm - Tuesday, August 20th at 10:30 AM with Dr. Martinez. Can you provide a confirmation number?',
        delay: 2000
      },
      {
        speaker: 'clinic_staff' as const,
        content: 'Yes, the confirmation number is NPC-8547. Please have Mr. Anderson arrive 15 minutes early with his insurance card and discharge paperwork.',
        delay: 2500
      },
      {
        speaker: 'bot' as const,
        content: 'Excellent! I\'ve recorded all the details. Is there anything else Mr. Anderson should know before his appointment?',
        delay: 1500
      },
      {
        speaker: 'clinic_staff' as const,
        content: 'Just that Dr. Martinez will want to review his hospital discharge summary and current medications. We\'ll see him next Tuesday!',
        delay: 2000
      }
    ];

    let index = 0;
    const addMessage = () => {
      if (index < conversation.length) {
        const message = conversation[index];
        setTimeout(() => {
          setLiveTranscript(prev => [...prev, {
            timestamp: new Date(),
            speaker: message.speaker,
            content: message.content,
            type: 'speech'
          }]);
          index++;
          addMessage();
        }, message.delay);
      } else {
        // Call completed
        setTimeout(() => {
          completeCall(true);
        }, 1000);
      }
    };

    addMessage();
  };

  const completeCall = (successful: boolean) => {
    if (!currentCall) return;

    const completedCall: CallLog = {
      ...currentCall,
      endTime: new Date(),
      status: successful ? 'completed' : 'failed',
      outcome: successful ? 'Appointment successfully scheduled' : 'Unable to schedule appointment',
      appointmentScheduled: successful,
      appointmentDetails: successful ? {
        date: '2024-08-20',
        time: '10:30 AM',
        provider: 'Dr. Martinez',
        confirmationNumber: 'NPC-8547'
      } : undefined,
      transcript: liveTranscript,
      notes: successful ? 'Patient scheduled for follow-up. Confirmation sent to patient portal.' : 'Clinic was closed. Will retry during business hours.'
    };

    setCallHistory(prev => [completedCall, ...prev]);
    setCurrentCall(null);
    setIsCallActive(false);

    // Add completion message
    setLiveTranscript(prev => [...prev, {
      timestamp: new Date(),
      speaker: 'system',
      content: successful ? 'Call completed successfully. Appointment scheduled!' : 'Call completed. No appointment scheduled.',
      type: 'action'
    }]);
  };

  const endCall = () => {
    completeCall(false);
  };

  const writeToEHR = async (appointmentDetails: any) => {
    try {
      await fetch('http://localhost:8000/api/ehr/write-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentDetails),
      });
      setIsWrittenToEHR(true);
      toast.success('Appointment written to EHR successfully');
    } catch (error) {
      toast.error('Failed to write appointment to EHR');
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const duration = (end ? end.getTime() : Date.now()) - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1">Out-of-Network Follow-up Scheduling</h1>
          <p className="text-muted-foreground">AI-powered calling to schedule appointments with external providers</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isCallActive ? "default" : "secondary"}>
            {isCallActive ? "Call Active" : "Ready to Call"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Availability & Clinic Info */}
        <div className="space-y-4">
            <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Patient Availability
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {patientAvailability ? 'Captured from discharge meeting' : 'No availability captured yet from discharge meeting'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientAvailability ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Preferred Days</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patientAvailability.preferredDays.length ? patientAvailability.preferredDays.map(day => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {day}
                        </Badge>
                      )) : <div className="text-sm text-muted-foreground">—</div>}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Preferred Times</label>
                    <div className="space-y-1 mt-1">
                      {patientAvailability.preferredTimes.length ? patientAvailability.preferredTimes.map(time => (
                        <div key={time} className="text-sm bg-muted/50 p-2 rounded-sm">
                          {time}
                        </div>
                      )) : <div className="text-sm text-muted-foreground">—</div>}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted/50 rounded-sm">
                      {patientAvailability.notes}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3" />
                    Captured from discharge meeting {Math.floor((Date.now() - patientAvailability.lastUpdated.getTime()) / (1000 * 60))} minutes ago
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Availability will appear here after it is captured in the discharge meeting.</div>
              )}
            </CardContent>
          </Card>

          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Target Clinic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="font-medium">{selectedClinic.name}</div>
                <div className="text-sm text-muted-foreground">{selectedClinic.specialty}</div>
              </div>
              
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-3 w-3" />
                  {selectedClinic.phone}
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5" />
                  <span>{selectedClinic.address}</span>
                </div>
              </div>

              <div className="text-sm">
                <div className="font-medium">Contact: {selectedClinic.contactPerson}</div>
                <div className="text-muted-foreground">Hours: {selectedClinic.schedulingHours}</div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accepts New Patients
                </Badge>
              </div>

              <Button 
                onClick={startCall}
                disabled={isCallActive}
                className="w-full clinical-button-primary"
              >
                <Phone className="h-4 w-4 mr-2" />
                {isCallActive ? 'Call in Progress...' : 'Start Automated Call'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Call Interface */}
        <div className="lg:col-span-2">
          <Card className="clinical-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Live Call Transcript
                </CardTitle>
                {isCallActive && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">Live</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={endCall}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      End Call
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Call Status */}
              {currentCall && (
                <div className="bg-muted/50 p-3 rounded-sm mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="h-4 w-4" />
                      <span className="font-medium">Calling {selectedClinic.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {formatDuration(currentCall.startTime, currentCall.endTime)}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Transcript */}
              <div className="bg-background border rounded-sm p-4 h-96 overflow-y-auto space-y-3">
                {liveTranscript.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Phone className="h-8 w-8 mx-auto mb-2" />
                    <p>No active call. Click "Start Automated Call" to begin.</p>
                  </div>
                ) : (
                  liveTranscript.map((entry, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        entry.speaker === 'bot' ? '' : 
                        entry.speaker === 'clinic_staff' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        entry.speaker === 'bot' ? 'bg-primary text-primary-foreground' :
                        entry.speaker === 'clinic_staff' ? 'bg-blue-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {entry.speaker === 'bot' ? <Bot className="h-4 w-4" /> :
                         entry.speaker === 'clinic_staff' ? <User className="h-4 w-4" /> :
                         <Phone className="h-4 w-4" />}
                      </div>
                      <div className={`flex-1 max-w-[80%] ${
                        entry.speaker === 'clinic_staff' ? 'text-right' : ''
                      }`}>
                        <div className={`p-3 rounded-sm ${
                          entry.speaker === 'bot' ? 'bg-primary/10 border border-primary/20' :
                          entry.speaker === 'clinic_staff' ? 'bg-blue-50 border border-blue-200' :
                          'bg-muted border'
                        }`}>
                          <p className="text-sm">{entry.content}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Call Controls */}
              {isCallActive && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={endCall}>
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call History */}
          {callHistory.length > 0 && (
            <Card className="clinical-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Call History & Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {callHistory.slice(0, 3).map((call) => (
                    <div key={call.id} className="border rounded-sm p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={call.appointmentScheduled ? "default" : "secondary"}>
                            {call.appointmentScheduled ? "Success" : "Failed"}
                          </Badge>
                          <span className="text-sm font-medium">
                            {call.startTime.toLocaleDateString()} at {call.startTime.toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Duration: {formatDuration(call.startTime, call.endTime)}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-2">{call.outcome}</p>
                      
                      {call.appointmentDetails && (
                        <div className="bg-green-50 border border-green-200 rounded-sm p-3">
                          <div className="font-medium text-green-800 mb-1">Appointment Scheduled</div>
                          <div className="text-sm text-green-700">
                            <div>Date: {call.appointmentDetails.date}</div>
                            <div>Time: {call.appointmentDetails.time}</div>
                            <div>Provider: {call.appointmentDetails.provider}</div>
                            <div>Confirmation: {call.appointmentDetails.confirmationNumber}</div>
                          </div>
                          <Button
                            onClick={() => writeToEHR(call.appointmentDetails)}
                            disabled={isWrittenToEHR}
                            size="sm"
                            className="mt-2"
                          >
                            {isWrittenToEHR ? 'Written to EHR' : 'Write to Epic EHR'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}