import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface CapituloAdmin {
  id: string;
  barrio_id: number;
  barrio_nombre: string;
  barrio_slug: string;
  zona_id: number;
  zona_nombre: string;
  zona_color: string;
  descripcion: string | null;
  imagen_portada_url: string | null;
  geocerca: unknown;
  activo: boolean;
  activado_en: string | null;
  casos_total: number;
}

interface RawCapituloRow {
  id: string;
  barrio_id: number;
  descripcion: string | null;
  imagen_portada_url: string | null;
  geocerca: unknown;
  activo: boolean;
  activado_en: string | null;
}

interface RawBarrioRow {
  id: number;
  nombre: string;
  slug: string;
  zona_id: number;
}

interface RawZonaRow {
  id: number;
  nombre: string;
  color_hex: string;
}

interface RawCaso {
  capitulo_id: string;
}

export function useCapitulosAdmin() {
  return useQuery<CapituloAdmin[]>({
    queryKey: ['capitulos-admin'],
    queryFn: async () => {
      const [capRes, barriosRes, zonasRes, casosRes] = await Promise.all([
        supabase
          .from('capitulos')
          .select('id, barrio_id, descripcion, imagen_portada_url, geocerca, activo, activado_en')
          .order('barrio_id'),
        supabase.from('barrios').select('id, nombre, slug, zona_id'),
        supabase.from('zonas').select('id, nombre, color_hex'),
        supabase.from('v_casos_publicos').select('capitulo_id'),
      ]);
      if (capRes.error) throw capRes.error;
      if (barriosRes.error) throw barriosRes.error;
      if (zonasRes.error) throw zonasRes.error;
      if (casosRes.error) throw casosRes.error;

      const caps = (capRes.data ?? []) as RawCapituloRow[];
      const barriosById = new Map<number, RawBarrioRow>();
      ((barriosRes.data ?? []) as RawBarrioRow[]).forEach((b) => barriosById.set(b.id, b));
      const zonasById = new Map<number, RawZonaRow>();
      ((zonasRes.data ?? []) as RawZonaRow[]).forEach((z) => zonasById.set(z.id, z));
      const counts: Record<string, number> = {};
      ((casosRes.data ?? []) as RawCaso[]).forEach((c) => {
        counts[c.capitulo_id] = (counts[c.capitulo_id] ?? 0) + 1;
      });

      return caps.map((c): CapituloAdmin => {
        const b = barriosById.get(c.barrio_id);
        const z = b ? zonasById.get(b.zona_id) : undefined;
        return {
          id: c.id,
          barrio_id: c.barrio_id,
          barrio_nombre: b?.nombre ?? '—',
          barrio_slug: b?.slug ?? '',
          zona_id: b?.zona_id ?? 0,
          zona_nombre: z?.nombre ?? '—',
          zona_color: z?.color_hex ?? '#9AA3B2',
          descripcion: c.descripcion,
          imagen_portada_url: c.imagen_portada_url,
          geocerca: c.geocerca,
          activo: c.activo,
          activado_en: c.activado_en,
          casos_total: counts[c.id] ?? 0,
        };
      });
    },
    staleTime: 30_000,
  });
}

export function useCapituloAdmin(id: string | undefined) {
  const all = useCapitulosAdmin();
  return {
    ...all,
    data: id ? all.data?.find((c) => c.id === id) ?? null : null,
  };
}

export interface CapituloPatch {
  descripcion?: string | null;
  imagen_portada_url?: string | null;
  geocerca?: unknown;
  activo?: boolean;
}

export function useUpdateCapitulo() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: CapituloPatch }>({
    mutationFn: async ({ id, patch }) => {
      const updates: Record<string, unknown> = { ...patch, actualizado_en: new Date().toISOString() };
      if (patch.activo === true) {
        const { data: cur, error: getErr } = await supabase.auth.getUser();
        if (getErr) throw getErr;
        updates.activado_en = new Date().toISOString();
        updates.activado_por = cur.user?.id ?? null;
      }
      const { error } = await supabase.from('capitulos').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capitulos-admin'] });
      qc.invalidateQueries({ queryKey: ['capitulos', 'publicos'] });
      qc.invalidateQueries({ queryKey: ['capitulo-por-slug'] });
    },
  });
}
