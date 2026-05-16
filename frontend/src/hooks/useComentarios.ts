import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Comentario } from '../types/biss';

type Scope = 'caso' | 'capitulo';

export function useComentarios(scope: Scope, id: string | null | undefined) {
  return useQuery<Comentario[]>({
    queryKey: ['comentarios', scope, id ?? null],
    enabled: Boolean(id),
    queryFn: async () => {
      const col = scope === 'caso' ? 'caso_id' : 'capitulo_id';
      const { data, error } = await supabase
        .from('comentarios')
        .select('*')
        .eq(col, id!)
        .eq('oculto', false)
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comentario[];
    },
    staleTime: 60_000,
  });
}
