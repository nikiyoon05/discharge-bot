import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, User, MessageSquare, Plus, Trash2, Edit, Save, X, FileText, CheckCircle, Clock } from 'lucide-react';
import { useDischargeMeeting, DischargeQuestion } from '@/hooks/useDischargeMeeting';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams } from 'react-router-dom';

export default function DischargeMeeting() {
  const { id: patientId } = useParams<{ id: string }>();
  const { status, questions, conversation, summary, extractedAnswers, actions } = useDischargeMeeting();
  const [activeTab, setActiveTab] = useState('questions');
  const conversationEndRef = useRef<HTMLDivElement>(null);
  
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState<DischargeQuestion['category']>('other');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (status === 'completed') {
      setActiveTab('summary');
    }
  }, [status]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      actions.addQuestion(newQuestion, newQuestionCategory);
      setNewQuestion('');
      setNewQuestionCategory('other');
    }
  };

  const handleStartEdit = (question: DischargeQuestion) => {
    setEditingQuestionId(question.id);
    setEditingText(question.question);
  };

  const handleSaveEdit = () => {
    if (editingQuestionId && editingText.trim()) {
      actions.updateQuestion(editingQuestionId, { question: editingText });
      setEditingQuestionId(null);
      setEditingText('');
    }
  };
  
  const handleSimulateResponse = () => {
    actions.addConversationMessage({
      speaker: 'patient',
      content: 'I will take the red pill in the morning, and the blue one at night. I should call if I get a fever.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1">Pre-Discharge Patient Meeting</h1>
          <p className="text-muted-foreground">AI-powered conversation to prepare the patient for discharge.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === 'in-progress' ? "default" : "secondary"}>{status.replace('-', ' ')}</Badge>
          {status === 'not-started' && (
            <Button onClick={() => actions.startMeeting(patientId!)} className="clinical-button-primary">Start Meeting</Button>
          )}
          {status === 'in-progress' && (
            <Button onClick={() => actions.completeMeeting(patientId!)} className="clinical-button-destructive">End & Summarize</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Conversation */}
        <div className="lg:col-span-2">
          <Card className="clinical-card h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Live Transcript</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <div className="bg-muted/50 rounded-sm p-4 flex-grow h-0 overflow-y-auto space-y-4">
                {conversation.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4" />
                    <p className="font-semibold">The meeting has not started yet.</p>
                    <p className="text-sm">The transcript of your conversation with the patient will appear here.</p>
                  </div>
                )}
                {conversation.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${message.speaker === 'patient' ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-2 rounded-full ${ message.speaker === 'bot' ? 'bg-primary text-primary-foreground' : message.speaker === 'patient' ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {message.speaker === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${message.speaker === 'patient' ? 'text-right' : ''}`}>
                      <div className={`p-3 rounded-sm ${ message.speaker === 'bot' ? 'bg-primary/10 border border-primary/20' : 'bg-green-50 border border-green-200'}`}>
                        <p className="text-sm">{message.content}</p>
                        <span className="text-xs text-muted-foreground mt-1 block">{message.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={conversationEndRef} />
              </div>
              {status === 'in-progress' && (
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" onClick={handleSimulateResponse}>Simulate Patient Response (Demo)</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Tabs */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="summary" disabled={status !== 'completed'}>Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="questions">
              <Card className="clinical-card">
                <CardHeader>
                  <CardTitle className="text-lg">Meeting Questions</CardTitle>
                  <p className="text-sm text-muted-foreground">Add or edit questions for the bot to ask.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['teach-back', 'medication', 'follow-up', 'other'].map(category => (
                    <div key={category}>
                      <h4 className="text-sm font-semibold mb-2 capitalize">{category.replace('-', ' ')} Questions</h4>
                      {questions.filter(q => q.category === category).map(q => (
                        <div key={q.id} className="flex items-center gap-1 text-sm p-1 rounded-md hover:bg-muted/50">
                          {editingQuestionId === q.id ? (
                            <>
                              <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="flex-grow h-8"/>
                              <Button size="icon" variant="ghost" onClick={handleSaveEdit}><Save className="h-4 w-4 text-green-600"/></Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingQuestionId(null)}><X className="h-4 w-4"/></Button>
                            </>
                          ) : (
                            <>
                              <p className="flex-grow">{q.question}</p>
                              <Button size="icon" variant="ghost" onClick={() => handleStartEdit(q)} disabled={status !== 'not-started'}><Edit className="h-4 w-4"/></Button>
                              <Button size="icon" variant="ghost" onClick={() => actions.removeQuestion(q.id)} disabled={status !== 'not-started'}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  <Separator />
                  {status === 'not-started' && (
                    <div className="space-y-2 pt-2">
                      <Input placeholder="Add a new question..." value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
                      <div className="flex justify-between items-center">
                        <Select value={newQuestionCategory} onValueChange={(v) => setNewQuestionCategory(v as any)}>
                          <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teach-back">Teach-Back</SelectItem>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="follow-up">Follow-Up</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddQuestion} size="sm"><Plus className="h-4 w-4 mr-1"/>Add</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="summary">
              <Card className="clinical-card">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5"/>AI Summary</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{summary || "No summary generated."}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Tabs defaultValue="progress" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="progress">Question Progress</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress">
              <Card className="clinical-card">
                <CardHeader>
                  <CardTitle className="text-lg">Meeting Progress & Answers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Status</span>
                      <span className="font-semibold capitalize flex items-center gap-1">
                        {status === 'not-started' && <Clock className="h-4 w-4 text-gray-500" />}
                        {status === 'in-progress' && <div className="h-4 w-4 rounded-full bg-green-400 animate-pulse" />}
                        {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {status.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Questions Answered</span>
                      <span className="font-semibold">{Object.keys(extractedAnswers).length} / {questions.length}</span>
                    </div>
                  </div>
                  
                  {/* Progress Summary */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-xs font-semibold text-blue-700">{questions.filter(q => q.category === 'teach-back').length}</div>
                      <div className="text-xs text-blue-600">Teach-Back</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="text-xs font-semibold text-purple-700">{questions.filter(q => q.category === 'medication').length}</div>
                      <div className="text-xs text-purple-600">Medication</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-xs font-semibold text-green-700">{questions.filter(q => q.category === 'follow-up').length}</div>
                      <div className="text-xs text-green-600">Follow-up</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs font-semibold text-gray-700">{questions.filter(q => q.category === 'other').length}</div>
                      <div className="text-xs text-gray-600">Other</div>
                    </div>
                  </div>
                  
                  <Separator className="my-2"/>
                  <h4 className="font-semibold text-base">Question Progress</h4>
                  
                  {/* Scrollable Questions Container */}
                  <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                    {questions.map((q, index) => {
                      const hasAnswer = extractedAnswers[q.id] && extractedAnswers[q.id] !== "Not discussed";
                      const isWaitingForAnswer = status === 'in-progress' && !hasAnswer;
                      
                      return (
                        <div key={q.id} className={`border rounded-md p-3 transition-all duration-200 ${
                          hasAnswer ? 'bg-green-50 border-green-200' : 
                          isWaitingForAnswer ? 'bg-yellow-50 border-yellow-200' : 
                          'bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-xs font-bold text-gray-400 min-w-[20px]">#{index + 1}</span>
                              <p className="font-medium text-gray-700 text-xs leading-relaxed flex-1">{q.question}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {q.category}
                              </Badge>
                              {hasAnswer && <CheckCircle className="h-4 w-4 text-green-600" />}
                              {isWaitingForAnswer && <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse" />}
                            </div>
                          </div>
                          
                          {/* Answer Section - Always visible */}
                          <div className="mt-2">
                            {hasAnswer ? (
                              <div className="p-2 bg-white border-l-4 border-green-500 rounded-r">
                                <p className="text-xs font-medium text-green-800">
                                  {extractedAnswers[q.id]}
                                </p>
                              </div>
                            ) : status === 'completed' ? (
                              <div className="p-2 bg-gray-100 border-l-4 border-gray-400 rounded-r">
                                <p className="text-xs text-gray-600 italic">No answer recorded</p>
                              </div>
                            ) : status === 'in-progress' ? (
                              <div className="p-2 bg-yellow-100 border-l-4 border-yellow-400 rounded-r">
                                <p className="text-xs text-yellow-800 italic">Waiting for patient response...</p>
                              </div>
                            ) : (
                              <div className="p-2 bg-gray-100 border-l-4 border-gray-300 rounded-r">
                                <p className="text-xs text-gray-500 italic">Question will be asked during meeting</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="availability">
              <Card className="clinical-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5"/>
                    Patient Availability
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Follow-up scheduling and availability information.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {questions.filter(q => q.category === 'follow-up').length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No follow-up questions configured.</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium">Availability Questions</span>
                        <Badge variant="outline" className="text-xs">
                          {questions.filter(q => q.category === 'follow-up' && extractedAnswers[q.id] && extractedAnswers[q.id] !== "Not discussed").length} / {questions.filter(q => q.category === 'follow-up').length} answered
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {questions.filter(q => q.category === 'follow-up').map(q => {
                          const hasAvailability = extractedAnswers[q.id] && extractedAnswers[q.id] !== "Not discussed";
                          return (
                            <div key={q.id} className={`border rounded-md p-3 ${
                              hasAvailability ? 'bg-green-50 border-green-200' : 
                              status === 'in-progress' ? 'bg-blue-50 border-blue-200' : 
                              'bg-gray-50'
                            }`}>
                              <p className="text-sm font-medium text-gray-800 mb-2">{q.question}</p>
                              {hasAvailability ? (
                                <div className="bg-white p-3 rounded border-l-4 border-green-500">
                                  <p className="text-sm font-medium text-green-800">
                                    {extractedAnswers[q.id]}
                                  </p>
                                </div>
                              ) : status === 'completed' ? (
                                <div className="bg-gray-100 p-3 rounded border-l-4 border-gray-400">
                                  <p className="text-sm text-gray-600 italic">No availability information provided</p>
                                </div>
                              ) : status === 'in-progress' ? (
                                <div className="bg-blue-100 p-3 rounded border-l-4 border-blue-400">
                                  <p className="text-sm text-blue-700 italic">Listening for availability details...</p>
                                </div>
                              ) : (
                                <div className="bg-gray-100 p-3 rounded border-l-4 border-gray-300">
                                  <p className="text-sm text-gray-600 italic">Will be asked during meeting</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}