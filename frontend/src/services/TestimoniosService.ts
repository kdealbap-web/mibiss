import { supabase } from '../lib/supabase';
import type { RelacionTestimonio } from '../types/biss';

export interface CrearTestimonioInput {
  /** null cuando se publica sin sesión (anónimo público). */
  ciudadano_id: string | null;
  capitulo_id?: string | null;
  caso_id?: string | null;
  firmar_como: string | null;
  relacion: RelacionTestimonio;
  mensaje: string;
}

export const TestimoniosService = {
  async crear(input: CrearTestimonioInput) {
    if (!input.capitulo_id && !input.caso_id) {
      throw new Error('Un testimonio debe estar asociado a un caso o a un capítulo.');
    }
    const { data, error } = await supabase
      .from('testimonios')
      .insert({
        ciudadano_id: input.ciudadano_id,
        capitulo_id: input.capitulo_id ?? null,
        caso_id: input.caso_id ?? null,
        firmar_como: input.firmar_como,
        relacion: input.relacion,
        mensaje: input.mensaje,
      })
      .select('id, creado_en')
      .single();
    if (error) throw error;
    return data as { id: string; creado_en: string };
  },

  async aprobar(id: string) {
    const { error } = await supabase
      .from('testimonios')
      .update({
        estado: 'aprobado',
        moderado_en: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async rechazar(id: string, motivo: string) {
    const { error } = await supabase
      .from('testimonios')
      .update({
        estado: 'rechazado',
        motivo_rechazo: motivo,
        moderado_en: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async ocultar(id: string, motivo: string) {
    const { error } = await supabase
      .from('testimonios')
      .update({
        estado: 'oculto',
        motivo_rechazo: motivo,
        moderado_en: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },
};
