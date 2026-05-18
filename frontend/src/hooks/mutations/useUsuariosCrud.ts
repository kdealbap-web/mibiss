import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface InvitarEditorInput {
  email: string;
  nombre: string;
  rol: 'editor' | 'admin';
}

interface InvitarEditorResult {
  ok: boolean;
  uid: string;
  email: string;
  rol: string;
}

export function useInvitarEditor() {
  const qc = useQueryClient();
  return useMutation<InvitarEditorResult, Error, InvitarEditorInput>({
    mutationFn: async (input) => {
      const { data, error } = await supabase.functions.invoke<InvitarEditorResult>(
        'invitar-editor',
        { body: input },
      );
      if (error) {
        const detail =
          typeof error.context === 'object' && error.context !== null
            ? (error.context as { message?: string }).message
            : null;
        throw new Error(detail ?? error.message ?? 'No pudimos invitar al editor.');
      }
      if (!data) throw new Error('Sin respuesta del servidor.');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios-cms'] });
    },
  });
}

export function useSuspenderCiudadano() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; motivo: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.rpc('suspender_ciudadano', {
        p_ciudadano_id: id,
        p_motivo: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ciudadanos'] });
    },
  });
}

export function useReactivarCiudadano() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.rpc('reactivar_ciudadano', { p_ciudadano_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ciudadanos'] });
    },
  });
}
