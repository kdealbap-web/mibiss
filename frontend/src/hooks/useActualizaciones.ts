import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { ActualizacionCaso } from '../types/biss';

export function useActualizaciones(casoId: string | null | undefined) {
  return useQuery<ActualizacionCaso[]>({
    queryKey: ['actualizaciones', casoId ?? null],
    enabled: Boolean(casoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actualizaciones_caso')
        .select('*')
        .eq('caso_id', casoId!)
        .order('ocurrido_en', { ascending: false })
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActualizacionCaso[];
    },
    staleTime: 60_000,
  });
}
