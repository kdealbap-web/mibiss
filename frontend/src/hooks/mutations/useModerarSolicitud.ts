import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SolicitudesService } from '../../services/SolicitudesService';

export function useAprobarSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (solicitudId: string) => SolicitudesService.aprobar(solicitudId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solicitudes'] });
      qc.invalidateQueries({ queryKey: ['casos', 'publicos'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['mv-stats-globales'] });
    },
  });
}

export function useRechazarSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      SolicitudesService.rechazar(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solicitudes'] });
    },
  });
}
