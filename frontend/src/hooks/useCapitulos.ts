import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CapituloPublico } from '../types/biss';

export function useCapitulosPublicos() {
  return useQuery<CapituloPublico[]>({
    queryKey: ['capitulos', 'publicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_capitulos_publicos')
        .select('*');
      if (error) throw error;
      return (data ?? []) as CapituloPublico[];
    },
  });
}
