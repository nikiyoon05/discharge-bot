import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Globe, Pill, Calendar, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: 'AI-Powered Discharge Summaries',
      description: 'Generate and edit comprehensive discharge summaries with AI assistance and side-by-side diff review.'
    },
    {
      icon: Globe,
      title: 'Patient-Friendly Instructions',
      description: 'Create instructions tailored to patient literacy level and preferred language with readability scoring.'
    },
    {
      icon: Pill,
      title: 'Medication Reconciliation',
      description: 'Streamline medication management with drag-and-drop reconciliation and conflict detection.'
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Book follow-up appointments with integrated calendar view and automated patient communication.'
    }
  ];

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    // In a real app, check authentication status here
    // For demo purposes, we'll show the landing page
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-hospital-light via-background to-accent/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">CE</span>
            </div>
            <div>
              <h1 className="clinical-h2 text-primary">CareExit</h1>
              <p className="text-xs text-muted-foreground">Discharge Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="status-success">
              <Shield className="h-3 w-3 mr-1" />
              HIPAA Compliant
            </Badge>
            <Button onClick={() => navigate('/patients')} className="clinical-button-primary">
              View Patient Census
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Stethoscope className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-primary mb-6">
            Streamline Hospital Discharge
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            CareExit is a comprehensive discharge management system designed for physicians and nurses. 
            Reduce discharge time, improve patient safety, and enhance care coordination.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button onClick={() => navigate('/patients')} size="lg" className="clinical-button-primary">
              View Patient Census
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="clinical-card-hover text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="clinical-small">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="clinical-card bg-primary/5 border-primary/20 text-center py-12">
          <h2 className="clinical-h2 text-primary mb-8">Proven Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">35%</p>
              <p className="clinical-small text-muted-foreground">Faster Discharge Process</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">60%</p>
              <p className="clinical-small text-muted-foreground">Reduction in Medication Errors</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">90%</p>
              <p className="clinical-small text-muted-foreground">Patient Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="clinical-small text-muted-foreground">
            CareExit Discharge Management System • Built for Healthcare Professionals
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Demo Version • Not for Production Use
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
