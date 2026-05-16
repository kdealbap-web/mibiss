// =============================================================================
// services/ComentariosService.ts
// =============================================================================
import { supabase } from '../lib/supabase';
import { comentarioSchema } from '../schemas';

export const ComentariosService = {
  async listarPublicos(capituloId: string, casoId?: string) {
    let q = supabase.from('comentarios')
      .select(`id, texto, creado_en, editado_en,
               ciudadano:ciudadano_id(nombres, apellidos, barrio:barrio_id(nombre))`)
      .eq('capitulo_id', capituloId)
      .eq('oculto', false)
      .order('creado_en', { ascending: false });
    if (casoId) q = q.eq('caso_id', casoId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async crear(input: unknown, ciudadanoId: string) {
    const data = comentarioSchema.parse(input);
    const { data: row, error } = await supabase.from('comentarios')
      .insert({ ...data, ciudadano_id: ciudadanoId })
      .select('id, texto, creado_en')
      .single();
    if (error) throw error;
    return row;
  },

  async editar(id: string, texto: string) {
    const { error } = await supabase.from('comentarios').update({ texto }).eq('id', id);
    if (error) throw error;
  },

  async ocultar(id: string, motivo: string) {
    const { error } = await supabase.from('comentarios')
      .update({ oculto: true, motivo_oculto: motivo }).eq('id', id);
    if (error) throw error;
  },
};
