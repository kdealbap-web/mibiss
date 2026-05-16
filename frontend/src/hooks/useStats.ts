import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { StatsGlobales } from '../types/biss';

export function useStatsGlobales() {
  return useQuery<StatsGlobales | null>({
    queryKey: ['stats', 'globales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_stats_globales')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return (data as StatsGlobales | null) ?? null;
    },
  });
}
