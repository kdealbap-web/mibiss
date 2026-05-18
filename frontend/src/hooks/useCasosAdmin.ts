import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { EstadoCaso } from '../types/biss';

export interface CasoAdmin {
  id: string;
  capitulo_id: string;
  barrio_id: number;
  barrio_nombre: string;
  barrio_slug: string;
  zona_codigo: string;
  zona_color: string;
  categoria_id: number;
  categoria_codigo: string;
  categoria_nombre: string;
  categoria_color: string;
  titulo: string;
  slug: string;
  estado: EstadoCaso;
  publicado_en: string | null;
  resuelto_en: string | null;
  creado_en: string;
  actualizado_en: string;
  edad_dias: number;
}

interface RawCaso {
  id: string;
  capitulo_id: string;
  categoria_id: number;
  titulo: string;
  slug: string | null;
  estado: EstadoCaso;
  publicado_en: string | null;
  resuelto_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

interface RawCapitulo {
  id: string;
  barrio_id: number;
}

interface RawBarrio {
  id: number;
  nombre: string;
  slug: string;
  zona_id: number;
}

interface RawZona {
  id: number;
  codigo: string;
  color_hex: string;
}

interface RawCategoria {
  id: number;
  codigo: string;
  nombre: string;
  color_hex: string;
}

export function useCasosAdmin() {
  return useQuery<CasoAdmin[]>({
    queryKey: ['casos-admin'],
    queryFn: async () => {
      const [casosRes, capRes, barriosRes, zonasRes, catRes] = await Promise.all([
        supabase
          .from('casos')
          .select('id, capitulo_id, categoria_id, titulo, slug, estado, publicado_en, resuelto_en, creado_en, actualizado_en')
          .order('creado_en', { ascending: false }),
        supabase.from('capitulos').select('id, barrio_id'),
        supabase.from('barrios').select('id, nombre, slug, zona_id'),
        supabase.from('zonas').select('id, codigo, color_hex'),
        supabase.from('categorias').select('id, codigo, nombre, color_hex'),
      ]);
      if (casosRes.error) throw casosRes.error;
      if (capRes.error) throw capRes.error;
      if (barriosRes.error) throw barriosRes.error;
      if (zonasRes.error) throw zonasRes.error;
      if (catRes.error) throw catRes.error;

      const caps = new Map<string, RawCapitulo>();
      ((capRes.data ?? []) as RawCapitulo[]).forEach((c) => caps.set(c.id, c));
      const barrios = new Map<number, RawBarrio>();
      ((barriosRes.data ?? []) as RawBarrio[]).forEach((b) => barrios.set(b.id, b));
      const zonas = new Map<number, RawZona>();
      ((zonasRes.data ?? []) as RawZona[]).forEach((z) => zonas.set(z.id, z));
      const cats = new Map<number, RawCategoria>();
      ((catRes.data ?? []) as RawCategoria[]).forEach((c) => cats.set(c.id, c));

      const now = Date.now();
      const MS_DIA = 86_400_000;

      return ((casosRes.data ?? []) as RawCaso[]).map((c): CasoAdmin => {
        const cap = caps.get(c.capitulo_id);
        const b = cap ? barrios.get(cap.barrio_id) : undefined;
        const z = b ? zonas.get(b.zona_id) : undefined;
        const cat = cats.get(c.categoria_id);
        const refDate = c.resuelto_en ?? c.publicado_en ?? c.creado_en;
        const edad_dias = Math.floor((now - new Date(refDate).getTime()) / MS_DIA);
        return {
          id: c.id,
          capitulo_id: c.capitulo_id,
          barrio_id: cap?.barrio_id ?? 0,
          barrio_nombre: b?.nombre ?? '—',
          barrio_slug: b?.slug ?? '',
          zona_codigo: z?.codigo ?? '',
          zona_color: z?.color_hex ?? '#9AA3B2',
          categoria_id: c.categoria_id,
          categoria_codigo: cat?.codigo ?? 'otros',
          categoria_nombre: cat?.nombre ?? '—',
          categoria_color: cat?.color_hex ?? '#9AA3B2',
          titulo: c.titulo,
          slug: c.slug ?? '',
          estado: c.estado,
          publicado_en: c.publicado_en,
          resuelto_en: c.resuelto_en,
          creado_en: c.creado_en,
          actualizado_en: c.actualizado_en,
          edad_dias,
        };
      });
    },
    staleTime: 30_000,
  });
}

export function useDeleteCaso() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('casos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['casos-admin'] });
      qc.invalidateQueries({ queryKey: ['casos', 'publicos'] });
    },
  });
}
