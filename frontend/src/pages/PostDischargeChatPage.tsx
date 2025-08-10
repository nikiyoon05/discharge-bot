
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { currentPatientState } from '@/store/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, User, Bot, MessageSquare, Phone, PhoneCall, Languages, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BackButton from '@/components/common/BackButton';
import { usePatientLanguage } from '@/hooks/usePatientLanguage';
import { useTranslation } from '@/hooks/useTranslation';
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

export default function PostDischargeChatPage() {
  const { id } = useParams<{ id: string }>();
  const patient = useRecoilValue(currentPatientState);
  const { currentLanguage, languageCode } = usePatientLanguage();
  const { translateMessage, isTranslationAvailable, isTranslating } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id) {
      ws.current = new WebSocket(`ws://localhost:8000/api/chat/ws/${id}/doctor`);

      ws.current.onmessage = async (event) => {
        const receivedMessage = JSON.parse(event.data);

        // Ignore messages sent by the doctor to prevent duplicates
        if (receivedMessage.sender === 'doctor') {
          return;
        }
        
        const messageWithId = { ...receivedMessage, id: crypto.randomUUID() };

        // Determine if the incoming message needs translation for the doctor's view
        const needsTranslation = 
          (messageWithId.sender === 'patient' || messageWithId.sender === 'ai_assistant') 
          && languageCode !== 'en';

        if (!needsTranslation) {
          // If no translation is needed, add the message and finish
          setMessages((prev) => [...prev, messageWithId]);
          return;
        }

        // If translation IS needed, add the message optimistically with a loading state
        const messageWithTranslating = { ...messageWithId, isTranslating: true };
        setMessages((prev) => [...prev, messageWithTranslating]);

        try {
          // Perform the translation from the patient's language to English
          const translationResult = await translateMessage(messageWithId.message, 'patient-to-doctor');
          
          // Update the message in the state with the final translation result
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageWithId.id
                ? { ...msg, translationResult, isTranslating: false }
                : msg
            )
          );
        } catch (error) {
          console.error(`Failed to translate message ${messageWithId.id}:`, error);
          // Update the message to remove the loading state on error
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageWithId.id ? { ...msg, isTranslating: false } : msg
            )
          );
        }
      };

      ws.current.onclose = () => console.log("WebSocket disconnected");
      ws.current.onerror = (error) => console.log("WebSocket error: ", error);
    }

    return () => {
      ws.current?.close();
    };
  }, [id, languageCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (inputMessage.trim() && ws.current?.readyState === WebSocket.OPEN) {
      let messageToSend = inputMessage;
      let translationResult: TranslationResult | undefined;

      // If patient language is not English, translate the message
      if (languageCode !== 'en') {
        try {
          const result = await translateMessage(inputMessage, 'doctor-to-patient');
          // Use the result for both the message to send and the local state
          translationResult = result;
          messageToSend = result.translatedText;
        } catch (error) {
          console.error('Failed to translate outgoing message:', error);
          // Send original message if translation fails
        }
      }

      const messageForServer: Message = {
        id: crypto.randomUUID(), // Add ID for tracking
        sender: 'doctor',
        message: messageToSend, // This is the translated message
        timestamp: new Date().toISOString(),
        translationResult // Send the full translation result to the patient
      };
      
      console.log("Sending to WebSocket:", messageForServer);
      ws.current.send(JSON.stringify(messageForServer));
      
      // Add the message to local state (showing what doctor typed originally)
      const localMessage: Message = {
        ...messageForServer,
        message: inputMessage, // Overwrite message with original English for doctor's UI
      };
      
      setMessages((prevMessages) => [...prevMessages, localMessage]);
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
        
        {/* Translation Status */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <span className="text-sm">
              Patient Language: <strong>{currentLanguage.flag} {currentLanguage.name}</strong>
            </span>
          </div>
          
          {!isTranslationAvailable && languageCode !== 'en' && (
            <Alert className="flex-1">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Translation service unavailable. Messages will not be automatically translated.
              </AlertDescription>
            </Alert>
          )}
          
          {isTranslationAvailable && languageCode !== 'en' && (
            <div className="text-sm text-green-600 flex items-center gap-1">
              <Languages className="h-4 w-4" />
              Auto-translation enabled
            </div>
          )}
        </div>
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
              <div className="flex items-center justify-between">
                <CardTitle>Conversation with {patient?.name}</CardTitle>
                {/* Demo Link - Temporary for Testing */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/patient/${id}/chat-simulation`, '_blank')}
                  className="text-xs"
                >
                  🧪 Open Patient View (Demo)
                </Button>
              </div>
            </CardHeader>
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <TranslatedMessage
                    key={msg.id}
                    currentUser="doctor"
                    sender={msg.sender}
                    originalMessage={msg.message}
                    translationResult={msg.translationResult}
                    timestamp={msg.timestamp}
                    isTranslating={msg.isTranslating}
                  />
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
                <Button 
                  onClick={sendMessage} 
                  disabled={ws.current?.readyState !== WebSocket.OPEN || isTranslating}
                >
                  {isTranslating ? (
                    <Languages className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
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
