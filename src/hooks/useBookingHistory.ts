import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusHistoryEntry {
  id: string;
  booking_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  changed_by_profile?: {
    full_name: string;
    email: string;
  } | null;
}

export function useBookingHistory(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['booking-history', bookingId],
    queryFn: async () => {
      if (!bookingId) return [];

      // First get the history entries
      const { data: historyData, error: historyError } = await supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('changed_at', { ascending: true });

      if (historyError) throw historyError;

      // Get unique user IDs who made changes
      const userIds = [...new Set(historyData?.filter(h => h.changed_by).map(h => h.changed_by) || [])];

      // Fetch profiles for those users if any
      let profilesMap: Record<string, { full_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        if (profilesData) {
          profilesMap = profilesData.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string; email: string }>);
        }
      }

      // Combine the data
      return (historyData || []).map((entry) => ({
        ...entry,
        changed_by_profile: entry.changed_by ? profilesMap[entry.changed_by] || null : null,
      })) as StatusHistoryEntry[];
    },
    enabled: !!bookingId,
  });
}
