import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  MessageSquare, 
  User, 
  Bot, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ConversationMessage {
  id: string;
  speaker: 'patient' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  type?: 'question' | 'response' | 'note' | 'action';
}

interface PreDischargeQuestion {
  id: string;
  question: string;
  category: 'availability' | 'preferences' | 'medical' | 'social';
  priority: 'high' | 'medium' | 'low';
  answered: boolean;
  answer?: string;
}

export default function DischargeMeeting() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      id: '1',
      speaker: 'system',
      content: 'Discharge meeting started. Bot is ready to begin patient conversation.',
      timestamp: new Date(),
      type: 'note'
    }
  ]);

  const [predefinedQuestions, setPredefinedQuestions] = useState<PreDischargeQuestion[]>([
    {
      id: 'q1',
      question: 'What days and times work best for your follow-up appointment?',
      category: 'availability',
      priority: 'high',
      answered: false
    },
    {
      id: 'q2', 
      question: 'Do you prefer morning or afternoon appointments?',
      category: 'preferences',
      priority: 'medium',
      answered: false
    },
    {
      id: 'q3',
      question: 'Do you have reliable transportation to get to appointments?',
      category: 'preferences',
      priority: 'high',
      answered: false
    },
    {
      id: 'q4',
      question: 'Are there any days you definitely cannot make appointments?',
      category: 'availability',
      priority: 'medium',
      answered: false
    }
  ]);

  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const startBotConversation = () => {
    setIsConnected(true);
    const botMessage: ConversationMessage = {
      id: Date.now().toString(),
      speaker: 'bot',
      content: "Hello! I'm here to help prepare for your discharge. I'll ask you a few questions to make sure we have everything set up for your follow-up care. How are you feeling today?",
      timestamp: new Date(),
      type: 'question'
    };
    setConversation(prev => [...prev, botMessage]);
  };

  const simulatePatientResponse = () => {
    const responses = [
      "I'm feeling much better, thank you. Ready to go home.",
      "I'm a bit nervous about going home, but excited.",
      "I feel good. What do I need to know about follow-up?"
    ];
    
    const patientMessage: ConversationMessage = {
      id: Date.now().toString(),
      speaker: 'patient',
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date(),
      type: 'response'
    };
    setConversation(prev => [...prev, patientMessage]);
  };

  const askPredefinedQuestion = (questionId: string) => {
    const question = predefinedQuestions.find(q => q.id === questionId);
    if (!question) return;

    const botMessage: ConversationMessage = {
      id: Date.now().toString(),
      speaker: 'bot',
      content: question.question,
      timestamp: new Date(),
      type: 'question'
    };
    setConversation(prev => [...prev, botMessage]);
  };

  const addCustomQuestion = () => {
    if (!currentQuestion.trim()) return;

    const botMessage: ConversationMessage = {
      id: Date.now().toString(),
      speaker: 'bot',
      content: currentQuestion,
      timestamp: new Date(),
      type: 'question'
    };
    setConversation(prev => [...prev, botMessage]);
    setCurrentQuestion('');
  };

  const markQuestionAnswered = (questionId: string, answer?: string) => {
    setPredefinedQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, answered: true, answer }
          : q
      )
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'availability': return 'bg-blue-100 text-blue-800';
      case 'preferences': return 'bg-green-100 text-green-800';
      case 'medical': return 'bg-red-100 text-red-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1">Pre-Discharge Patient Meeting</h1>
          <p className="text-muted-foreground">AI-powered conversation to gather patient information and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Bot Connected" : "Bot Offline"}
          </Badge>
          {!isConnected && (
            <Button onClick={startBotConversation} className="clinical-button-primary">
              Start Conversation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation Interface */}
        <div className="lg:col-span-2">
          <Card className="clinical-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Conversation
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                  disabled={!isConnected}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Conversation Display */}
              <div className="bg-muted/50 rounded-sm p-4 h-96 overflow-y-auto space-y-4">
                {conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.speaker === 'patient' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      message.speaker === 'bot' ? 'bg-primary text-primary-foreground' :
                      message.speaker === 'patient' ? 'bg-green-500 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {message.speaker === 'bot' ? <Bot className="h-4 w-4" /> :
                       message.speaker === 'patient' ? <User className="h-4 w-4" /> :
                       <MessageSquare className="h-4 w-4" />}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${
                      message.speaker === 'patient' ? 'text-right' : ''
                    }`}>
                      <div className={`p-3 rounded-sm ${
                        message.speaker === 'bot' ? 'bg-primary/10 border border-primary/20' :
                        message.speaker === 'patient' ? 'bg-green-50 border border-green-200' :
                        'bg-background border'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={conversationEndRef} />
              </div>

              {/* Custom Question Input */}
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Type a custom question for the bot to ask..."
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomQuestion()}
                  disabled={!isConnected}
                />
                <Button 
                  onClick={addCustomQuestion}
                  disabled={!isConnected || !currentQuestion.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Ask
                </Button>
              </div>

              {/* Demo Button */}
              {isConnected && (
                <div className="mt-2 flex justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={simulatePatientResponse}
                  >
                    Simulate Patient Response (Demo)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Management Panel */}
        <div className="space-y-4">
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-lg">Pre-defined Questions</CardTitle>
              <p className="text-sm text-muted-foreground">Click to have the bot ask these questions</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {predefinedQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(question.priority)}
                        <Badge variant="outline" className={getCategoryColor(question.category)}>
                          {question.category}
                        </Badge>
                      </div>
                      <p className="text-sm">{question.question}</p>
                      {question.answered && question.answer && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Answered: {question.answer}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={question.answered ? "secondary" : "outline"}
                      onClick={() => askPredefinedQuestion(question.id)}
                      disabled={!isConnected || question.answered}
                    >
                      {question.answered ? "Asked" : "Ask"}
                    </Button>
                  </div>
                  {question.id !== predefinedQuestions[predefinedQuestions.length - 1].id && (
                    <Separator />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Meeting Summary */}
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-lg">Meeting Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Questions Asked:</span>
                  <span className="font-semibold">
                    {predefinedQuestions.filter(q => q.answered).length}/{predefinedQuestions.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Messages Exchanged:</span>
                  <span className="font-semibold">{conversation.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Meeting Duration:</span>
                  <span className="font-semibold">
                    {isConnected ? "5 min 32 sec" : "Not started"}
                  </span>
                </div>
                <Separator />
                <Button 
                  className="w-full clinical-button-primary"
                  disabled={!isConnected}
                >
                  Complete Meeting & Extract Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}