import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SolicitudesService, type CrearSolicitudInput } from '../../services/SolicitudesService';

export function useReportarCaso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearSolicitudInput) => SolicitudesService.crear(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['solicitudes'] });
      qc.invalidateQueries({ queryKey: ['mis-casos'] });
    },
  });
}
