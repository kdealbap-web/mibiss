import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CasoPublico, MultimediaCaso } from '../types/biss';

/**
 * Lee un caso público por su slug (lo que viene en /caso/:folio).
 * Decisión D1 (PORT_NOTES): folio en URL = slug. La tabla `casos` no tiene
 * columna `folio` propia; se usa `slug.toUpperCase()` para display.
 */
export function useCaso(slug: string | undefined) {
  return useQuery<CasoPublico | null>({
    queryKey: ['caso', slug ?? null],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_casos_publicos')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return (data as CasoPublico | null) ?? null;
    },
    staleTime: 60_000,
  });
}

/**
 * Lee un caso público por su id uuid (cuando el mapa devuelve sólo el id).
 */
export function useCasoPorId(casoId: string | null) {
  return useQuery<CasoPublico | null>({
    queryKey: ['caso-por-id', casoId],
    enabled: Boolean(casoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_casos_publicos')
        .select('*')
        .eq('id', casoId!)
        .maybeSingle();
      if (error) throw error;
      return (data as CasoPublico | null) ?? null;
    },
    staleTime: 60_000,
  });
}

/**
 * Multimedia de un caso (fotos/videos/pdf en orden).
 */
export function useMultimediaCaso(casoId: string | null) {
  return useQuery<MultimediaCaso[]>({
    queryKey: ['multimedia', casoId],
    enabled: Boolean(casoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('multimedia_casos')
        .select('*')
        .eq('caso_id', casoId!)
        .order('orden', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MultimediaCaso[];
    },
    staleTime: 60_000,
  });
}
