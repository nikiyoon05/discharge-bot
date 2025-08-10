import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentPatientState, dashboardState } from '@/store/atoms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Phone, 
  PhoneCall,
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Users, 
  Globe,
  CreditCard,
  Car,
  Home,
  FileText,
  Shield,
  Calendar,
  User,
  MessageSquare,
  Bot,
  Headphones,
  PhoneOutgoing,
  PhoneIncoming,
  Timer,
  MapPin,
  Building,
  Heart
} from 'lucide-react';
import BackButton from '@/components/common/BackButton';
import { toast } from 'react-hot-toast';

interface CallTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'pending' | 'failed' | 'scheduled';
  category: 'workflow' | 'transportation' | 'insurance' | 'family' | 'providers';
  icon: React.ComponentType<any>;
  required: boolean;
  estimatedDuration: string;
  phoneNumber?: string;
  contactName?: string;
  lastAttempt?: string;
  nextAttempt?: string;
  notes?: string;
}

export default function CallCenterPage() {
  const { id } = useParams();
  const patient = useRecoilValue(currentPatientState);
  const dashboard = useRecoilValue(dashboardState);
  const setDashboardState = useSetRecoilState(dashboardState);

  const getWorkflowStatus = (dashboardKey: string) => {
    const status = dashboard[dashboardKey];
    if (status === 'connected' || status === 'completed' || status === 'ready') return 'completed';
    if (status === 'in-progress') return 'in-progress';
    return 'pending';
  };

  const [callTasks, setCallTasks] = useState<CallTask[]>([
    // Core Workflow Items (from dashboard - read-only status)
    {
      id: 'ehr-chart',
      title: 'EHR Data Review',
      description: 'Epic EMR data synchronized and reviewed',
      priority: 'high',
      status: getWorkflowStatus('patient-ehr-chart'),
      category: 'workflow',
      icon: Database,
      required: true,
      estimatedDuration: 'Complete'
    },
    {
      id: 'pre-discharge-meeting',
      title: 'Patient Interview',
      description: 'Pre-discharge preferences captured',
      priority: 'high',
      status: getWorkflowStatus('pre-discharge-meeting'),
      category: 'workflow',
      icon: Users,
      required: true,
      estimatedDuration: 'Complete'
    },
    {
      id: 'out-of-network-scheduling',
      title: 'Provider Scheduling',
      description: 'Follow-up appointments scheduled',
      priority: 'high',
      status: getWorkflowStatus('out-of-network-scheduling'),
      category: 'workflow',
      icon: Calendar,
      required: true,
      estimatedDuration: 'Complete'
    },
    {
      id: 'patient-instructions',
      title: 'Education Materials',
      description: 'Discharge instructions prepared',
      priority: 'high',
      status: getWorkflowStatus('patient-instructions'),
      category: 'workflow',
      icon: Globe,
      required: true,
      estimatedDuration: 'Complete'
    },

    // Transportation Calls (Heavy Focus)
    {
      id: 'transport-home',
      title: 'Discharge Transportation',
      description: 'Arrange safe transport home from hospital',
      priority: 'high',
      status: 'pending',
      category: 'transportation',
      icon: Car,
      required: true,
      estimatedDuration: '5-8 min',
      phoneNumber: '(555) 123-RIDE',
      contactName: 'Metro Medical Transport',
      notes: 'Need wheelchair-accessible vehicle for discharge at 2 PM'
    },
    {
      id: 'transport-followup',
      title: 'Follow-up Transport',
      description: 'Schedule rides to upcoming appointments',
      priority: 'medium',
      status: 'pending',
      category: 'transportation',
      icon: MapPin,
      required: false,
      estimatedDuration: '3-5 min',
      phoneNumber: '(555) 123-RIDE',
      contactName: 'Metro Medical Transport',
      nextAttempt: 'After discharge transport confirmed'
    },
    {
      id: 'transport-insurance',
      title: 'Transport Coverage Verification',
      description: 'Verify insurance covers medical transport',
      priority: 'medium',
      status: 'pending',
      category: 'transportation',
      icon: Shield,
      required: false,
      estimatedDuration: '4-7 min',
      phoneNumber: '(555) 456-7890',
      contactName: 'Blue Cross Medical Benefits'
    },

    // Insurance Calls
    {
      id: 'insurance-verification',
      title: 'Benefits Verification',
      description: 'Confirm coverage for discharge medications and DME',
      priority: 'high',
      status: 'pending',
      category: 'insurance',
      icon: CreditCard,
      required: true,
      estimatedDuration: '8-12 min',
      phoneNumber: '(555) 456-7890',
      contactName: 'Blue Cross Medical Benefits'
    },
    {
      id: 'prior-auth',
      title: 'Prior Authorization',
      description: 'Obtain pre-approval for home oxygen equipment',
      priority: 'medium',
      status: 'scheduled',
      category: 'insurance',
      icon: FileText,
      required: false,
      estimatedDuration: '10-15 min',
      phoneNumber: '(555) 456-7890',
      contactName: 'Blue Cross Prior Auth Dept',
      nextAttempt: 'Tomorrow 9 AM'
    },

    // Family Coordination
    {
      id: 'family-primary',
      title: 'Primary Caregiver',
      description: 'Coordinate with spouse about discharge plan',
      priority: 'high',
      status: 'pending',
      category: 'family',
      icon: Heart,
      required: true,
      estimatedDuration: '3-5 min',
      phoneNumber: '(555) 987-6543',
      contactName: 'Mary Anderson (Spouse)'
    },
    {
      id: 'family-emergency',
      title: 'Emergency Contact',
      description: 'Update son on discharge timeline and care needs',
      priority: 'medium',
      status: 'pending',
      category: 'family',
      icon: User,
      required: false,
      estimatedDuration: '2-4 min',
      phoneNumber: '(555) 234-5678',
      contactName: 'Michael Anderson (Son)'
    },

    // Provider Coordination
    {
      id: 'pcp-handoff',
      title: 'Primary Care Handoff',
      description: 'Brief PCP on discharge plan and follow-up needs',
      priority: 'medium',
      status: 'pending',
      category: 'providers',
      icon: Building,
      required: false,
      estimatedDuration: '5-8 min',
      phoneNumber: '(555) 345-6789',
      contactName: 'Dr. Johnson\'s Office'
    },
    {
      id: 'home-health',
      title: 'Home Health Services',
      description: 'Coordinate nursing visits and PT schedule',
      priority: 'medium',
      status: 'pending',
      category: 'providers',
      icon: Home,
      required: false,
      estimatedDuration: '6-10 min',
      phoneNumber: '(555) 678-9012',
      contactName: 'Caring Hands Home Health'
    }
  ]);

  // Auto-sync workflow items with dashboard state
  useEffect(() => {
    setCallTasks(prev => prev.map(task => {
      if (task.category === 'workflow') {
        const dashboardKey = task.id === 'ehr-chart' ? 'patient-ehr-chart' : 
                           task.id === 'pre-discharge-meeting' ? 'pre-discharge-meeting' :
                           task.id === 'out-of-network-scheduling' ? 'out-of-network-scheduling' :
                           task.id === 'patient-instructions' ? 'patient-instructions' : '';
        
        if (dashboardKey) {
          return { ...task, status: getWorkflowStatus(dashboardKey) };
        }
      }
      return task;
    }));
  }, [dashboard]);

  const initiateCall = async (taskId: string) => {
    const task = callTasks.find(t => t.id === taskId);
    if (!task) return;

    setCallTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'in-progress', lastAttempt: new Date().toLocaleTimeString() } : t
    ));

    toast.success(`AI calling ${task.contactName}...`);
    
    // Simulate call duration
    setTimeout(() => {
      setCallTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'completed' } : t
      ));
      toast.success(`Call completed: ${task.title}`);
    }, 3000);
  };

  const scheduleCall = (taskId: string) => {
    setCallTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'scheduled', nextAttempt: 'Tomorrow 10 AM' } : t
    ));
    toast.info('Call scheduled for tomorrow');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <PhoneCall className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-purple-600" />;
      case 'pending': return <Phone className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Phone className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'in-progress': 'secondary',
      'scheduled': 'outline',
      'pending': 'outline',
      'failed': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="text-xs">
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const categories = [
    { key: 'workflow', title: 'Core Workflow', icon: Database, color: 'border-l-blue-500' },
    { key: 'transportation', title: 'Transportation Coordination', icon: Car, color: 'border-l-orange-500' },
    { key: 'insurance', title: 'Insurance & Benefits', icon: CreditCard, color: 'border-l-purple-500' },
    { key: 'family', title: 'Family Communication', icon: Heart, color: 'border-l-pink-500' },
    { key: 'providers', title: 'Provider Coordination', icon: Building, color: 'border-l-teal-500' }
  ];

  const getStats = () => {
    const total = callTasks.filter(t => t.required).length;
    const completed = callTasks.filter(t => t.required && t.status === 'completed').length;
    const inProgress = callTasks.filter(t => t.status === 'in-progress').length;
    const pending = callTasks.filter(t => t.status === 'pending').length;
    return { completed, total, inProgress, pending, percentage: Math.round((completed / total) * 100) };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <BackButton to={`/patient/${id}/dashboard`} label="Back to Dashboard" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1 flex items-center gap-3">
            <Headphones className="h-8 w-8" />
            AI Call Center
            <Badge variant="outline" className="text-xs bg-blue-50">Coming Soon</Badge>
          </h1>
          <p className="text-muted-foreground">
            AI-powered calling for discharge coordination - {patient?.name}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{stats.completed}/{stats.total}</div>
          <div className="text-sm text-muted-foreground">Critical Calls Complete</div>
          <div className="text-xs text-muted-foreground">{stats.percentage}% Ready</div>
        </div>
      </div>

      {/* Call Center Grid Layout */}
      <div className="grid grid-cols-12 gap-4">
        
        {/* Call Queue Status - Top Left */}
        <Card className="clinical-card col-span-12 md:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PhoneCall className="h-5 w-5" />
              Call Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending Calls</div>
              </div>
              <Progress value={stats.percentage} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{stats.completed}</div>
                  <div className="text-muted-foreground">Done</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">{stats.inProgress}</div>
                  <div className="text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-yellow-600">{stats.pending}</div>
                  <div className="text-muted-foreground">Queue</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Workflow - Top Center/Right */}
        <Card className="clinical-card col-span-12 md:col-span-8 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5" />
              Core Workflow Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {callTasks.filter(task => task.category === 'workflow').map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <Checkbox
                    checked={task.status === 'completed'}
                    disabled={true} // Read-only, auto-synced
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <task.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{task.title}</span>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transportation Calls - Featured Section */}
        <Card className="clinical-card col-span-12 border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5" />
              Transportation Coordination
              <Badge className="bg-orange-100 text-orange-800 text-xs">Priority Focus</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {callTasks.filter(task => task.category === 'transportation').map((task) => (
                <Card key={task.id} className={`border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <task.icon className="h-5 w-5 text-orange-600 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                        {task.contactName && (
                          <p className="text-xs font-medium text-blue-600">{task.contactName}</p>
                        )}
                        {task.phoneNumber && (
                          <p className="text-xs text-muted-foreground">{task.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      {getStatusIcon(task.status)}
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => initiateCall(task.id)}
                        disabled={task.status === 'completed' || task.status === 'in-progress'}
                        className="flex-1 text-xs"
                      >
                        <PhoneOutgoing className="h-3 w-3 mr-1" />
                        Call Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => scheduleCall(task.id)}
                        disabled={task.status === 'completed'}
                        className="text-xs"
                      >
                        <Timer className="h-3 w-3" />
                      </Button>
                    </div>
                    {task.estimatedDuration && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Est. {task.estimatedDuration}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Other Call Categories */}
        {categories.filter(cat => !['workflow', 'transportation'].includes(cat.key)).map(category => {
          const categoryTasks = callTasks.filter(task => task.category === category.key);
          if (categoryTasks.length === 0) return null;

          return (
            <Card key={category.key} className={`clinical-card col-span-12 md:col-span-6 border-l-4 ${category.color}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <category.icon className="h-5 w-5" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {categoryTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <task.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{task.title}</span>
                          {task.required && <Badge variant="outline" className="text-xs">Req</Badge>}
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                      {task.contactName && (
                        <p className="text-xs font-medium text-blue-600 mb-1">{task.contactName}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => initiateCall(task.id)}
                          disabled={task.status === 'completed' || task.status === 'in-progress'}
                          className="text-xs"
                        >
                          <PhoneOutgoing className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scheduleCall(task.id)}
                          disabled={task.status === 'completed'}
                          className="text-xs"
                        >
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

      </div>

      {/* AI Assistant Info */}
      <Card className="clinical-card border-blue-200 bg-blue-50/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Bot className="h-12 w-12 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">AI Call Assistant</h3>
              <p className="text-sm text-blue-700 mb-2">
                Our AI handles all discharge coordination calls automatically. Each call is personalized with patient context and follows up until completion.
              </p>
              <div className="flex gap-4 text-xs text-blue-600">
                <span>• Natural conversation flow</span>
                <span>• Real-time call transcription</span>
                <span>• Automatic follow-up scheduling</span>
                <span>• Integration with Epic EMR</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}