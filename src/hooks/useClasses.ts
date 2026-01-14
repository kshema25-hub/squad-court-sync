import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ClassInfo = Tables<'classes'>;

export function useUserClass(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-class', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: membership, error: membershipError } = await supabase
        .from('class_members')
        .select('class_id, is_representative')
        .eq('user_id', userId)
        .maybeSingle();

      if (membershipError || !membership) return null;

      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', membership.class_id)
        .maybeSingle();

      if (classError) throw classError;
      
      return classData ? {
        ...classData,
        isRepresentative: membership.is_representative,
      } : null;
    },
    enabled: !!userId,
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_id');

      if (error) throw error;
      return data as ClassInfo[];
    },
  });
}
