import { useState } from 'react';
import { MessageSquare, Phone, PhoneCall, Send, X, ChevronRight } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { sidebarOpenState } from '@/store/atoms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SMSMessage {
  id: string;
  text: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'read';
}

interface VoiceCall {
  id: string;
  timestamp: string;
  duration: string;
  type: 'incoming' | 'outgoing';
  summary: string;
}

const mockSMSMessages: SMSMessage[] = [
  {
    id: '1',
    text: 'Reminder: Your follow-up appointment is tomorrow at 2 PM with Dr. Martinez.',
    timestamp: '14:30',
    direction: 'outbound',
    status: 'read'
  },
  {
    id: '2',
    text: 'Thank you. I will be there.',
    timestamp: '14:35',
    direction: 'inbound',
    status: 'delivered'
  },
  {
    id: '3',
    text: 'I have a question about my medication. Can someone call me?',
    timestamp: '16:15',
    direction: 'inbound',
    status: 'delivered'
  }
];

const mockVoiceCalls: VoiceCall[] = [
  {
    id: '1',
    timestamp: '16:30',
    duration: '3:20',
    type: 'outgoing',
    summary: 'Discussed medication concerns. Patient understands dosing instructions.'
  },
  {
    id: '2',
    timestamp: '10:15',
    duration: '0:45',
    type: 'incoming',
    summary: 'Brief check-in call about discharge planning'
  }
];

export default function CommSidebar() {
  const [isOpen, setIsOpen] = useRecoilState(sidebarOpenState);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message via telecom service
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <>
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 clinical-button-primary p-2"
          size="icon"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-background border-l shadow-lg transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="clinical-h2">Patient Communication</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="sms" className="h-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="sms" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>SMS</span>
              <Badge variant="secondary" className="ml-1">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>Voice</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sms" className="h-full px-4 pb-4">
            <div className="flex flex-col h-[calc(100%-8rem)]">
              {/* Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-3 py-4">
                  {mockSMSMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg ${
                          message.direction === 'outbound'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="clinical-small">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="flex space-x-2 pt-3 border-t">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="voice" className="h-full px-4 pb-4">
            <div className="space-y-4 py-4">
              {/* Quick call button */}
              <Button className="w-full clinical-button-primary flex items-center space-x-2">
                <PhoneCall className="h-4 w-4" />
                <span>Call Patient</span>
              </Button>

              {/* Call history */}
              <div className="space-y-3">
                <h4 className="clinical-small font-medium text-muted-foreground">Recent Calls</h4>
                {mockVoiceCalls.map((call) => (
                  <div key={call.id} className="clinical-card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${
                          call.type === 'outgoing' ? 'bg-clinical-info' : 'bg-clinical-success'
                        }`} />
                        <span className="clinical-small font-medium">{call.timestamp}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{call.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{call.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}