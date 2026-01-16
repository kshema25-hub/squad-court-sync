import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to subscribe to real-time booking changes.
 * Automatically invalidates relevant queries when bookings are created, updated, or deleted.
 */
export function useRealtimeBookings() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up real-time booking subscription...');
    
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          console.log('Real-time booking change:', payload.eventType, payload);
          
          // Invalidate all booking-related queries
          queryClient.invalidateQueries({ queryKey: ['bookings'] });
          queryClient.invalidateQueries({ queryKey: ['court-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['court-month-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
          queryClient.invalidateQueries({ queryKey: ['upcoming-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time booking subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook to subscribe to real-time booking changes for a specific court.
 * More targeted than useRealtimeBookings for court-specific views.
 */
export function useRealtimeCourtBookings(courtId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!courtId) return;

    console.log('Setting up real-time court booking subscription for:', courtId);
    
    const channel = supabase
      .channel(`court-bookings-${courtId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          console.log('Real-time court booking change:', payload.eventType, payload);
          
          // Invalidate court-specific booking queries
          queryClient.invalidateQueries({ queryKey: ['court-bookings', courtId] });
          queryClient.invalidateQueries({ queryKey: ['court-month-bookings', courtId] });
        }
      )
      .subscribe((status) => {
        console.log('Real-time court subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time court booking subscription...');
      supabase.removeChannel(channel);
    };
  }, [courtId, queryClient]);
}
