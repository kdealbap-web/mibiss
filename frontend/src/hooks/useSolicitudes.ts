import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { SolicitudPendiente } from '../types/biss';

/**
 * Cola admin de solicitudes. Hallazgo en PORT_NOTES: la vista real es
 * `v_solicitudes_pendientes` (no _admin como pedía el brief).
 */
export function useSolicitudes() {
  return useQuery<SolicitudPendiente[]>({
    queryKey: ['solicitudes', 'pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_solicitudes_pendientes')
        .select('*')
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SolicitudPendiente[];
    },
    staleTime: 30_000,
  });
}
