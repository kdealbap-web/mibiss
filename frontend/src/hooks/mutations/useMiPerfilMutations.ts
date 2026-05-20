import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface PerfilPatch {
  nombres?: string;
  apellidos?: string;
  telefono_celular?: string | null;
  direccion?: string;
  barrio_id?: number;
  estrato?: number;
  miembros_hogar?: number;
  acepta_notificaciones?: boolean;
}

export function useActualizarMiPerfil() {
  const qc = useQueryClient();
  return useMutation<void, Error, PerfilPatch>({
    mutationFn: async (patch) => {
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr || !user) throw new Error('Sesión no válida.');
      const { error } = await supabase
        .from('ciudadanos')
        .update(patch)
        .eq('auth_user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mi-perfil'] });
    },
  });
}

export function useCambiarMiEmail() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (nuevoEmail) => {
      const { error } = await supabase.auth.updateUser({ email: nuevoEmail });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mi-perfil'] });
      qc.invalidateQueries({ queryKey: ['mis-padrinazgos'] });
    },
  });
}

export function useDefinirMiPassword() {
  return useMutation<void, Error, string>({
    mutationFn: async (nuevaPassword) => {
      if (nuevaPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
      if (error) throw error;
    },
  });
}
