import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TestimoniosService } from '../../services/TestimoniosService';

function makeInvalidator(qc: ReturnType<typeof useQueryClient>) {
  return () => {
    qc.invalidateQueries({ queryKey: ['testimonios-pendientes'] });
    qc.invalidateQueries({ queryKey: ['testimonios-cap'] });
    qc.invalidateQueries({ queryKey: ['testimonios-caso'] });
  };
}

export function useAprobarTestimonio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TestimoniosService.aprobar(id),
    onSuccess: makeInvalidator(qc),
  });
}

export function useRechazarTestimonio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      TestimoniosService.rechazar(id, motivo),
    onSuccess: makeInvalidator(qc),
  });
}

export function useOcultarTestimonio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      TestimoniosService.ocultar(id, motivo),
    onSuccess: makeInvalidator(qc),
  });
}
