// =============================================================================
// services/CasosService.ts
// =============================================================================
import { supabase } from '../lib/supabase';
import { casoCreateSchema, casoUpdateSchema } from '../schemas';
import type { EstadoCaso } from '../lib/database.types';

export const CasosService = {
  // ----- LECTURA PÚBLICA -----
  async listarPublicosPorCapitulo(capituloId: string) {
    const { data, error } = await supabase
      .from('v_casos_publicos')
      .select('*')
      .eq('capitulo_id', capituloId)
      .order('estado', { ascending: true })
      .order('publicado_en', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async porSlug(barrioSlug: string, casoSlug: string) {
    const { data, error } = await supabase
      .from('v_casos_publicos')
      .select('*')
      .eq('barrio_slug', barrioSlug)
      .eq('slug', casoSlug)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async multimediaDe(casoId: string) {
    const { data, error } = await supabase
      .from('multimedia_casos')
      .select('id, tipo, url, thumb_url, orden')
      .eq('caso_id', casoId)
      .order('orden');
    if (error) throw error;
    return data ?? [];
  },

  async timelineDe(casoId: string) {
    const { data, error } = await supabase
      .from('actualizaciones_caso')
      .select('id, tipo, texto, estado_anterior, estado_nuevo, ocurrido_en, creado_en, autor_cms_id')
      .eq('caso_id', casoId)
      .order('ocurrido_en', { ascending: false })
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async padrinosDe(casoId: string) {
    const { data, error } = await supabase
      .from('padrinos_caso')
      .select('caso_id, padrino_id, aporte_descripcion, desde, hasta, padrinos:padrino_id(id,nombre,tipo_apoyo,descripcion,logo_url)')
      .eq('caso_id', casoId);
    if (error) throw error;
    return data ?? [];
  },

  async listarParaMapa() {
    const { data, error } = await supabase
      .from('v_casos_publicos')
      .select('id, titulo, slug, barrio_slug, estado, lat, lng, categoria_codigo, categoria_color')
      .not('lat', 'is', null)
      .not('lng', 'is', null);
    if (error) throw error;
    return data ?? [];
  },

  async buscar(q: string, limit = 20) {
    const { data, error } = await supabase
      .from('v_casos_publicos')
      .select('id, titulo, slug, barrio_nombre, barrio_slug, categoria_codigo, estado, portada_url')
      .ilike('titulo', `%${q}%`)
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  // ----- ESCRITURA CMS -----
  async crear(input: unknown) {
    const data = casoCreateSchema.parse(input);
    const { data: row, error } = await supabase
      .from('casos')
      .insert(data)
      .select('id, slug')
      .single();
    if (error) throw error;
    return row;
  },

  async actualizar(input: unknown) {
    const data = casoUpdateSchema.parse(input);
    const { id, ...rest } = data;
    const { data: row, error } = await supabase
      .from('casos')
      .update(rest)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async cambiarEstado(casoId: string, nuevo: EstadoCaso, nota?: string) {
    const { error } = await supabase.rpc('cambiar_estado_caso', {
      p_caso_id: casoId,
      p_nuevo: nuevo,
      p_nota: nota ?? null,
    });
    if (error) throw error;
  },

  async agregarTimeline(casoId: string, payload: { tipo: 'nota'|'hito'|'reunion'|'foto'|'correccion', texto: string, ocurrido_en?: string }) {
    const { error } = await supabase.from('actualizaciones_caso').insert({
      caso_id: casoId, ...payload,
      ocurrido_en: payload.ocurrido_en ?? new Date().toISOString().slice(0,10),
    } as any);
    if (error) throw error;
  },
};
