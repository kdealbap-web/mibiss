import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Zona } from '../types/biss';

export function useZonas() {
  return useQuery<Zona[]>({
    queryKey: ['zonas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zonas')
        .select('id, codigo, nombre, color_hex, orden')
        .order('orden', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Zona[];
    },
    staleTime: 60 * 60_000,
  });
}
