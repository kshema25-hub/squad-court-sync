import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type AdminBooking = Tables<'bookings'> & {
  court?: Tables<'courts'> | null;
  equipment?: Tables<'equipment'> | null;
  class?: Tables<'classes'> | null;
  profile?: Tables<'profiles'> | null;
};

export function useAllPendingBookings() {
  return useQuery({
    queryKey: ['admin', 'bookings', 'pending'],
    queryFn: async () => {
      // Fetch bookings with related data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(*),
          equipment:equipment(*),
          class:classes(*)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Get unique user IDs and fetch their profiles
      const userIds = [...new Set(bookingsData.map(b => b.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to bookings
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const bookingsWithProfiles = bookingsData.map(booking => ({
        ...booking,
        profile: profilesMap.get(booking.user_id) || null,
      }));

      return bookingsWithProfiles as AdminBooking[];
    },
  });
}

export function useApproveBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking approved!');
    },
    onError: (error: Error) => {
      toast.error('Failed to approve booking', {
        description: error.message,
      });
    },
  });
}

export function useRejectBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.error('Booking rejected');
    },
    onError: (error: Error) => {
      toast.error('Failed to reject booking', {
        description: error.message,
      });
    },
  });
}

export function useBulkApproveBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingIds: string[]) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .in('id', bookingIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('All pending bookings approved!');
    },
    onError: (error: Error) => {
      toast.error('Failed to approve bookings', {
        description: error.message,
      });
    },
  });
}
