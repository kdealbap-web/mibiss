import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TestimoniosService, type CrearTestimonioInput } from '../../services/TestimoniosService';

export function useSumarTestimonio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearTestimonioInput) => TestimoniosService.crear(input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['testimonios-cap'] });
      qc.invalidateQueries({ queryKey: ['testimonios-caso'] });
      qc.invalidateQueries({ queryKey: ['testimonios-pendientes'] });
      qc.invalidateQueries({ queryKey: ['mis-testimonios'] });
      if (vars.caso_id) qc.invalidateQueries({ queryKey: ['testimonios-caso', vars.caso_id] });
      if (vars.capitulo_id) qc.invalidateQueries({ queryKey: ['testimonios-cap', vars.capitulo_id] });
    },
  });
}
