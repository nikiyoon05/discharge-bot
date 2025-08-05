
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot } from 'lucide-react';

interface Message {
  sender: 'doctor' | 'patient' | 'ai_assistant';
  message: string;
  timestamp: string;
}

export default function PatientChatSimulationPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/api/chat/ws/${patientId}/patient`);

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
        sender: 'patient',
        message: inputMessage,
        timestamp: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message));
      setInputMessage('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle>Chat with your Care Team</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'patient' ? 'justify-end' : ''}`}>
              {msg.sender !== 'patient' && (
                <div className="bg-muted rounded-full p-2">
                  {msg.sender === 'doctor' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
              )}
              <div className={`p-3 rounded-lg max-w-lg ${
                msg.sender === 'patient' ? 'bg-blue-500 text-white' : 'bg-muted'
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
