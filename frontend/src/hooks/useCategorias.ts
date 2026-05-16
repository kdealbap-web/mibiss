import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Categoria, StatsPorCategoria } from '../types/biss';

export function useCategorias() {
  return useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, codigo, nombre, icono, color_hex, orden')
        .order('orden', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Categoria[];
    },
    staleTime: 60 * 60_000,
  });
}

export function useStatsPorCategoria() {
  return useQuery<StatsPorCategoria[]>({
    queryKey: ['stats', 'categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_stats_por_categoria')
        .select('*')
        .order('orden', { ascending: true });
      if (error) throw error;
      return (data ?? []) as StatsPorCategoria[];
    },
  });
}
