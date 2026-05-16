import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Barrio } from '../types/biss';

export function useBarrios() {
  return useQuery<Barrio[]>({
    queryKey: ['barrios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barrios')
        .select('id, zona_id, codigo_oficial, nombre, slug, coord_lat, coord_lng, orden')
        .order('nombre', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Barrio[];
    },
  });
}

export function useBarriosConCoords() {
  const all = useBarrios();
  return {
    ...all,
    data: all.data?.filter((b) => b.coord_lat != null && b.coord_lng != null) ?? [],
  };
}
