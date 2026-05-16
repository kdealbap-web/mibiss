import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PadrinosService, type CrearPadrinoInput } from '../../services/PadrinosService';

export function useApadrinar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearPadrinoInput) => PadrinosService.crear(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['padrinos'] });
      if (vars.caso_id) qc.invalidateQueries({ queryKey: ['padrinos-caso', vars.caso_id] });
    },
  });
}
