// =============================================================================
// services/StatsService.ts
// =============================================================================
import { supabase } from '../lib/supabase';

export const StatsService = {
  async globales() {
    const { data, error } = await supabase
      .from('mv_stats_globales').select('*').maybeSingle();
    if (error) throw error;
    return data;
  },
  async porZona() {
    const { data, error } = await supabase
      .from('v_stats_por_zona').select('*').order('orden' as any, { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};
