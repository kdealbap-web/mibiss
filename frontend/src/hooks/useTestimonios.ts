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

export type EstadoTestimonioFiltro = 'pendiente' | 'aprobado' | 'rechazado' | 'oculto' | 'todos';

export interface TestimonioAdmin {
  id: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'oculto';
  mensaje: string;
  relacion: string;
  firmar_como: string | null;
  capitulo_id: string | null;
  caso_id: string | null;
  motivo_rechazo: string | null;
  creado_en: string;
  moderado_en: string | null;
  ciudadano_nombre: string;
}

interface RawTestimonio {
  id: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'oculto';
  mensaje: string;
  relacion: string;
  firmar_como: string | null;
  capitulo_id: string | null;
  caso_id: string | null;
  ciudadano_id: string | null;
  motivo_rechazo: string | null;
  creado_en: string;
  moderado_en: string | null;
}

interface RawCiudadano {
  id: string;
  nombres: string;
  apellidos: string;
}

export function useTestimoniosAdmin(filtro: EstadoTestimonioFiltro = 'todos') {
  return useQuery<TestimonioAdmin[]>({
    queryKey: ['testimonios-admin', filtro],
    queryFn: async () => {
      let q = supabase
        .from('testimonios')
        .select('id, estado, mensaje, relacion, firmar_como, capitulo_id, caso_id, ciudadano_id, motivo_rechazo, creado_en, moderado_en')
        .order('creado_en', { ascending: false })
        .limit(500);
      if (filtro !== 'todos') q = q.eq('estado', filtro);
      const { data, error } = await q;
      if (error) throw error;
      const rows = (data ?? []) as RawTestimonio[];

      const ciudIds = Array.from(new Set(rows.map((r) => r.ciudadano_id).filter((x): x is string => Boolean(x))));
      let nombreById = new Map<string, string>();
      if (ciudIds.length > 0) {
        const { data: ciuds } = await supabase
          .from('ciudadanos')
          .select('id, nombres, apellidos')
          .in('id', ciudIds);
        ((ciuds ?? []) as RawCiudadano[]).forEach((c) => {
          nombreById.set(c.id, `${c.nombres} ${c.apellidos}`.trim());
        });
      }

      return rows.map((r): TestimonioAdmin => ({
        id: r.id,
        estado: r.estado,
        mensaje: r.mensaje,
        relacion: r.relacion,
        firmar_como: r.firmar_como,
        capitulo_id: r.capitulo_id,
        caso_id: r.caso_id,
        motivo_rechazo: r.motivo_rechazo,
        creado_en: r.creado_en,
        moderado_en: r.moderado_en,
        ciudadano_nombre: r.ciudadano_id ? nombreById.get(r.ciudadano_id) ?? '—' : 'Anónimo',
      }));
    },
    staleTime: 15_000,
  });
}
