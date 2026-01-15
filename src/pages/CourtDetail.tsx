import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { generateTimeSlots, sportIcons } from '@/lib/data';
import { useCourt } from '@/hooks/useResources';
import { useUserClass } from '@/hooks/useClasses';
import { useCreateCourtBooking } from '@/hooks/useBookingMutations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  MapPin, 
  Users, 
  Clock, 
  Check, 
  X,
  CalendarDays,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addHours, parse } from 'date-fns';

const CourtDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: court, isLoading: courtLoading } = useCourt(id);
  const { data: userClass } = useUserClass(user?.id);
  const createBooking = useCreateCourtBooking();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingType, setBookingType] = useState<'individual' | 'class'>('individual');
  
  const timeSlots = selectedDate ? generateTimeSlots(format(selectedDate, 'yyyy-MM-dd')) : [];

  if (courtLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!court) {
    return (
      <DashboardLayout title="Court Not Found" subtitle="">
        <div className="text-center py-16">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Court not found
          </h2>
          <Link to="/courts">
            <Button variant="hero">Back to Courts</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const handleBooking = async () => {
    if (!selectedSlot || !selectedDate || !user) {
      toast.error('Please select a time slot');
      return;
    }

    // Parse the time slot and create start/end times
    const startTime = parse(selectedSlot, 'h:mm a', selectedDate);
    const endTime = addHours(startTime, 1); // Assuming 1-hour slots

    await createBooking.mutateAsync({
      courtId: court.id,
      userId: user.id,
      classId: bookingType === 'class' && userClass ? userClass.id : undefined,
      bookingType,
      startTime,
      endTime,
    });

    navigate('/bookings');
  };

  return (
    <DashboardLayout title={court.name} subtitle={court.location}>
      {/* Back button */}
      <Link to="/courts" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Courts
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Court Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Court image */}
          <div className="relative h-64 bg-secondary rounded-2xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <span className="text-8xl">{sportIcons[court.sport] || '🏟️'}</span>
            </div>
            <div className="absolute top-3 right-3">
              <Badge className={court.is_available ? 'bg-success/90' : 'bg-destructive/90'}>
                {court.is_available ? <><Check className="w-3 h-3 mr-1" /> Available</> : <><X className="w-3 h-3 mr-1" /> Booked</>}
              </Badge>
            </div>
          </div>

          {/* Details card */}
          <div className="bg-gradient-card rounded-xl p-5 border border-border space-y-4">
            <h3 className="font-display font-semibold text-foreground">Court Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-foreground">{court.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-foreground">Up to {court.capacity} players</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-foreground">{court.sport}</span>
              </div>
            </div>

            {court.amenities && court.amenities.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Features</p>
                <div className="flex flex-wrap gap-1.5">
                  {court.amenities.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Booking Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Calendar and Time Slots */}
          <div className="bg-gradient-card rounded-xl p-6 border border-border">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Select Date & Time
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-lg border border-border bg-secondary p-3"
                />
              </div>

              {/* Time Slots */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                </p>
                
                <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => slot.available && setSelectedSlot(slot.time)}
                      disabled={!slot.available}
                      className={`
                        p-2 rounded-lg text-sm font-medium transition-all
                        ${slot.available 
                          ? selectedSlot === slot.time
                            ? 'bg-primary text-primary-foreground shadow-glow'
                            : 'bg-secondary hover:bg-muted text-foreground'
                          : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
                        }
                      `}
                    >
                      <Clock className="w-3 h-3 mx-auto mb-1" />
                      {slot.time}
                      {!slot.available && (
                        <span className="block text-[10px] opacity-70">
                          {slot.bookingType === 'class' ? 'Class' : 'Booked'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Type */}
          <div className="bg-gradient-card rounded-xl p-6 border border-border">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Booking Type
            </h3>

            <RadioGroup
              value={bookingType}
              onValueChange={(v) => setBookingType(v as 'individual' | 'class')}
              className="grid md:grid-cols-2 gap-4"
            >
              <div className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingType === 'individual' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                <RadioGroupItem value="individual" id="individual" className="mr-3" />
                <Label htmlFor="individual" className="cursor-pointer flex-1">
                  <div className="font-semibold text-foreground">Individual Booking</div>
                  <div className="text-sm text-muted-foreground">Book for yourself only</div>
                </Label>
              </div>
              
              <div className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingType === 'class' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                <RadioGroupItem value="class" id="class" className="mr-3" disabled={!userClass} />
                <Label htmlFor="class" className="cursor-pointer flex-1">
                  <div className="font-semibold text-foreground">Class Booking</div>
                  <div className="text-sm text-muted-foreground">
                    {userClass ? `Book for ${userClass.name}` : 'No class assigned'}
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Summary & Submit */}
          <div className="bg-gradient-card rounded-xl p-6 border border-border">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              Booking Summary
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Court</span>
                <span className="font-medium text-foreground">{court.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sport</span>
                <span className="font-medium text-foreground">{court.sport}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">
                  {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">{selectedSlot || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Booking Type</span>
                <span className="font-medium text-foreground">
                  {bookingType === 'class' && userClass ? userClass.name : 'Individual'}
                </span>
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleBooking}
              disabled={!selectedSlot || !selectedDate || createBooking.isPending}
            >
              {createBooking.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Confirm Booking'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default CourtDetail;
