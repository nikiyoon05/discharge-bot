
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { currentPatientState } from '@/store/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot } from 'lucide-react';
import BackButton from '@/components/common/BackButton';

interface Message {
  sender: 'doctor' | 'patient' | 'ai_assistant';
  message: string;
  timestamp: string;
}

export default function PostDischargeChatPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const patient = useRecoilValue(currentPatientState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/api/chat/ws/${patientId}/doctor`);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, message]);
    };

    return () => {
      ws.current?.close();
    };
  }, [patientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() && ws.current) {
      const message: Message = {
        sender: 'doctor',
        message: inputMessage,
        timestamp: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message));
      setInputMessage('');
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${patientId}/dashboard`} label="Back to Dashboard" />
      <div>
        <h1 className="clinical-h1">Post-Discharge Chat</h1>
        <p className="clinical-body text-muted-foreground mt-2">
          Communicate with {patient?.name} and monitor AI-assisted responses.
        </p>
      </div>

      <Card className="h-[70vh] flex flex-col">
        <CardHeader>
          <CardTitle>Conversation with {patient?.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'doctor' ? 'justify-end' : ''}`}>
              {msg.sender !== 'doctor' && (
                <div className="bg-muted rounded-full p-2">
                  {msg.sender === 'patient' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
              )}
              <div className={`p-3 rounded-lg max-w-lg ${
                msg.sender === 'doctor' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <p className="font-bold text-sm capitalize">{msg.sender.replace('_', ' ')}</p>
                <p>{msg.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
            />
            <Button onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
