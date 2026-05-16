import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { UsuarioCms, Ciudadano } from '../types/biss';

export function useUsuariosCms() {
  return useQuery<UsuarioCms[]>({
    queryKey: ['usuarios-cms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios_cms')
        .select('*')
        .eq('activo', true)
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as UsuarioCms[];
    },
    staleTime: 60_000,
  });
}

export function useCiudadanos() {
  return useQuery<Ciudadano[]>({
    queryKey: ['ciudadanos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ciudadanos')
        .select('*')
        .is('eliminado_en', null)
        .order('creado_en', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Ciudadano[];
    },
    staleTime: 60_000,
  });
}
