
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot } from 'lucide-react';
import TranslatedMessage from '@/components/chat/TranslatedMessage';
import { TranslationResult } from '@/services/translationService';

interface Message {
  id: string;
  sender: 'doctor' | 'patient' | 'ai_assistant';
  message: string;
  timestamp: string;
  translationResult?: TranslationResult;
  isTranslating?: boolean;
}

export default function PatientChatSimulationPage() {
  const { id } = useParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) {
      ws.current = new WebSocket(`ws://localhost:8000/api/chat/ws/${id}/patient`);

      ws.current.onmessage = (event) => {
        const receivedMessage = JSON.parse(event.data);
        
        // Ignore messages sent by the patient to prevent duplicates
        if (receivedMessage.sender === 'patient') {
          return;
        }

        const messageWithId = { ...receivedMessage, id: crypto.randomUUID() };
        setMessages((prevMessages) => [...prevMessages, messageWithId]);
      };
    }

    return () => {
      ws.current?.close();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() && ws.current) {
      const message: Message = {
        id: crypto.randomUUID(),
        sender: 'patient',
        message: inputMessage,
        timestamp: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message));

      // Optimistically add the message to the UI
      setMessages((prevMessages) => [...prevMessages, message]);
      
      setInputMessage('');
    }
  };

  if (!id) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg h-[90vh] flex flex-col">
        <CardHeader>
          <CardTitle>Chat with your Care Team</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <TranslatedMessage
              key={msg.id}
              currentUser="patient"
              sender={msg.sender}
              originalMessage={msg.message}
              translationResult={msg.translationResult}
              timestamp={msg.timestamp}
            />
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
