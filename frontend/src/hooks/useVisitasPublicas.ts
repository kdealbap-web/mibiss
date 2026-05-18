import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface VisitasPublicas {
  visitas_mes: number;
}

/**
 * Contador público de visitas de los últimos 30 días para indicador social
 * en la home. No expone paths ni total all-time.
 */
export function useVisitasPublicasMes() {
  return useQuery<number>({
    queryKey: ['visitas-publicas-mes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_visitas_publicas_mes')
        .select('visitas_mes')
        .maybeSingle();
      if (error) throw error;
      return (data as VisitasPublicas | null)?.visitas_mes ?? 0;
    },
    staleTime: 5 * 60_000,
  });
}
