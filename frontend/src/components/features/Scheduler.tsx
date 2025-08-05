import { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { currentPatientState } from '@/store/atoms';
import { fhirService } from '@/services/fhir';
import { telecomService } from '@/services/telecom';
import { Calendar, Clock, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
  provider: string;
  type: string;
}

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  description: string;
}

const appointmentTypes: AppointmentType[] = [
  {
    id: 'follow-up',
    name: 'Post-Discharge Follow-up',
    duration: 30,
    description: 'Standard follow-up visit after hospital discharge'
  },
  {
    id: 'urgent',
    name: 'Urgent Care',
    duration: 20,
    description: 'For acute concerns requiring prompt attention'
  },
  {
    id: 'routine',
    name: 'Routine Check-up',
    duration: 45,
    description: 'Comprehensive routine examination'
  },
  {
    id: 'specialist',
    name: 'Specialist Consultation',
    duration: 60,
    description: 'Consultation with medical specialist'
  }
];

export default function Scheduler() {
  const patient = useRecoilValue(currentPatientState);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedType, setSelectedType] = useState('follow-up');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  useEffect(() => {
    loadAvailableSlots();
  }, [selectedType]);

  const loadAvailableSlots = async () => {
    setIsLoadingSlots(true);
    try {
      // Generate mock available slots for next 14 days
      const slots: TimeSlot[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip weekends for regular appointments
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        // Generate time slots for each day
        const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
        
        timeSlots.forEach((time, index) => {
          // Randomly make some slots unavailable
          const available = Math.random() > 0.3;
          
          slots.push({
            id: `slot-${i}-${index}`,
            date: date.toISOString().split('T')[0],
            time,
            available,
            provider: available ? 'Dr. Martinez' : 'Not Available',
            type: selectedType
          });
        });
      }
      
      setAvailableSlots(slots);
    } catch (error) {
      toast.error('Failed to load available appointments');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setShowConfirmDialog(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) return;
    
    setIsBooking(true);
    try {
      const appointmentData = {
        patientId: patient.id,
        providerId: 'dr-martinez-001',
        startTime: `${selectedSlot.date}T${selectedSlot.time}:00.000Z`,
        serviceType: appointmentTypes.find(t => t.id === selectedType)?.name || 'Follow-up'
      };
      
      const appointment = await fhirService.createAppointment(appointmentData);
      setBookedAppointment(appointment);
      
      // Send confirmation via patient communication preferences
      toast.success('Appointment booked successfully');
      setShowConfirmDialog(false);
      
      // Remove the booked slot from available slots
      setAvailableSlots(prev => prev.filter(slot => slot.id !== selectedSlot.id));
      
    } catch (error) {
      toast.error('Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleVoiceBotCall = async () => {
    try {
      const script = `
        Hello ${patient.name}, this is Bela calling about your discharge appointment scheduling.
        
        We have several appointment options available for your follow-up care:
        - Tomorrow at 2 PM with Dr. Martinez
        - Thursday at 10 AM with Dr. Martinez
        - Friday at 3 PM with Dr. Martinez
        
        Please press 1 to book the first option, 2 for the second, or 3 for the third.
        You can also press 0 to speak with a scheduling coordinator.
        
        Thank you for choosing our healthcare system.
      `;
      
      const result = await telecomService.startVoiceBot('+15551234567', script);
      
      if (result.status === 'initiated') {
        toast.success('Voice bot call initiated - patient will receive automated scheduling call');
      }
    } catch (error) {
      toast.error('Failed to initiate voice bot call');
    }
  };

  const groupSlotsByDate = (slots: TimeSlot[]) => {
    const grouped: { [key: string]: TimeSlot[] } = {};
    
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    
    return grouped;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const groupedSlots = groupSlotsByDate(availableSlots.filter(slot => slot.available));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clinical-h1 flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span>Appointment Scheduler</span>
          </h1>
          <p className="clinical-body text-muted-foreground mt-2">
            Schedule follow-up appointments for post-discharge care
          </p>
        </div>
        
        <Button
          onClick={handleVoiceBotCall}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Phone className="h-4 w-4" />
          <span>Auto-Call Patient</span>
        </Button>
      </div>

      {/* Appointment Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Appointment Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {appointmentTypes.map((type) => (
              <div
                key={type.id}
                className={`clinical-card cursor-pointer transition-all ${
                  selectedType === type.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="clinical-small font-semibold">{type.name}</h4>
                  <Badge variant="outline">{type.duration}min</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Appointment */}
      {bookedAppointment && (
        <Card className="border-clinical-success bg-clinical-success/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-clinical-success">
              <CheckCircle className="h-5 w-5" />
              <span>Appointment Confirmed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="clinical-small font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(bookedAppointment.start).toLocaleDateString()} at{' '}
                  {new Date(bookedAppointment.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="clinical-small font-medium">Provider</p>
                <p className="text-sm text-muted-foreground">
                  {bookedAppointment.participant.find((p: any) => p.actor.reference.includes('Practitioner'))?.actor.display}
                </p>
              </div>
              <div>
                <p className="clinical-small font-medium">Type</p>
                <p className="text-sm text-muted-foreground">
                  {bookedAppointment.serviceType[0].text}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Available Appointments - Next 14 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSlots ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : Object.keys(groupedSlots).length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-clinical-warning mx-auto mb-4" />
              <h3 className="clinical-h2 text-clinical-warning mb-2">No Available Slots</h3>
              <p className="clinical-body text-muted-foreground mb-4">
                All appointments are currently booked for the selected type.
              </p>
              <Button onClick={handleVoiceBotCall} className="clinical-button-primary">
                Call Patient for Alternative Options
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date} className="clinical-card">
                  <h3 className="clinical-small font-semibold mb-3">{formatDate(date)}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={slot.available ? "outline" : "secondary"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => handleSlotSelect(slot)}
                        className={`text-xs ${
                          slot.available 
                            ? 'hover:bg-primary hover:text-primary-foreground' 
                            : 'cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Please confirm the appointment details for {patient.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="clinical-small font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedSlot.date)}</p>
                </div>
                <div>
                  <p className="clinical-small font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">{selectedSlot.time}</p>
                </div>
                <div>
                  <p className="clinical-small font-medium">Provider</p>
                  <p className="text-sm text-muted-foreground">{selectedSlot.provider}</p>
                </div>
                <div>
                  <p className="clinical-small font-medium">Type</p>
                  <p className="text-sm text-muted-foreground">
                    {appointmentTypes.find(t => t.id === selectedType)?.name}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment}
              disabled={isBooking}
              className="clinical-button-primary"
            >
              {isBooking ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}