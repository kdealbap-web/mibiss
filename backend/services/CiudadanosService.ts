// =============================================================================
// services/CiudadanosService.ts
// =============================================================================
import { supabase } from '../lib/supabase';
import { ciudadanoRegistroSchema, type CiudadanoRegistro } from '../schemas';

export const CiudadanosService = {
  /**
   * Registro previo a OTP. Crea fila en `ciudadanos` con verificado_sms=false.
   * Devuelve el id para el flujo OTP.
   */
  async preRegistrar(input: CiudadanoRegistro) {
    const data = ciudadanoRegistroSchema.parse(input);
    const { data: row, error } = await supabase
      .from('ciudadanos')
      .insert({ ...data, verificado_sms: false })
      .select('id, telefono_celular')
      .single();
    if (error) throw error;
    return row;
  },

  async miPerfil() {
    const { data, error } = await supabase
      .from('ciudadanos')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async actualizarMiPerfil(input: Partial<CiudadanoRegistro>) {
    const { data, error } = await supabase
      .from('ciudadanos')
      .update(input as any)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async eliminarCuenta(ciudadanoId: string) {
    const { error } = await supabase.rpc('eliminar_ciudadano_anonimizando', {
      p_ciudadano_id: ciudadanoId,
    });
    if (error) throw error;
  },
};
