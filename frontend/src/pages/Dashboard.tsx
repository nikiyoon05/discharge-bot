import { useRecoilValue } from 'recoil';
import { currentPatientState, notificationState, dashboardState } from '@/store/atoms';
import { FileText, Globe, Pill, Calendar, MessageSquare, TrendingUp, Users, Database, Phone, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/common/BackButton';

export default function Dashboard() {
  const patient = useRecoilValue(currentPatientState);
  const notifications = useRecoilValue(notificationState);
  const dashboard = useRecoilValue(dashboardState);
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Patient EHR Chart',
      description: 'View patient\'s Epic EMR data and discharge readiness',
      icon: Database,
      path: `/patient/${patient?.id}/ehr-status`,
      color: 'bg-cyan-500',
      status: dashboard['patient-ehr-chart'],
      category: 'clinical'
    },
    {
      title: 'Pre-Discharge Meeting',
      description: 'AI-powered conversation to gather patient preferences',
      icon: Users,
      path: `/patient/${patient?.id}/discharge-meeting`,
      color: 'bg-indigo-500',
      status: dashboard['pre-discharge-meeting'],
      category: 'pre-discharge'
    },
    {
      title: 'Out-of-Network Scheduling',
      description: 'AI bot calls external providers for appointments',
      icon: Phone,
      path: `/patient/${patient?.id}/out-of-network-scheduling`,
      color: 'bg-emerald-500',
      status: dashboard['out-of-network-scheduling'],
      category: 'follow-up'
    },
    {
      title: 'Patient Instructions',
      description: 'Generate patient-friendly discharge instructions',
      icon: Globe,
      path: `/patient/${patient?.id}/instructions`,
      color: 'bg-green-500',
      status: dashboard['patient-instructions'],
      category: 'education'
    },
    {
      title: 'Call Center',
      description: 'AI-powered calling for insurance, transportation, and family coordination',
      icon: Phone,
      path: `/patient/${patient?.id}/call-center`,
      color: 'bg-blue-500',
      status: 'coming-soon',
      category: 'coordination'
    },
    {
      title: 'Post-Discharge Chat',
      description: 'Communicate with patient post-discharge via AI-powered chat',
      icon: MessageSquare,
      path: `/patient/${patient?.id}/post-discharge-chat`,
      color: 'bg-teal-500',
      status: dashboard['post-discharge-chat'] || 'not-started',
      category: 'follow-up'
    }
  ];

  const recentActivity = [
    {
      action: 'Pre-discharge meeting completed - patient availability captured',
      time: '15 minutes ago',
      status: 'completed'
    },
    {
      action: 'Patient EHR chart synchronized - 47 clinical records loaded',
      time: '20 minutes ago',
      status: 'completed'
    },
    {
      action: 'AI bot attempted to call Northwest Primary Care - busy',
      time: '45 minutes ago',
      status: 'failed'
    },
    {
      action: 'Discharge summary draft generated from Epic data',
      time: '1 hour ago',
      status: 'completed'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <BackButton to="/patients" label="Back to Patients" />
      
      {/* Header */}
      <div>
        <h1 className="clinical-h1">Dashboard</h1>
        <p className="clinical-body text-muted-foreground mt-2">
          Manage discharge workflow for {patient?.name} (Room {patient?.room})
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Length of Stay</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient?.los} days</div>
            <p className="text-xs text-muted-foreground">
              Admitted {patient?.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.pendingApprovals + (notifications.unreadMessages > 0 ? 1 : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Actions required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workflow Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Discharge planning in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Unread patient messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="clinical-h2 mb-4">AI-Powered Discharge Workflow</h2>
        <p className="text-muted-foreground mb-6">
          Streamlined discharge planning with Epic EMR integration and AI automation
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="clinical-card-hover cursor-pointer flex flex-col justify-between h-full">
              <CardHeader className="flex flex-row items-start space-y-0 pb-2">
                <div className={`p-2 rounded-lg ${action.color} mr-4 flex-shrink-0`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="clinical-small text-left">{action.title}</CardTitle>
                    <Badge 
                      variant={action.status === 'connected' || action.status === 'generated' || action.status === 'scheduled' || action.status === 'completed' ? 'default' : 'secondary'} 
                      className={`ml-2 flex-shrink-0 ${
                        action.status === 'connected' || action.status === 'generated' || action.status === 'scheduled' || action.status === 'completed' 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : ''
                      }`}
                    >
                      {action.status.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">{action.description}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => navigate(action.path)}
                  size="sm"
                  className="clinical-button-primary w-full"
                >
                  {action.status === 'completed' || action.status === 'connected' || action.status === 'scheduled' || action.status === 'generated' ? 'View' : 'Start'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-clinical-success' : 'bg-clinical-warning'
                  }`} />
                  <div className="flex-1">
                    <p className="clinical-small">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge 
                    variant={activity.status === 'completed' ? 'secondary' : 'outline'}
                    className={activity.status === 'completed' ? 'status-success' : 'status-warning'}
                  >
                    {activity.status === 'completed' ? 'Done' : 'In Progress'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="clinical-small font-medium">Primary Diagnosis</p>
                <p className="text-sm text-muted-foreground">{patient?.primaryDiagnosis}</p>
              </div>
              <div>
                <p className="clinical-small font-medium">Unit</p>
                <p className="text-sm text-muted-foreground">{patient?.unit}</p>
              </div>
              <div>
                <p className="clinical-small font-medium">Allergies</p>
                <p className="text-sm text-muted-foreground">
                  {patient?.allergies?.length > 0 ? patient.allergies.join(', ') : 'None recorded'}
                </p>
              </div>
              <div>
                <p className="clinical-small font-medium">Length of Stay</p>
                <p className="text-sm text-muted-foreground">{patient?.los} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
