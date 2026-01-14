import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Court = Tables<'courts'>;
export type Equipment = Tables<'equipment'>;

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
