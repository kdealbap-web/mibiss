import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TestimonioPublico, TestimonioPendiente } from '../types/biss';

export function useTestimoniosPorCaso(casoId: string | null | undefined) {
  return useQuery<TestimonioPublico[]>({
    queryKey: ['testimonios-caso', casoId ?? null],
    enabled: Boolean(casoId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_testimonios_publicos')
        .select('*')
        .eq('caso_id', casoId!)
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TestimonioPublico[];
    },
    staleTime: 60_000,
  });
}

export function useTestimoniosPorCapitulo(capituloId: string | null | undefined) {
  return useQuery<TestimonioPublico[]>({
    queryKey: ['testimonios-cap', capituloId ?? null],
    enabled: Boolean(capituloId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_testimonios_publicos')
        .select('*')
        .eq('capitulo_id', capituloId!)
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TestimonioPublico[];
    },
    staleTime: 60_000,
  });
}

/** Cola de moderación (admin only) — usa v_testimonios_pendientes */
export function useTestimoniosPendientes() {
  return useQuery<TestimonioPendiente[]>({
    queryKey: ['testimonios-pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_testimonios_pendientes')
        .select('*');
      if (error) throw error;
      return (data ?? []) as TestimonioPendiente[];
    },
    staleTime: 30_000,
  });
}
