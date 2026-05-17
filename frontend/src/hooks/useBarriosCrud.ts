import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Barrio } from '../types/biss';

export interface BarrioInput {
  nombre: string;
  slug: string;
  zona_id: number;
  coord_lat: number | null;
  coord_lng: number | null;
  codigo_oficial?: string | null;
}

export function useCreateBarrio() {
  const qc = useQueryClient();
  return useMutation<Barrio, Error, BarrioInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase
        .from('barrios')
        .insert(input)
        .select('*')
        .single();
      if (error) throw error;
      return data as Barrio;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barrios'] }),
  });
}

export function useUpdateBarrio() {
  const qc = useQueryClient();
  return useMutation<Barrio, Error, { id: number; patch: Partial<BarrioInput> }>({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase
        .from('barrios')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as Barrio;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barrios'] }),
  });
}

export function useDeleteBarrio() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('barrios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barrios'] }),
  });
}
