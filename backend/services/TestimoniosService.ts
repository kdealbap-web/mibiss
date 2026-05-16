import { supabase } from '../lib/supabase';
import { testimonioSchema } from '../schemas';

export const TestimoniosService = {
  async crear(input: unknown) {
    const data = testimonioSchema.parse(input);
    const { data: row, error } = await supabase
      .from('testimonios')
      .insert(data as any)
      .select('id')
      .single();
    if (error) throw error;
    return row;
  },

  async listarPublicosPorCapitulo(capituloId: string) {
    const { data, error } = await supabase
      .from('v_testimonios_publicos')
      .select('id, relacion, mensaje, capitulo_id, caso_id, creado_en, autor_visible')
      .eq('capitulo_id', capituloId)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listarPublicosPorCaso(casoId: string) {
    const { data, error } = await supabase
      .from('v_testimonios_publicos')
      .select('id, relacion, mensaje, capitulo_id, caso_id, creado_en, autor_visible')
      .eq('caso_id', casoId)
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async pendientesAdmin() {
    const { data, error } = await supabase
      .from('v_testimonios_pendientes')
      .select('id, relacion, mensaje, firmar_como, capitulo_id, caso_id, creado_en, ciudadano_nombre, ciudadano_telefono');
    if (error) throw error;
    return data ?? [];
  },

  async aprobar(id: string) {
    const { error } = await supabase
      .from('testimonios')
      .update({ estado: 'aprobado', moderado_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async rechazar(id: string, motivo: string) {
    const { error } = await supabase
      .from('testimonios')
      .update({ estado: 'rechazado', motivo_rechazo: motivo, moderado_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async ocultar(id: string) {
    const { error } = await supabase
      .from('testimonios')
      .update({ estado: 'oculto', moderado_en: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
