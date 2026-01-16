import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { format, startOfDay, endOfDay, parseISO, addHours, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

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

export interface DayBookingInfo {
  date: Date;
  bookingCount: number;
  hasClassBooking: boolean;
  isFullyBooked: boolean;
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

// Fetch all bookings for a court within a month range for calendar indicators
export function useCourtMonthBookings(courtId: string | undefined, month: Date | undefined) {
  const monthStr = month ? format(month, 'yyyy-MM') : null;
  
  return useQuery({
    queryKey: ['court-month-bookings', courtId, monthStr],
    queryFn: async () => {
      if (!courtId || !month) return [];
      
      const monthStart = startOfMonth(month).toISOString();
      const monthEnd = endOfMonth(month).toISOString();
      
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, booking_type')
        .eq('court_id', courtId)
        .eq('resource_type', 'court')
        .in('status', ['pending', 'approved'])
        .gte('start_time', monthStart)
        .lte('start_time', monthEnd);

      if (error) throw error;
      return data;
    },
    enabled: !!courtId && !!month,
  });
}

// Get dates with bookings for calendar highlighting
export function getDatesWithBookings(
  bookings: Array<{ start_time: string; booking_type: string }> = []
): { bookedDates: Date[]; classBookedDates: Date[]; partiallyBookedDates: Date[] } {
  const dateBookingsMap = new Map<string, { count: number; hasClass: boolean }>();
  const totalSlotsPerDay = 16; // 6 AM to 10 PM = 16 slots
  
  bookings.forEach(booking => {
    const bookingDate = parseISO(booking.start_time);
    const dateKey = format(bookingDate, 'yyyy-MM-dd');
    
    const existing = dateBookingsMap.get(dateKey) || { count: 0, hasClass: false };
    dateBookingsMap.set(dateKey, {
      count: existing.count + 1,
      hasClass: existing.hasClass || booking.booking_type === 'class',
    });
  });
  
  const bookedDates: Date[] = [];
  const classBookedDates: Date[] = [];
  const partiallyBookedDates: Date[] = [];
  
  dateBookingsMap.forEach((info, dateKey) => {
    const date = parseISO(dateKey);
    
    if (info.count >= totalSlotsPerDay) {
      bookedDates.push(date);
    } else if (info.hasClass) {
      classBookedDates.push(date);
    } else if (info.count > 0) {
      partiallyBookedDates.push(date);
    }
  });
  
  return { bookedDates, classBookedDates, partiallyBookedDates };
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
