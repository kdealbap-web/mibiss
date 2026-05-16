import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PadrinosService } from '../../services/PadrinosService';

function makeInvalidator(qc: ReturnType<typeof useQueryClient>) {
  return () => {
    qc.invalidateQueries({ queryKey: ['padrinos'] });
    qc.invalidateQueries({ queryKey: ['padrinos-caso'] });
  };
}

export function usePublicarPadrino() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PadrinosService.publicar(id),
    onSuccess: makeInvalidator(qc),
  });
}

export function useRechazarPadrino() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PadrinosService.rechazar(id),
    onSuccess: makeInvalidator(qc),
  });
}
