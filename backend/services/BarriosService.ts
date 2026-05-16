// =============================================================================
// services/BarriosService.ts
// =============================================================================
import { supabase } from '../lib/supabase';

export const BarriosService = {
  async listar() {
    const { data, error } = await supabase
      .from('barrios')
      .select('id, nombre, slug, zona_id, coord_lat, coord_lng, codigo_oficial, orden')
      .order('nombre');
    if (error) throw error;
    return data ?? [];
  },

  async listarPorZona(zonaId: number) {
    const { data, error } = await supabase
      .from('barrios')
      .select('id, nombre, slug, coord_lat, coord_lng')
      .eq('zona_id', zonaId)
      .order('nombre');
    if (error) throw error;
    return data ?? [];
  },

  async buscar(query: string) {
    const { data, error } = await supabase
      .from('barrios')
      .select('id, nombre, slug, zona_id')
      .ilike('nombre', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },

  async porSlug(slug: string) {
    const { data, error } = await supabase
      .from('barrios')
      .select('id, nombre, slug, zona_id, coord_lat, coord_lng')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
