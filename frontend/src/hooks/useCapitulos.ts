import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { CapituloPublico, CasoPublico } from '../types/biss';

export function useCapitulosPublicos() {
  return useQuery<CapituloPublico[]>({
    queryKey: ['capitulos', 'publicos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_capitulos_publicos').select('*');
      if (error) throw error;
      return (data ?? []) as CapituloPublico[];
    },
    staleTime: 60_000,
  });
}

/**
 * Lee un capítulo público por el slug de barrio (path `/capitulo/:slug`).
 * Decisión D2 (PORT_NOTES).
 */
export function useCapituloPorSlug(slug: string | undefined) {
  return useQuery<CapituloPublico | null>({
    queryKey: ['capitulo-por-slug', slug ?? null],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_capitulos_publicos')
        .select('*')
        .eq('barrio_slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return (data as CapituloPublico | null) ?? null;
    },
    staleTime: 60_000,
  });
}

/**
 * Casos públicos de un capítulo (filtrados por v_casos_publicos.capitulo_id).
 */
export function useCasosPorCapitulo(capituloId: string | null | undefined) {
  return useQuery<CasoPublico[]>({
    queryKey: ['casos-por-capitulo', capituloId ?? null],
    enabled: Boolean(capituloId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_casos_publicos')
        .select('*')
        .eq('capitulo_id', capituloId!)
        .order('publicado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CasoPublico[];
    },
    staleTime: 60_000,
  });
}
