import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Shield,
  Clock,
  Activity,
  Users,
  FileText,
  Stethoscope
} from 'lucide-react';

interface EHRConnection {
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: Date;
  system: string;
  version: string;
  recordsCount: number;
  patientsCount: number;
  lastActivity: Date;
}

interface DataSource {
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: Date;
  recordCount: number;
  icon: React.ReactNode;
}

export default function EHRConnectionStatus() {
  const [ehrConnection, setEhrConnection] = useState<EHRConnection>({
    status: 'connected',
    lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    system: 'Epic FHIR',
    version: 'R4',
    recordsCount: 15847,
    patientsCount: 234,
    lastActivity: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
  });

  const [dataSources] = useState<DataSource[]>([
    {
      name: 'Patient Demographics',
      type: 'FHIR Patient Resource',
      status: 'active',
      lastUpdate: new Date(Date.now() - 3 * 60 * 1000),
      recordCount: 234,
      icon: <Users className="h-4 w-4" />
    },
    {
      name: 'Clinical Conditions',
      type: 'FHIR Condition Resource',
      status: 'active',
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
      recordCount: 1562,
      icon: <Stethoscope className="h-4 w-4" />
    },
    {
      name: 'Medications',
      type: 'FHIR MedicationRequest',
      status: 'active',
      lastUpdate: new Date(Date.now() - 4 * 60 * 1000),
      recordCount: 3421,
      icon: <FileText className="h-4 w-4" />
    },
    {
      name: 'Observations & Labs',
      type: 'FHIR Observation Resource',
      status: 'active',
      lastUpdate: new Date(Date.now() - 6 * 60 * 1000),
      recordCount: 8934,
      icon: <Activity className="h-4 w-4" />
    },
    {
      name: 'Encounters',
      type: 'FHIR Encounter Resource', 
      status: 'active',
      lastUpdate: new Date(Date.now() - 7 * 60 * 1000),
      recordCount: 1696,
      icon: <Database className="h-4 w-4" />
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshConnection = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setEhrConnection(prev => ({
        ...prev,
        lastSync: new Date(),
        lastActivity: new Date()
      }));
      setIsRefreshing(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'syncing':
        return 'text-blue-600 bg-blue-100';
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
      case 'disconnected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1">EHR Integration Status</h1>
          <p className="text-muted-foreground">Real-time connection to Epic EMR system</p>
        </div>
        <Button 
          onClick={refreshConnection}
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Overview */}
        <div className="lg:col-span-2">
          <Card className="clinical-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Epic EMR Connection
                </CardTitle>
                <Badge className={getStatusColor(ehrConnection.status)}>
                  {getStatusIcon(ehrConnection.status)}
                  {ehrConnection.status.charAt(0).toUpperCase() + ehrConnection.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted/50 rounded-sm">
                  <div className="text-2xl font-bold text-primary">{ehrConnection.recordsCount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-sm">
                  <div className="text-2xl font-bold text-primary">{ehrConnection.patientsCount}</div>
                  <div className="text-sm text-muted-foreground">Active Patients</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-sm">
                  <div className="text-2xl font-bold text-primary">{ehrConnection.version}</div>
                  <div className="text-sm text-muted-foreground">FHIR Version</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-sm">
                  <div className="text-2xl font-bold text-primary">99.8%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Last Sync:</span>
                  </div>
                  <span className="text-sm font-medium">{formatTimeAgo(ehrConnection.lastSync)}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Last Activity:</span>
                  </div>
                  <span className="text-sm font-medium">{formatTimeAgo(ehrConnection.lastActivity)}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Security Status:</span>
                  </div>
                  <Badge variant="outline" className="text-green-600 bg-green-50">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    HIPAA Compliant
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card className="clinical-card mt-6">
            <CardHeader>
              <CardTitle>FHIR Data Sources</CardTitle>
              <p className="text-sm text-muted-foreground">Real-time data streams from Epic EMR</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataSources.map((source, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-sm">
                          {source.icon}
                        </div>
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm text-muted-foreground">{source.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(source.status)}
                          <span className="text-sm font-medium">{source.recordCount.toLocaleString()} records</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {formatTimeAgo(source.lastUpdate)}
                        </div>
                      </div>
                    </div>
                    {index < dataSources.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connection Details Sidebar */}
        <div className="space-y-4">
          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>System:</span>
                <span className="font-semibold">{ehrConnection.system}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Version:</span>
                <span className="font-semibold">{ehrConnection.version}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Endpoint:</span>
                <span className="font-semibold text-xs">fhir.epic.com</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Protocol:</span>
                <span className="font-semibold">HTTPS/TLS 1.3</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span>OAuth Status:</span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Authenticated
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-lg">Integration Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Response Time</span>
                  <span className="text-sm font-semibold text-green-600">127ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-semibold text-green-600">99.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daily API Calls</span>
                  <span className="text-sm font-semibold">2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Limit</span>
                  <span className="text-sm font-semibold">5,000/hour</span>
                </div>
                <Separator />
                <Button className="w-full clinical-button-secondary" size="sm">
                  View Detailed Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="clinical-card">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Sync
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Export Data Map
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}