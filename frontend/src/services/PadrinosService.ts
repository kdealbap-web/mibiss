import { supabase } from '../lib/supabase';
import type { TipoApoyo } from '../types/biss';

export type PadrinoTier = 'bronce' | 'plata' | 'oro';

export interface CrearPadrinoInput {
  nombre: string;
  tipo_apoyo: TipoApoyo;
  tier?: PadrinoTier | null;
  descripcion: string;
  contacto_privado_email: string;
  contacto_privado_tel?: string | null;
  /** Si se proporciona, además crea el vínculo en padrinos_caso. */
  caso_id?: string | null;
  /** Aporte específico al caso (puede ser igual a descripcion). */
  aporte_descripcion?: string | null;
}

export const PadrinosService = {
  /**
   * Inscribe un padrino. La RLS permite INSERT público con publicado=false.
   * Admin modera después desde /admin/padrinos.
   */
  async crear(input: CrearPadrinoInput) {
    const { data: padrino, error } = await supabase
      .from('padrinos')
      .insert({
        nombre: input.nombre,
        tipo_apoyo: input.tipo_apoyo,
        tier: input.tier ?? null,
        descripcion: input.descripcion,
        contacto_privado_email: input.contacto_privado_email,
        contacto_privado_tel: input.contacto_privado_tel ?? null,
        publicado: false, // pendiente moderación admin
      })
      .select('id, nombre, creado_en')
      .single();
    if (error) throw error;

    if (input.caso_id) {
      const { error: linkErr } = await supabase.from('padrinos_caso').insert({
        caso_id: input.caso_id,
        padrino_id: padrino.id,
        aporte_descripcion: input.aporte_descripcion ?? input.descripcion,
      });
      if (linkErr) throw linkErr;
    }

    return padrino as { id: string; nombre: string; creado_en: string };
  },

  /** Admin: marca publicado=true. */
  async publicar(padrinoId: string) {
    const { error } = await supabase
      .from('padrinos')
      .update({ publicado: true })
      .eq('id', padrinoId);
    if (error) throw error;
  },

  /** Admin: rechaza eliminando el registro (CASCADE limpia padrinos_caso). */
  async rechazar(padrinoId: string) {
    const { error } = await supabase
      .from('padrinos')
      .delete()
      .eq('id', padrinoId);
    if (error) throw error;
  },
};
