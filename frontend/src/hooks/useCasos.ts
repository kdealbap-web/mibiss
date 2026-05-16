import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CasoPublico } from '../types/biss';

export function useCasosPublicos() {
  return useQuery<CasoPublico[]>({
    queryKey: ['casos', 'publicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_casos_publicos')
        .select('*')
        .order('publicado_en', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as CasoPublico[];
    },
  });
}
