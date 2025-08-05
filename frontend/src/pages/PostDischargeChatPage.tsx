
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { currentPatientState } from '@/store/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, MessageSquare, Phone, PhoneCall } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import BackButton from '@/components/common/BackButton';

interface Message {
  sender: 'doctor' | 'patient' | 'ai_assistant';
  message: string;
  timestamp: string;
}

export default function PostDischargeChatPage() {
  const { id } = useParams<{ id: string }>();
  const patient = useRecoilValue(currentPatientState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) {
      ws.current = new WebSocket(`ws://localhost:8000/api/chat/ws/${id}/doctor`);

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setMessages((prevMessages) => [...prevMessages, message]);
      };

      ws.current.onclose = () => console.log("WebSocket disconnected");
      ws.current.onerror = (error) => console.log("WebSocket error: ", error);
    }

    return () => {
      ws.current?.close();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() && ws.current?.readyState === WebSocket.OPEN) {
      const message: Message = {
        sender: 'doctor',
        message: inputMessage,
        timestamp: new Date().toISOString(),
      };
      ws.current.send(JSON.stringify(message));
      setInputMessage('');
    }
  };

  if (!patient || !id) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      <div>
        <h1 className="clinical-h1">Post-Discharge Communication</h1>
        <p className="clinical-body text-muted-foreground mt-2">
          Communicate with {patient?.name} and monitor AI-assisted responses.
        </p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Chat</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Voice</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle>Conversation with {patient?.name}</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3 ${msg.sender === 'doctor' ? 'justify-end' : ''}`}>
                    {msg.sender !== 'doctor' && (
                      <div className="bg-muted rounded-full p-2">
                        {msg.sender === 'patient' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5 text-primary" />}
                      </div>
                    )}
                    <div className={`p-3 rounded-lg max-w-lg ${
                      msg.sender === 'doctor' 
                        ? 'bg-primary text-primary-foreground' 
                        : msg.sender === 'ai_assistant'
                          ? 'bg-purple-50 border border-purple-200 text-purple-900'
                          : 'bg-muted'
                    }`}>
                      <p className="font-bold text-sm capitalize">{msg.sender.replace('_', ' ')}</p>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message to the patient..."
                />
                <Button onClick={sendMessage} disabled={ws.current?.readyState !== WebSocket.OPEN}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="voice">
            <Card className="h-[70vh] flex flex-col items-center justify-center">
                <div className="text-center">
                    <PhoneCall className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="clinical-h3">Voice Call Functionality</h3>
                    <p className="text-muted-foreground mt-2">The ability to make calls is coming soon.</p>
                </div>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
