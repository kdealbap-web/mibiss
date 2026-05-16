// =============================================================================
// services/CategoriasService.ts
// =============================================================================
import { supabase } from '../lib/supabase';

export interface CategoriaStats {
  id: number;
  codigo: string;
  nombre: string;
  icono: string;
  color_hex: string;
  orden: number;
  casos: number;
}

export const CategoriasService = {
  async listarConStats(): Promise<CategoriaStats[]> {
    const { data, error } = await supabase
      .from('v_stats_por_categoria')
      .select('*');
    if (error) throw error;
    return (data ?? []) as CategoriaStats[];
  },
};
