import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Booking = Tables<'bookings'> & {
  court?: Tables<'courts'> | null;
  equipment?: Tables<'equipment'> | null;
  class?: Tables<'classes'> | null;
};

export function useUserBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(*),
          equipment:equipment(*),
          class:classes(*)
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!userId,
  });
}

export function useUpcomingBookings(userId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', 'upcoming', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          court:courts(*),
          equipment:equipment(*),
          class:classes(*)
        `)
        .eq('user_id', userId)
        .gte('start_time', now)
        .in('status', ['pending', 'approved'])
        .order('start_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!userId,
  });
}

export function useBookingStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', 'stats', userId],
    queryFn: async () => {
      if (!userId) return { activeBookings: 0, equipmentIssued: 0, hoursBooked: 0, pendingFees: 0 };
      
      const now = new Date().toISOString();
      
      // Get active bookings count
      const { count: activeBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_time', now)
        .in('status', ['pending', 'approved']);

      // Get equipment issued count
      const { count: equipmentIssued } = await supabase
        .from('equipment_issues')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('returned_at', null);

      // Get total hours booked this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthBookings } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('user_id', userId)
        .gte('start_time', startOfMonth.toISOString())
        .in('status', ['approved', 'completed']);

      let hoursBooked = 0;
      if (monthBookings) {
        monthBookings.forEach((booking) => {
          const start = new Date(booking.start_time);
          const end = new Date(booking.end_time);
          hoursBooked += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        });
      }

      // Get pending fees
      const { data: fees } = await supabase
        .from('equipment_issues')
        .select('delay_fee')
        .eq('user_id', userId)
        .gt('delay_fee', 0);

      const pendingFees = fees?.reduce((sum, f) => sum + (f.delay_fee || 0), 0) || 0;

      return {
        activeBookings: activeBookings || 0,
        equipmentIssued: equipmentIssued || 0,
        hoursBooked: Math.round(hoursBooked),
        pendingFees,
      };
    },
    enabled: !!userId,
  });
}
