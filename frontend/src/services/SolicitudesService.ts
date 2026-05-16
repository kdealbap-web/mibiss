import { supabase } from '../lib/supabase';

export interface CrearSolicitudInput {
  ciudadano_id: string;
  barrio_id: number;
  categoria_id: number;
  titulo: string;
  descripcion: string;
  lat?: number | null;
  lng?: number | null;
}

export const SolicitudesService = {
  async crear(input: CrearSolicitudInput) {
    const { data, error } = await supabase
      .from('solicitudes_caso')
      .insert({
        ciudadano_id: input.ciudadano_id,
        barrio_id: input.barrio_id,
        categoria_id: input.categoria_id,
        titulo: input.titulo,
        descripcion: input.descripcion,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
      })
      .select('id, titulo, creado_en')
      .single();
    if (error) throw error;
    return data as { id: string; titulo: string; creado_en: string };
  },

  /** RPC público — el caller debe ser editor/admin (RLS). */
  async aprobar(solicitudId: string) {
    const { data, error } = await supabase.rpc('aprobar_solicitud', {
      p_solicitud_id: solicitudId,
    });
    if (error) throw error;
    return data as string; // caso_id
  },

  async rechazar(solicitudId: string, motivo: string) {
    const { error } = await supabase
      .from('solicitudes_caso')
      .update({
        estado: 'rechazada',
        motivo_rechazo: motivo,
        revisado_en: new Date().toISOString(),
      })
      .eq('id', solicitudId);
    if (error) throw error;
  },
};
