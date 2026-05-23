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
  creado_en?: string | null;
  reportado_por_nombre?: string | null;
  reportado_en?: string | null;
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

// =============================================================================
// Entidades de detalle (no expuestas en vistas públicas)
// =============================================================================

export type RelacionTestimonio = 'vecino' | 'victima' | 'lider' | 'familiar' | 'otro';
export type EstadoTestimonio = 'pendiente' | 'aprobado' | 'rechazado' | 'oculto';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'duplicada';
export type TipoApoyo = 'financiero' | 'material' | 'voluntario' | 'politico' | 'otro';
export type TipoMedia = 'foto' | 'video' | 'pdf';
export type TipoUpdate = 'nota' | 'cambio_estado' | 'hito' | 'reunion' | 'correccion' | 'foto';

export interface Testimonio {
  id: string;
  ciudadano_id: string | null;
  firmar_como: string | null;
  relacion: RelacionTestimonio;
  mensaje: string;
  capitulo_id: string | null;
  caso_id: string | null;
  estado: EstadoTestimonio;
  motivo_rechazo: string | null;
  creado_en: string;
  moderado_en: string | null;
  moderado_por: string | null;
}

export interface TestimonioPublico {
  id: string;
  relacion: RelacionTestimonio;
  mensaje: string;
  capitulo_id: string | null;
  caso_id: string | null;
  creado_en: string;
  autor_visible: string;
}

export interface TestimonioPendiente {
  id: string;
  relacion: RelacionTestimonio;
  mensaje: string;
  firmar_como: string | null;
  capitulo_id: string | null;
  caso_id: string | null;
  creado_en: string;
  ciudadano_nombre: string | null;
  ciudadano_telefono: string | null;
}

export interface Comentario {
  id: string;
  ciudadano_id: string;
  capitulo_id: string;
  caso_id: string | null;
  texto: string;
  oculto: boolean;
  motivo_oculto: string | null;
  editado_en: string | null;
  creado_en: string;
}

export interface ActualizacionCaso {
  id: string;
  caso_id: string;
  tipo: TipoUpdate;
  texto: string;
  estado_anterior: EstadoCaso | null;
  estado_nuevo: EstadoCaso | null;
  autor_cms_id: string;
  ocurrido_en: string;
  creado_en: string;
}

export type PadrinoTier = 'bronce' | 'plata' | 'oro';

export interface Padrino {
  id: string;
  nombre: string;
  tipo_apoyo: TipoApoyo;
  tier: PadrinoTier | null;
  descripcion: string;
  logo_url: string | null;
  contacto_privado_email: string;
  contacto_privado_tel: string | null;
  publicado: boolean;
  creado_en: string;
}

export interface PadrinoCaso {
  caso_id: string;
  padrino_id: string;
  aporte_descripcion: string | null;
  desde: string | null;
  hasta: string | null;
}

export interface SolicitudPendiente {
  id: string;
  titulo: string;
  descripcion: string;
  lat: number | null;
  lng: number | null;
  creado_en: string;
  estado: EstadoSolicitud;
  fotos_urls: string[];
  ciudadano_id: string;
  ciudadano: string;
  telefono_celular: string | null;
  ciudadano_email: string | null;
  barrio_id: number;
  barrio: string;
  categoria_codigo: string;
  categoria: string;
}

export interface UsuarioCms {
  id: string;
  nombre: string;
  email: string;
  rol: 'superadmin' | 'admin' | 'editor';
  activo: boolean;
  creado_en: string;
}

export interface Ciudadano {
  id: string;
  auth_user_id: string | null;
  cedula: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  barrio_id: number;
  estado_civil: string;
  direccion: string;
  email: string;
  telefono_celular: string | null;
  telefono_fijo: string | null;
  miembros_hogar: number;
  estrato: number;
  escolaridad: string;
  /** @deprecated usar verificado_email. Se elimina post-lanzamiento. */
  verificado_sms: boolean;
  verificado_email: boolean;
  consentimiento_habeas_data: boolean;
  acepta_notificaciones: boolean;
  creado_en: string;
  eliminado_en: string | null;
}

export interface CasoDetalle {
  id: string;
  capitulo_id: string;
  categoria_id: number;
  titulo: string;
  slug: string;
  descripcion: string;
  estado: EstadoCaso;
  lat: number | null;
  lng: number | null;
  solicitud_origen_id: string | null;
  creado_por: string | null;
  publicado_en: string | null;
  resuelto_en: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface MultimediaCaso {
  id: string;
  caso_id: string;
  tipo: TipoMedia;
  url: string;
  thumb_url: string | null;
  nombre_original: string | null;
  bytes: number | null;
  orden: number;
  subido_por: string | null;
  creado_en: string;
}
