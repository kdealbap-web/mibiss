import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import { useSessionContext } from '../context/SessionContext';
import type { CasoPublico, Ciudadano, Testimonio } from '../types/biss';

/** Devuelve la sesión actual. Lee del SessionContext — una sola fuente de verdad. */
export function useSession() {
  return useSessionContext().session;
}

export type Rol = 'anon' | 'ciudadano' | 'editor' | 'admin' | 'superadmin';

/**
 * Resuelve el rol del usuario autenticado consultando usuarios_cms y ciudadanos.
 * 'anon' si no hay sesión o no aparece en ninguna tabla.
 *
 * usuarios_cms.id = auth.users(id) directamente (no hay auth_user_id intermedio).
 * ciudadanos.auth_user_id = auth.users(id) por FK.
 */
export function useMiRol() {
  const session = useSession();
  const uid = session?.user?.id ?? null;
  return useQuery<Rol>({
    queryKey: ['mi-rol', uid],
    enabled: Boolean(uid),
    queryFn: async () => {
      if (!uid) return 'anon';
      const { data: cms } = await supabase
        .from('usuarios_cms')
        .select('rol, activo')
        .eq('id', uid)
        .eq('activo', true)
        .maybeSingle();
      if (cms?.rol) return cms.rol as 'editor' | 'admin' | 'superadmin';
      const { data: ciu } = await supabase
        .from('ciudadanos')
        .select('id')
        .eq('auth_user_id', uid)
        .is('eliminado_en', null)
        .maybeSingle();
      if (ciu) return 'ciudadano';
      return 'anon';
    },
    staleTime: 60_000,
  });
}

/** Perfil del ciudadano autenticado, si existe. */
export function useMiPerfil() {
  const session = useSession();
  const uid = session?.user?.id ?? null;
  return useQuery<Ciudadano | null>({
    queryKey: ['mi-perfil', uid],
    enabled: Boolean(uid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ciudadanos')
        .select('*')
        .eq('auth_user_id', uid!)
        .is('eliminado_en', null)
        .maybeSingle();
      if (error) throw error;
      return (data as Ciudadano | null) ?? null;
    },
    staleTime: 30_000,
  });
}

/** Casos generados a partir de solicitudes hechas por el ciudadano actual. */
export function useMisCasos() {
  const { data: perfil } = useMiPerfil();
  const ciudadanoId = perfil?.id ?? null;
  return useQuery<CasoPublico[]>({
    queryKey: ['mis-casos', ciudadanoId],
    enabled: Boolean(ciudadanoId),
    queryFn: async () => {
      const { data: sols, error: err1 } = await supabase
        .from('solicitudes_caso')
        .select('caso_generado_id')
        .eq('ciudadano_id', ciudadanoId!)
        .not('caso_generado_id', 'is', null);
      if (err1) throw err1;
      const ids = (sols ?? [])
        .map((s) => (s as { caso_generado_id: string | null }).caso_generado_id)
        .filter((x): x is string => Boolean(x));
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('v_casos_publicos')
        .select('*')
        .in('id', ids)
        .order('publicado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CasoPublico[];
    },
    staleTime: 30_000,
  });
}

export function useMisTestimonios() {
  const { data: perfil } = useMiPerfil();
  const ciudadanoId = perfil?.id ?? null;
  return useQuery<Testimonio[]>({
    queryKey: ['mis-testimonios', ciudadanoId],
    enabled: Boolean(ciudadanoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonios')
        .select('*')
        .eq('ciudadano_id', ciudadanoId!)
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Testimonio[];
    },
    staleTime: 30_000,
  });
}
