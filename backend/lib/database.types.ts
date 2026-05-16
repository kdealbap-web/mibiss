// =============================================================================
// database.types.ts · Tipado del esquema (idéntico al SQL del Ciclo 2)
// En producción regenerar con: supabase gen types typescript --project-id [REF]
// =============================================================================

export type EstadoCaso = 'borrador' | 'critico' | 'gestion' | 'resuelto' | 'archivado';
export type TipoMedia = 'foto' | 'video' | 'pdf';
export type TipoUpdate = 'nota' | 'cambio_estado' | 'hito' | 'reunion' | 'correccion' | 'foto';
export type EstadoCivil = 'soltero' | 'casado' | 'union_libre' | 'separado' | 'divorciado' | 'viudo' | 'no_indica';
export type Escolaridad =
  | 'ninguna' | 'primaria_incompleta' | 'primaria' | 'secundaria_incompleta' | 'secundaria'
  | 'tecnico' | 'tecnologo' | 'universitario_incompleto' | 'universitario' | 'postgrado';
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'duplicada';
export type OtpStatus = 'enviado' | 'verificado' | 'expirado' | 'fallido';
export type TipoApoyo = 'financiero' | 'material' | 'voluntario' | 'politico' | 'otro';
export type RolCMS = 'superadmin' | 'admin' | 'editor';

export interface Zona {
  id: number; codigo: string; nombre: string; color_hex: string; orden: number;
}
export interface Barrio {
  id: number; zona_id: number; codigo_oficial: string | null;
  nombre: string; slug: string; coord_lat: number | null; coord_lng: number | null;
  orden: number; creado_en: string;
}
export interface Categoria {
  id: number; codigo: string; nombre: string; icono: string; color_hex: string; orden: number;
}
export interface Capitulo {
  id: string; barrio_id: number; descripcion: string | null; imagen_portada_url: string | null;
  geocerca: GeoJSON.Polygon | null; activo: boolean; activado_en: string | null;
  activado_por: string | null; creado_en: string; actualizado_en: string;
}
export interface Caso {
  id: string; capitulo_id: string; categoria_id: number;
  titulo: string; slug: string; descripcion: string;
  estado: EstadoCaso; lat: number | null; lng: number | null;
  solicitud_origen_id: string | null;
  creado_por: string | null;
  publicado_en: string | null; resuelto_en: string | null;
  creado_en: string; actualizado_en: string;
}
export interface MultimediaCaso {
  id: string; caso_id: string; tipo: TipoMedia; url: string; thumb_url: string | null;
  nombre_original: string | null; bytes: number | null; orden: number;
  subido_por: string | null; creado_en: string;
}
export interface ActualizacionCaso {
  id: string; caso_id: string; tipo: TipoUpdate; texto: string;
  estado_anterior: EstadoCaso | null; estado_nuevo: EstadoCaso | null;
  autor_cms_id: string; ocurrido_en: string; creado_en: string;
}
export interface Ciudadano {
  id: string; auth_user_id: string | null; cedula: string;
  nombres: string; apellidos: string; fecha_nacimiento: string;
  barrio_id: number; estado_civil: EstadoCivil;
  direccion: string; email: string;
  telefono_celular: string; telefono_fijo: string | null;
  miembros_hogar: number; estrato: number; escolaridad: Escolaridad;
  verificado_sms: boolean; consentimiento_habeas_data: boolean;
  acepta_notificaciones: boolean;
  creado_en: string; eliminado_en: string | null;
}
export interface SolicitudCaso {
  id: string; ciudadano_id: string; barrio_id: number; categoria_id: number;
  titulo: string; descripcion: string; lat: number | null; lng: number | null;
  estado: EstadoSolicitud; revisado_por: string | null;
  motivo_rechazo: string | null; caso_generado_id: string | null;
  creado_en: string; revisado_en: string | null;
}
export interface Comentario {
  id: string; ciudadano_id: string; capitulo_id: string; caso_id: string | null;
  texto: string; oculto: boolean; motivo_oculto: string | null;
  editado_en: string | null; creado_en: string;
}
export interface Padrino {
  id: string; nombre: string; tipo_apoyo: TipoApoyo;
  descripcion: string | null; logo_url: string | null;
  contacto_privado_email: string | null; contacto_privado_tel: string | null;
  publicado: boolean; creado_en: string;
}
export interface UsuarioCMS {
  id: string; nombre: string; email: string; rol: RolCMS; activo: boolean; creado_en: string;
}

export type Database = {
  public: {
    Tables: {
      zonas: { Row: Zona; Insert: Partial<Zona>; Update: Partial<Zona> };
      barrios: { Row: Barrio; Insert: Partial<Barrio>; Update: Partial<Barrio> };
      categorias: { Row: Categoria; Insert: Partial<Categoria>; Update: Partial<Categoria> };
      capitulos: { Row: Capitulo; Insert: Partial<Capitulo>; Update: Partial<Capitulo> };
      casos: { Row: Caso; Insert: Partial<Caso>; Update: Partial<Caso> };
      multimedia_casos: { Row: MultimediaCaso; Insert: Partial<MultimediaCaso>; Update: Partial<MultimediaCaso> };
      actualizaciones_caso: { Row: ActualizacionCaso; Insert: Partial<ActualizacionCaso>; Update: Partial<ActualizacionCaso> };
      ciudadanos: { Row: Ciudadano; Insert: Partial<Ciudadano>; Update: Partial<Ciudadano> };
      solicitudes_caso: { Row: SolicitudCaso; Insert: Partial<SolicitudCaso>; Update: Partial<SolicitudCaso> };
      comentarios: { Row: Comentario; Insert: Partial<Comentario>; Update: Partial<Comentario> };
      padrinos: { Row: Padrino; Insert: Partial<Padrino>; Update: Partial<Padrino> };
      usuarios_cms: { Row: UsuarioCMS; Insert: Partial<UsuarioCMS>; Update: Partial<UsuarioCMS> };
    };
    Views: {
      v_capitulos_publicos: { Row: Capitulo & {
        barrio_nombre: string; barrio_slug: string; zona_nombre: string;
        zona_color: string; casos_total: number; casos_criticos: number;
        casos_gestion: number; casos_resueltos: number; estado_predominante: string;
      } };
      v_casos_publicos: { Row: Caso & {
        barrio_nombre: string; barrio_slug: string; categoria_codigo: string;
        categoria_icono: string; categoria_color: string; portada_url: string | null;
      } };
      mv_stats_globales: { Row: {
        barrios_total: number; capitulos_activos: number;
        casos_criticos: number; casos_gestion: number; casos_resueltos: number;
        casos_publicos: number; solicitudes_pendientes: number;
        ciudadanos_verificados: number; actualizado_en: string;
      } };
    };
    Functions: {
      slugify: { Args: { p_text: string }; Returns: string };
      cambiar_estado_caso: {
        Args: { p_caso_id: string; p_nuevo: EstadoCaso; p_nota?: string };
        Returns: void;
      };
      aprobar_solicitud: { Args: { p_solicitud_id: string }; Returns: string };
      eliminar_ciudadano_anonimizando: { Args: { p_ciudadano_id: string }; Returns: void };
    };
  };
};
