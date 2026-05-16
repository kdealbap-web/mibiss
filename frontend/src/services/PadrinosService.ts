import { supabase } from '../lib/supabase';
import type { TipoApoyo } from '../types/biss';

export interface CrearPadrinoInput {
  nombre: string;
  tipo_apoyo: TipoApoyo;
  descripcion?: string | null;
  contacto_privado_email?: string | null;
  contacto_privado_tel?: string | null;
  /** Si se proporciona, además crea el vínculo en padrinos_caso. */
  caso_id?: string | null;
  aporte_descripcion?: string | null;
}

export const PadrinosService = {
  async crear(input: CrearPadrinoInput) {
    const { data: padrino, error } = await supabase
      .from('padrinos')
      .insert({
        nombre: input.nombre,
        tipo_apoyo: input.tipo_apoyo,
        descripcion: input.descripcion ?? null,
        contacto_privado_email: input.contacto_privado_email ?? null,
        contacto_privado_tel: input.contacto_privado_tel ?? null,
        publicado: false, // por defecto entra sin publicar; admin decide
      })
      .select('id, nombre, creado_en')
      .single();
    if (error) throw error;

    if (input.caso_id) {
      const { error: linkErr } = await supabase.from('padrinos_caso').insert({
        caso_id: input.caso_id,
        padrino_id: padrino.id,
        aporte_descripcion: input.aporte_descripcion ?? null,
      });
      if (linkErr) throw linkErr;
    }

    return padrino as { id: string; nombre: string; creado_en: string };
  },
};
