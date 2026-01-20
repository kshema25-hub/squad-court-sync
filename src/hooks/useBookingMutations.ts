import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateCourtBookingParams {
  courtId: string;
  userId: string;
  classId?: string;
  bookingType: 'individual' | 'class';
  startTime: Date;
  endTime: Date;
  notes?: string;
}

interface CreateEquipmentBookingParams {
  equipmentId: string;
  userId: string;
  classId?: string;
  bookingType: 'individual' | 'class';
  quantity: number;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export function useCreateCourtBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCourtBookingParams) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          court_id: params.courtId,
          user_id: params.userId,
          class_id: params.classId || null,
          booking_type: params.bookingType,
          resource_type: 'court',
          start_time: params.startTime.toISOString(),
          end_time: params.endTime.toISOString(),
          notes: params.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Court booking submitted!', {
        description: 'Your booking is pending approval.',
      });
    },
    onError: (error: Error) => {
      console.error('Booking error:', error);
      toast.error('Failed to create booking', {
        description: error.message,
      });
    },
  });
}

export function useCreateEquipmentBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateEquipmentBookingParams) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          equipment_id: params.equipmentId,
          user_id: params.userId,
          class_id: params.classId || null,
          booking_type: params.bookingType,
          resource_type: 'equipment',
          quantity: params.quantity,
          start_time: params.startTime.toISOString(),
          end_time: params.endTime.toISOString(),
          notes: params.notes || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Equipment request submitted!', {
        description: 'Your request is pending approval.',
      });
    },
    onError: (error: Error) => {
      console.error('Booking error:', error);
      toast.error('Failed to submit request', {
        description: error.message,
      });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['court-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['court-month-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      toast.success('Booking cancelled');
    },
    onError: (error: Error) => {
      toast.error('Failed to cancel booking', {
        description: error.message,
      });
    },
  });
}
