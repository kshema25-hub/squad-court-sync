import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { EquipmentCard } from '@/components/equipment/EquipmentCard';
import { useEquipment } from '@/hooks/useResources';
import { useUserClass } from '@/hooks/useClasses';
import { useCreateEquipmentBooking } from '@/hooks/useBookingMutations';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Search, Package, Loader2, Clock, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { format, addHours, parse, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type Equipment = Tables<'equipment'>;

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

// Hook to fetch equipment bookings for a specific date
function useEquipmentBookings(equipmentId: string | undefined, date: Date | undefined) {
  const dateStr = date ? format(date, 'yyyy-MM-dd') : null;

  return useQuery({
    queryKey: ['equipment-bookings', equipmentId, dateStr],
    queryFn: async () => {
      if (!equipmentId || !date) return [];

      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();

      // Find bookings that overlap with this day (not just start on this day)
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('equipment_id', equipmentId)
        .eq('resource_type', 'equipment')
        .in('status', ['pending', 'approved'])
        .lt('start_time', dayEnd)
        .gt('end_time', dayStart);

      if (error) throw error;
      return data;
    },
    enabled: !!equipmentId && !!date,
  });
}

// Generate time slots for equipment based on existing bookings
function generateEquipmentTimeSlots(
  date: Date,
  bookings: Array<{ start_time: string; end_time: string }> = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 6;
  const endHour = 22;

  for (let hour = startHour; hour < endHour; hour++) {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    const slotEnd = addHours(slotTime, 1);

    const isBooked = bookings.some((booking) => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return slotTime < bookingEnd && slotEnd > bookingStart;
    });

    slots.push({
      id: `slot-${hour}`,
      time: format(slotTime, 'h:mm a'),
      available: !isBooked,
    });
  }

  return slots;
}

const EquipmentPage = () => {
  const { user } = useAuth();
  const { data: equipment = [], isLoading } = useEquipment();
  const { data: userClass } = useUserClass(user?.id);
  const createBooking = useCreateEquipmentBooking();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: existingBookings, isLoading: bookingsLoading } = useEquipmentBookings(
    selectedEquipment?.id,
    selectedDate
  );

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return generateEquipmentTimeSlots(selectedDate, existingBookings || []);
  }, [selectedDate, existingBookings]);

  const categories = [...new Set(equipment.map((e) => e.category))];

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRequest = (item: Equipment) => {
    if (!userClass) {
      toast.error('You must be assigned to a class to request equipment');
      return;
    }
    setSelectedEquipment(item);
    setQuantity(1);
    setSelectedDate(new Date());
    setSelectedSlot(null);
  };

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const submitRequest = async () => {
    if (!selectedEquipment || !user || !userClass || !selectedDate || !selectedSlot) return;

    const startTime = parse(selectedSlot, 'h:mm a', selectedDate);
    const endTime = addHours(startTime, 1);

    await createBooking.mutateAsync({
      equipmentId: selectedEquipment.id,
      userId: user.id,
      classId: userClass.id,
      bookingType: 'class',
      quantity,
      startTime,
      endTime,
    });

    setSelectedEquipment(null);
  };

  return (
    <DashboardLayout
      title="Sports Equipment"
      subtitle="Request equipment for your class"
    >
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'hero' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'hero' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-muted-foreground mb-6"
      >
        {isLoading ? 'Loading...' : `Showing ${filteredEquipment.length} of ${equipment.length} items`}
      </motion.p>

      {/* Equipment Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((item, index) => (
          <EquipmentCard
            key={item.id}
            equipment={{
              id: item.id,
              name: item.name,
              category: item.category,
              availableQuantity: item.available_quantity,
              totalQuantity: item.total_quantity,
              condition: item.condition,
              image: item.image_url || undefined,
            }}
            index={index}
            onRequest={() => handleRequest(item)}
          />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No equipment found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}

      {/* Request Dialog with Date & Time */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => setSelectedEquipment(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Request {selectedEquipment?.name}
            </DialogTitle>
            <DialogDescription>
              Select a date and time slot to book this equipment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Class Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
              <GraduationCap className="w-5 h-5 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-sm text-foreground">{userClass?.name}</div>
                <div className="text-xs text-muted-foreground">Class booking</div>
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Calendar */}
              <div>
                <Label className="text-foreground mb-2 block">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateChange}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-lg border border-border bg-secondary p-3 pointer-events-auto"
                />
              </div>

              {/* Time Slots */}
              <div>
                <Label className="text-foreground mb-2 block">
                  Select Time {selectedDate && `— ${format(selectedDate, 'MMM d')}`}
                  {bookingsLoading && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
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
                        <span className="block text-[10px] text-destructive font-semibold">
                          Booked
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-foreground">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="font-display text-2xl font-bold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedEquipment?.available_quantity || 1, quantity + 1)
                    )
                  }
                  disabled={quantity >= (selectedEquipment?.available_quantity || 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Summary */}
            {selectedSlot && selectedDate && (
              <div className="p-3 rounded-lg bg-secondary border border-border space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equipment</span>
                  <span className="font-medium text-foreground">{selectedEquipment?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium text-foreground">{format(selectedDate, 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium text-foreground">{selectedSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium text-foreground">{quantity}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedEquipment(null)}
                disabled={createBooking.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={submitRequest}
                disabled={!selectedSlot || !selectedDate || createBooking.isPending}
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EquipmentPage;
