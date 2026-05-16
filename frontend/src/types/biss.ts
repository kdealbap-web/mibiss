// =============================================================================
// Tipos derivados del esquema DB (db/01-schema.sql) + vistas (db/04-views.sql).
// Mantener en sincronía con la migración 10-migration-estado-caso.sql.
// =============================================================================

export type EstadoCaso =
  | 'pendiente'
  | 'critico'
  | 'progreso'
  | 'resuelto'
  | 'archivado';

export type CategoriaCodigo =
  | 'agua'
  | 'luz'
  | 'infraestructura'
  | 'salud'
  | 'educacion'
  | 'medio-ambiente'
  | 'social'
  | 'otros';

export type ZonaCodigo =
  | 'centro-norte'
  | 'occidental'
  | 'oriental'
  | 'sur'
  | 'sur-occidental';

export interface Zona {
  id: number;
  codigo: ZonaCodigo;
  nombre: string;
  color_hex: string;
  orden: number;
}

export interface Barrio {
  id: number;
  zona_id: number;
  codigo_oficial: string | null;
  nombre: string;
  slug: string;
  coord_lat: number | null;
  coord_lng: number | null;
  orden: number;
}

export interface Categoria {
  id: number;
  codigo: CategoriaCodigo | string;
  nombre: string;
  icono: string;
  color_hex: string;
  orden: number;
}

export interface CapituloPublico {
  capitulo_id: string;
  barrio_id: number;
  barrio_nombre: string;
  barrio_slug: string;
  zona_codigo: ZonaCodigo | string;
  zona_nombre: string;
  zona_color: string;
  coord_lat: number | null;
  coord_lng: number | null;
  descripcion: string | null;
  imagen_portada_url: string | null;
  geocerca: unknown;
  activado_en: string;
  casos_total: number;
  casos_criticos: number;
  casos_progreso: number;
  casos_resueltos: number;
  estado_predominante: EstadoCaso | 'sin_casos';
}

export interface CasoPublico {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  estado: EstadoCaso;
  lat: number | null;
  lng: number | null;
  publicado_en: string | null;
  resuelto_en: string | null;
  actualizado_en: string;
  capitulo_id: string;
  barrio_id: number;
  barrio_nombre: string;
  barrio_slug: string;
  zona_codigo: string;
  zona_color: string;
  categoria_codigo: string;
  categoria_nombre: string;
  categoria_icono: string;
  categoria_color: string;
  portada_url: string | null;
}

export interface StatsGlobales {
  barrios_total: number;
  capitulos_activos: number;
  casos_criticos: number;
  casos_progreso: number;
  casos_resueltos: number;
  casos_publicos: number;
  solicitudes_pendientes: number;
  ciudadanos_verificados: number;
  actualizado_en: string;
}

export interface StatsPorCategoria {
  id: number;
  codigo: string;
  nombre: string;
  icono: string;
  color_hex: string;
  orden: number;
  casos: number;
}
