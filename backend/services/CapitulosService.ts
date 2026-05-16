// =============================================================================
// services/CapitulosService.ts
// =============================================================================
import { supabase } from '../lib/supabase';
import { capituloUpsertSchema } from '../schemas';

export const CapitulosService = {
  async listarPublicos() {
    const { data, error } = await supabase
      .from('v_capitulos_publicos')
      .select('*')
      .order('barrio_nombre');
    if (error) throw error;
    return data ?? [];
  },

  async porBarrioSlug(slug: string) {
    const { data, error } = await supabase
      .from('v_capitulos_publicos')
      .select('*')
      .eq('barrio_slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsert(input: unknown) {
    const data = capituloUpsertSchema.parse(input);
    const { data: row, error } = await supabase
      .from('capitulos')
      .upsert({ ...data }, { onConflict: 'barrio_id' })
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async activar(capituloId: string) {
    const { error } = await supabase
      .from('capitulos')
      .update({ activo: true, activado_en: new Date().toISOString() })
      .eq('id', capituloId);
    if (error) throw error;
  },
};
