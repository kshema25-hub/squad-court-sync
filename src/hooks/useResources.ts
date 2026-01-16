import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { format, startOfDay, endOfDay, parseISO, addHours } from 'date-fns';

export type Court = Tables<'courts'>;
export type Equipment = Tables<'equipment'>;
export type Booking = Tables<'bookings'>;

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  bookedBy?: string;
  bookingType?: 'individual' | 'class';
}

export function useCourts() {
  return useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Court[];
    },
  });
}

export function useCourt(id: string | undefined) {
  return useQuery({
    queryKey: ['courts', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Court | null;
    },
    enabled: !!id,
  });
}

export function useCourtBookings(courtId: string | undefined, date: Date | undefined) {
  const dateStr = date ? format(date, 'yyyy-MM-dd') : null;
  
  return useQuery({
    queryKey: ['court-bookings', courtId, dateStr],
    queryFn: async () => {
      if (!courtId || !date) return [];
      
      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*, class:classes(name)')
        .eq('court_id', courtId)
        .eq('resource_type', 'court')
        .in('status', ['pending', 'approved'])
        .gte('start_time', dayStart)
        .lte('start_time', dayEnd);

      if (error) throw error;
      return data;
    },
    enabled: !!courtId && !!date,
  });
}

// Generate time slots with real availability based on existing bookings
export function generateTimeSlotsWithBookings(
  date: Date,
  bookings: Array<{ start_time: string; end_time: string; booking_type: string }> = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startHour = 6; // 6 AM
  const endHour = 22; // 10 PM

  for (let hour = startHour; hour < endHour; hour++) {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);
    
    const slotEnd = addHours(slotTime, 1);
    
    // Check if this slot overlaps with any booking
    const conflictingBooking = bookings.find(booking => {
      const bookingStart = parseISO(booking.start_time);
      const bookingEnd = parseISO(booking.end_time);
      
      // Check for overlap: slot overlaps if it starts before booking ends AND ends after booking starts
      return slotTime < bookingEnd && slotEnd > bookingStart;
    });
    
    const timeString = format(slotTime, 'h:mm a');
    
    slots.push({
      id: `slot-${hour}`,
      time: timeString,
      available: !conflictingBooking,
      bookingType: conflictingBooking?.booking_type as 'individual' | 'class' | undefined,
    });
  }

  return slots;
}

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Equipment[];
    },
  });
}

export function useAvailableCourtsCount() {
  return useQuery({
    queryKey: ['courts', 'available-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('courts')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true);

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useAvailableEquipmentCount() {
  return useQuery({
    queryKey: ['equipment', 'available-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .gt('available_quantity', 0);

      if (error) throw error;
      return count || 0;
    },
  });
}
