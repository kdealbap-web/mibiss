import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CasosService } from '../../services/CasosService';
import type { EstadoCaso, TipoUpdate } from '../../types/biss';

export function useCambiarEstadoCaso(casoSlug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { casoId: string; nuevo: EstadoCaso; nota?: string }) =>
      CasosService.cambiarEstado(input.casoId, input.nuevo, input.nota),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['caso', casoSlug] });
      qc.invalidateQueries({ queryKey: ['casos', 'publicos'] });
      qc.invalidateQueries({ queryKey: ['actualizaciones', vars.casoId] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['mv-stats-globales'] });
    },
  });
}

export function useEditarCaso(casoSlug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      casoId: string;
      patch: Partial<{
        titulo: string;
        descripcion: string;
        lat: number | null;
        lng: number | null;
        categoria_id: number;
      }>;
    }) => CasosService.actualizar(input.casoId, input.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['caso', casoSlug] });
      qc.invalidateQueries({ queryKey: ['casos', 'publicos'] });
    },
  });
}

export function useAgregarActualizacion(casoSlug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      caso_id: string;
      tipo: TipoUpdate;
      texto: string;
      estado_anterior?: EstadoCaso | null;
      estado_nuevo?: EstadoCaso | null;
      autor_cms_id: string;
      ocurrido_en?: string;
    }) => CasosService.agregarActualizacion(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['actualizaciones', vars.caso_id] });
      qc.invalidateQueries({ queryKey: ['caso', casoSlug] });
    },
  });
}
