import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface VisitasKpis {
  visitas_hoy: number;
  visitas_semana: number;
  visitas_mes: number;
  visitas_total: number;
  paths_distintos: number;
}

export interface TopPath {
  path: string;
  visitas: number;
  ultima_visita: string;
}

export interface VisitaSemana {
  semana_inicio: string;
  visitas: number;
}

export interface TopBarrio {
  capitulo_id: string;
  barrio_nombre: string;
  barrio_slug: string;
  zona_nombre: string;
  casos_total: number;
  casos_progreso: number;
  casos_resueltos: number;
}

export interface CasoMensual {
  mes: string;
  total: number;
  resueltos: number;
}

interface RawCasoFecha {
  creado_en: string;
  resuelto_en: string | null;
}

export function useVisitasKpis() {
  return useQuery<VisitasKpis | null>({
    queryKey: ['visitas-kpis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_visits_kpis')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return (data as VisitasKpis | null) ?? null;
    },
    staleTime: 60_000,
  });
}

export function useTopPaths() {
  return useQuery<TopPath[]>({
    queryKey: ['visitas-top-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_visits_top_paths')
        .select('*');
      if (error) throw error;
      return (data ?? []) as TopPath[];
    },
    staleTime: 60_000,
  });
}

export function useVisitasSemanal() {
  return useQuery<VisitaSemana[]>({
    queryKey: ['visitas-semanal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_visits_semanal')
        .select('*');
      if (error) throw error;
      return (data ?? []) as VisitaSemana[];
    },
    staleTime: 60_000,
  });
}

export function useTopBarrios() {
  return useQuery<TopBarrio[]>({
    queryKey: ['top-barrios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_capitulos_publicos')
        .select('capitulo_id, barrio_nombre, barrio_slug, zona_nombre, casos_total, casos_progreso, casos_resueltos')
        .order('casos_total', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as TopBarrio[];
    },
    staleTime: 60_000,
  });
}

/** Casos creados vs resueltos por mes en los últimos 12 meses (cliente). */
export function useCasosMensuales() {
  return useQuery<CasoMensual[]>({
    queryKey: ['casos-mensuales'],
    queryFn: async () => {
      const desde = new Date();
      desde.setMonth(desde.getMonth() - 11);
      desde.setDate(1);
      desde.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('casos')
        .select('creado_en, resuelto_en')
        .gte('creado_en', desde.toISOString())
        .limit(5000);
      if (error) throw error;
      const rows = (data ?? []) as RawCasoFecha[];

      const buckets = new Map<string, { total: number; resueltos: number }>();
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.set(d.toISOString().slice(0, 7), { total: 0, resueltos: 0 });
      }

      rows.forEach((r) => {
        const k = r.creado_en.slice(0, 7);
        const b = buckets.get(k);
        if (b) b.total += 1;
        if (r.resuelto_en) {
          const rk = r.resuelto_en.slice(0, 7);
          const rb = buckets.get(rk);
          if (rb) rb.resueltos += 1;
        }
      });

      return Array.from(buckets.entries()).map(([mes, v]) => ({
        mes,
        total: v.total,
        resueltos: v.resueltos,
      }));
    },
    staleTime: 60_000,
  });
}
