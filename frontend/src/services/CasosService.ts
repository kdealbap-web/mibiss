import { supabase } from '../lib/supabase';
import type { EstadoCaso, TipoUpdate } from '../types/biss';

export const CasosService = {
  /** RPC: cambia estado de caso + agrega entrada en actualizaciones_caso. */
  async cambiarEstado(casoId: string, nuevo: EstadoCaso, nota?: string) {
    const { error } = await supabase.rpc('cambiar_estado_caso', {
      p_caso_id: casoId,
      p_nuevo: nuevo,
      p_nota: nota ?? null,
    });
    if (error) throw error;
  },

  async actualizar(
    casoId: string,
    patch: Partial<{
      titulo: string;
      descripcion: string;
      lat: number | null;
      lng: number | null;
      categoria_id: number;
    }>,
  ) {
    const { error } = await supabase.from('casos').update(patch).eq('id', casoId);
    if (error) throw error;
  },

  async agregarActualizacion(input: {
    caso_id: string;
    tipo: TipoUpdate;
    texto: string;
    estado_anterior?: EstadoCaso | null;
    estado_nuevo?: EstadoCaso | null;
    autor_cms_id: string;
    ocurrido_en?: string;
  }) {
    const { error } = await supabase.from('actualizaciones_caso').insert({
      caso_id: input.caso_id,
      tipo: input.tipo,
      texto: input.texto,
      estado_anterior: input.estado_anterior ?? null,
      estado_nuevo: input.estado_nuevo ?? null,
      autor_cms_id: input.autor_cms_id,
      ocurrido_en: input.ocurrido_en ?? new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
  },
};
