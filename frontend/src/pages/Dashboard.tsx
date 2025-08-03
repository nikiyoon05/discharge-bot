import { useRecoilValue } from 'recoil';
import { currentPatientState, notificationState } from '@/store/atoms';
import { FileText, Globe, Pill, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/common/BackButton';

export default function Dashboard() {
  const patient = useRecoilValue(currentPatientState);
  const notifications = useRecoilValue(notificationState);
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Discharge Summary',
      description: 'Review and edit AI-generated discharge summary',
      icon: FileText,
      path: `/patient/${patient?.id}/summary`,
      color: 'bg-blue-500',
      progress: 75
    },
    {
      title: 'Patient Instructions',
      description: 'Generate patient-friendly discharge instructions',
      icon: Globe,
      path: `/patient/${patient?.id}/instructions`,
      color: 'bg-green-500',
      progress: 0
    },
    {
      title: 'Medication Reconciliation',
      description: 'Reconcile medications across care transitions',
      icon: Pill,
      path: `/patient/${patient?.id}/med-rec`,
      color: 'bg-orange-500',
      progress: 40
    },
    {
      title: 'Schedule Appointment',
      description: 'Book follow-up appointments',
      icon: Calendar,
      path: `/patient/${patient?.id}/schedule`,
      color: 'bg-purple-500',
      progress: 0
    }
  ];

  const recentActivity = [
    {
      action: 'Discharge summary draft generated',
      time: '10 minutes ago',
      status: 'completed'
    },
    {
      action: 'Medication reconciliation started',
      time: '25 minutes ago',
      status: 'in-progress'
    },
    {
      action: 'Patient admitted to unit',
      time: '3 days ago',
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
            <CardTitle className="text-sm font-medium">Discharge Progress</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <Progress value={65} className="mt-2" />
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
        <h2 className="clinical-h2 mb-4">Discharge Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="clinical-card-hover cursor-pointer">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className={`p-2 rounded-lg ${action.color} mr-4`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="clinical-small">{action.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                {action.progress > 0 && (
                  <Badge variant="secondary">{action.progress}% complete</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Progress value={action.progress} className="flex-1 mr-4" />
                  <Button
                    onClick={() => navigate(action.path)}
                    size="sm"
                    className="clinical-button-primary"
                  >
                    {action.progress > 0 ? 'Continue' : 'Start'}
                  </Button>
                </div>
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