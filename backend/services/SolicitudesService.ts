// =============================================================================
// services/SolicitudesService.ts
// =============================================================================
import { supabase } from '../lib/supabase';
import { solicitudCasoSchema } from '../schemas';

export const SolicitudesService = {
  async crear(input: unknown, ciudadanoId: string) {
    const data = solicitudCasoSchema.parse(input);
    const { multimedia, ...rest } = data;
    const { data: row, error } = await supabase
      .from('solicitudes_caso')
      .insert({ ...rest, ciudadano_id: ciudadanoId })
      .select('id')
      .single();
    if (error) throw error;
    if (multimedia?.length) {
      const rows = multimedia.map((m: { tipo: 'foto'; url: string; orden: number }, i: number) => ({
        ...m, solicitud_id: row.id, orden: i,
      }));
      const { error: mErr } = await supabase.from('solicitud_multimedia').insert(rows);
      if (mErr) throw mErr;
    }
    return row;
  },

  async misSolicitudes() {
    const { data, error } = await supabase
      .from('solicitudes_caso')
      .select('id, titulo, estado, motivo_rechazo, caso_generado_id, creado_en, revisado_en')
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async pendientesAdmin() {
    const { data, error } = await supabase
      .from('v_solicitudes_pendientes')
      .select('*')
      .order('creado_en');
    if (error) throw error;
    return data ?? [];
  },

  async aprobar(solicitudId: string) {
    const { data, error } = await supabase.rpc('aprobar_solicitud', {
      p_solicitud_id: solicitudId,
    });
    if (error) throw error;
    return data; // caso_id (uuid)
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
