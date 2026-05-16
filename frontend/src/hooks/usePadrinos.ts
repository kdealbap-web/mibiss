import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Padrino, PadrinoCaso } from '../types/biss';

export function usePadrinos() {
  return useQuery<Padrino[]>({
    queryKey: ['padrinos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('padrinos')
        .select('*')
        .order('creado_en', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Padrino[];
    },
    staleTime: 60_000,
  });
}

export interface PadrinoConAporte extends Padrino {
  aporte_descripcion: string | null;
}

export function usePadrinosPorCaso(casoId: string | null | undefined) {
  return useQuery<PadrinoConAporte[]>({
    queryKey: ['padrinos-caso', casoId ?? null],
    enabled: Boolean(casoId),
    queryFn: async () => {
      const { data: vinculos, error: err1 } = await supabase
        .from('padrinos_caso')
        .select('padrino_id, aporte_descripcion')
        .eq('caso_id', casoId!);
      if (err1) throw err1;
      const list = (vinculos ?? []) as Pick<PadrinoCaso, 'padrino_id' | 'aporte_descripcion'>[];
      if (list.length === 0) return [];
      const ids = list.map((v) => v.padrino_id);
      const { data: padrinos, error: err2 } = await supabase
        .from('padrinos')
        .select('*')
        .in('id', ids)
        .eq('publicado', true);
      if (err2) throw err2;
      const byId = new Map((padrinos ?? []).map((p) => [p.id as string, p as Padrino]));
      return list
        .map((v) => {
          const p = byId.get(v.padrino_id);
          if (!p) return null;
          return { ...p, aporte_descripcion: v.aporte_descripcion } as PadrinoConAporte;
        })
        .filter((x): x is PadrinoConAporte => x !== null);
    },
    staleTime: 60_000,
  });
}
