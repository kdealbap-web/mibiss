-- ============================================================================
-- 01-schema.sql · BISS (Banco de Ideas y Soluciones de Soledad) · v1.1
-- Esquema 3FN de la plataforma. Compatible Supabase / PostgreSQL 15+.
-- Idempotente: usa IF NOT EXISTS / CREATE OR REPLACE donde aplica.
-- Orden de ejecución: 00-extensions → 01-schema → 02-rls → 03-functions → 04-views → 05-seed.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE public.estado_caso AS ENUM ('pendiente','critico','progreso','resuelto','archivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_media AS ENUM ('foto','video','pdf');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_update AS ENUM ('nota','cambio_estado','hito','reunion','correccion','foto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_civil AS ENUM ('soltero','casado','union_libre','separado','divorciado','viudo','no_indica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.escolaridad AS ENUM (
    'ninguna','primaria_incompleta','primaria','secundaria_incompleta','secundaria',
    'tecnico','tecnologo','universitario_incompleto','universitario','postgrado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_solicitud AS ENUM ('pendiente','aprobada','rechazada','duplicada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.otp_status AS ENUM ('enviado','verificado','expirado','fallido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_apoyo AS ENUM ('financiero','material','voluntario','politico','otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.rol_cms AS ENUM ('superadmin','admin','editor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. TABLAS DE LOOKUP (estables, smallint)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.zonas (
  id          smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      varchar(20)   UNIQUE NOT NULL,
  nombre      varchar(60)   NOT NULL,
  color_hex   char(7)       NOT NULL,
  orden       smallint      NOT NULL DEFAULT 0
);
COMMENT ON TABLE public.zonas IS 'Zonas administrativas del municipio de Soledad (5). NUNCA llamarlas "comunas" en UI.';

CREATE TABLE IF NOT EXISTS public.barrios (
  id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  zona_id         smallint NOT NULL REFERENCES public.zonas(id) ON DELETE RESTRICT,
  codigo_oficial  varchar(20)  UNIQUE,
  nombre          varchar(120) NOT NULL,
  slug            varchar(140) UNIQUE NOT NULL,
  coord_lat       numeric(10,7),
  coord_lng       numeric(10,7),
  orden           smallint NOT NULL DEFAULT 0,
  creado_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_barrios_zona      ON public.barrios(zona_id);
CREATE INDEX IF NOT EXISTS idx_barrios_nombre_tg ON public.barrios USING gin (public.f_unaccent(lower(nombre)) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.categorias (
  id          smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo      varchar(40)  UNIQUE NOT NULL,
  nombre      varchar(80)  NOT NULL,
  icono       varchar(40)  NOT NULL,
  color_hex   char(7)      NOT NULL,
  orden       smallint     NOT NULL DEFAULT 0
);

-- ============================================================================
-- 3. CMS USUARIOS (espejo de auth.users con rol)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.usuarios_cms (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      varchar(120) NOT NULL,
  email       citext UNIQUE NOT NULL,
  rol         public.rol_cms NOT NULL DEFAULT 'editor',
  activo      boolean NOT NULL DEFAULT true,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.editores_barrios (
  usuario_cms_id uuid     NOT NULL REFERENCES public.usuarios_cms(id) ON DELETE CASCADE,
  barrio_id      smallint NOT NULL REFERENCES public.barrios(id)      ON DELETE CASCADE,
  PRIMARY KEY (usuario_cms_id, barrio_id)
);

-- ============================================================================
-- 4. CAPÍTULOS (1:1 con barrio cuando se activa)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.capitulos (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barrio_id            smallint UNIQUE NOT NULL REFERENCES public.barrios(id) ON DELETE RESTRICT,
  descripcion          text,
  imagen_portada_url   text,
  geocerca             jsonb,                    -- GeoJSON Polygon
  activo               boolean NOT NULL DEFAULT false,
  activado_en          timestamptz,
  activado_por         uuid REFERENCES public.usuarios_cms(id) ON DELETE SET NULL,
  creado_en            timestamptz NOT NULL DEFAULT now(),
  actualizado_en       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_capitulos_activo_completo
    CHECK (activo = false OR (geocerca IS NOT NULL AND imagen_portada_url IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_capitulos_activo ON public.capitulos(activo) WHERE activo = true;

-- ============================================================================
-- 5. CIUDADANOS (con verificación OTP) y solicitudes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ciudadanos (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id                uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  cedula                      varchar(20)  UNIQUE NOT NULL,
  nombres                     varchar(80)  NOT NULL,
  apellidos                   varchar(80)  NOT NULL,
  fecha_nacimiento            date         NOT NULL,
  barrio_id                   smallint     NOT NULL REFERENCES public.barrios(id) ON DELETE RESTRICT,
  estado_civil                public.estado_civil NOT NULL DEFAULT 'no_indica',
  direccion                   varchar(180) NOT NULL,
  email                       citext       UNIQUE NOT NULL,
  telefono_celular            varchar(20)  NOT NULL,
  telefono_fijo               varchar(20),
  miembros_hogar              smallint     NOT NULL CHECK (miembros_hogar BETWEEN 1 AND 30),
  estrato                     smallint     NOT NULL CHECK (estrato BETWEEN 1 AND 6),
  escolaridad                 public.escolaridad NOT NULL DEFAULT 'ninguna',
  verificado_sms              boolean NOT NULL DEFAULT false,
  consentimiento_habeas_data  boolean NOT NULL DEFAULT false,
  acepta_notificaciones       boolean NOT NULL DEFAULT true,
  creado_en                   timestamptz NOT NULL DEFAULT now(),
  eliminado_en                timestamptz
);
CREATE INDEX IF NOT EXISTS idx_ciudadanos_barrio  ON public.ciudadanos(barrio_id);
CREATE INDEX IF NOT EXISTS idx_ciudadanos_email   ON public.ciudadanos(email);
CREATE INDEX IF NOT EXISTS idx_ciudadanos_celular ON public.ciudadanos(telefono_celular);

CREATE TABLE IF NOT EXISTS public.verificaciones_otp (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono      varchar(20) NOT NULL,
  ciudadano_id  uuid REFERENCES public.ciudadanos(id) ON DELETE SET NULL,
  twilio_sid    varchar(64),
  status        public.otp_status NOT NULL DEFAULT 'enviado',
  intentos      smallint NOT NULL DEFAULT 0,
  creado_en     timestamptz NOT NULL DEFAULT now(),
  expira_en     timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_otp_telefono_dia ON public.verificaciones_otp(telefono, creado_en);

-- ============================================================================
-- 6. CASOS y subordinadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.casos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capitulo_id           uuid NOT NULL REFERENCES public.capitulos(id) ON DELETE CASCADE,
  categoria_id          smallint NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
  titulo                varchar(160) NOT NULL,
  slug                  varchar(180) NOT NULL,
  descripcion           text NOT NULL,
  estado                public.estado_caso NOT NULL DEFAULT 'pendiente',
  lat                   numeric(10,7),
  lng                   numeric(10,7),
  solicitud_origen_id   uuid,                      -- FK declarada después (circular con solicitudes_caso)
  creado_por            uuid REFERENCES public.usuarios_cms(id) ON DELETE SET NULL,
  publicado_en          timestamptz,
  resuelto_en           timestamptz,
  creado_en             timestamptz NOT NULL DEFAULT now(),
  actualizado_en        timestamptz NOT NULL DEFAULT now(),
  search_tsv            tsvector
                        GENERATED ALWAYS AS (
                          setweight(to_tsvector('spanish', public.f_unaccent(coalesce(titulo,''))), 'A') ||
                          setweight(to_tsvector('spanish', public.f_unaccent(coalesce(descripcion,''))), 'B')
                        ) STORED,
  UNIQUE (capitulo_id, slug),
  CONSTRAINT chk_casos_resuelto CHECK (estado <> 'resuelto' OR resuelto_en IS NOT NULL),
  CONSTRAINT chk_casos_publicado CHECK (estado = 'pendiente' OR publicado_en IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_casos_capitulo  ON public.casos(capitulo_id);
CREATE INDEX IF NOT EXISTS idx_casos_categoria ON public.casos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_casos_estado    ON public.casos(estado);
CREATE INDEX IF NOT EXISTS idx_casos_search    ON public.casos USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS idx_casos_publicos  ON public.casos(publicado_en DESC) WHERE estado IN ('critico','progreso','resuelto');

CREATE TABLE IF NOT EXISTS public.multimedia_casos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id         uuid NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  tipo            public.tipo_media NOT NULL,
  url             text NOT NULL,
  thumb_url       text,
  nombre_original varchar(255),
  bytes           integer,
  orden           smallint NOT NULL DEFAULT 0,
  subido_por      uuid REFERENCES public.usuarios_cms(id) ON DELETE SET NULL,
  creado_en       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_media_size CHECK (
    bytes IS NULL OR
    (tipo = 'foto'  AND bytes <=  5 * 1024 * 1024) OR
    (tipo = 'video' AND bytes <= 30 * 1024 * 1024) OR
    (tipo = 'pdf'   AND bytes <= 10 * 1024 * 1024)
  )
);
CREATE INDEX IF NOT EXISTS idx_media_caso ON public.multimedia_casos(caso_id, orden);

CREATE TABLE IF NOT EXISTS public.actualizaciones_caso (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id           uuid NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  tipo              public.tipo_update NOT NULL,
  texto             text NOT NULL,
  estado_anterior   public.estado_caso,
  estado_nuevo      public.estado_caso,
  autor_cms_id      uuid NOT NULL REFERENCES public.usuarios_cms(id) ON DELETE RESTRICT,
  ocurrido_en       date NOT NULL DEFAULT current_date,
  creado_en         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_act_caso ON public.actualizaciones_caso(caso_id, ocurrido_en DESC);

-- ============================================================================
-- 7. SOLICITUDES CIUDADANAS (FK circular con casos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.solicitudes_caso (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciudadano_id       uuid NOT NULL REFERENCES public.ciudadanos(id) ON DELETE CASCADE,
  barrio_id          smallint NOT NULL REFERENCES public.barrios(id) ON DELETE RESTRICT,
  categoria_id       smallint NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
  titulo             varchar(160) NOT NULL,
  descripcion        text NOT NULL,
  lat                numeric(10,7),
  lng                numeric(10,7),
  estado             public.estado_solicitud NOT NULL DEFAULT 'pendiente',
  revisado_por       uuid REFERENCES public.usuarios_cms(id) ON DELETE SET NULL,
  motivo_rechazo     text,
  caso_generado_id   uuid REFERENCES public.casos(id) ON DELETE SET NULL,
  creado_en          timestamptz NOT NULL DEFAULT now(),
  revisado_en        timestamptz,
  CONSTRAINT chk_solicitud_aprobada CHECK (estado <> 'aprobada' OR caso_generado_id IS NOT NULL),
  CONSTRAINT chk_solicitud_rechazada CHECK (estado <> 'rechazada' OR motivo_rechazo IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON public.solicitudes_caso(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_ciud   ON public.solicitudes_caso(ciudadano_id);

-- Cerrar FK circular casos.solicitud_origen_id → solicitudes_caso.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_casos_solicitud_origen'
  ) THEN
    ALTER TABLE public.casos
      ADD CONSTRAINT fk_casos_solicitud_origen
      FOREIGN KEY (solicitud_origen_id) REFERENCES public.solicitudes_caso(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.solicitud_multimedia (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id    uuid NOT NULL REFERENCES public.solicitudes_caso(id) ON DELETE CASCADE,
  tipo            public.tipo_media NOT NULL,
  url             text NOT NULL,
  thumb_url       text,
  orden           smallint NOT NULL DEFAULT 0,
  creado_en       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_solmedia_sol ON public.solicitud_multimedia(solicitud_id, orden);

-- ============================================================================
-- 8. COMENTARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.comentarios (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciudadano_id  uuid NOT NULL REFERENCES public.ciudadanos(id) ON DELETE CASCADE,
  capitulo_id   uuid NOT NULL REFERENCES public.capitulos(id)  ON DELETE CASCADE,
  caso_id       uuid REFERENCES public.casos(id) ON DELETE CASCADE,
  texto         text NOT NULL CHECK (length(texto) BETWEEN 2 AND 1500),
  oculto        boolean NOT NULL DEFAULT false,
  motivo_oculto text,
  editado_en    timestamptz,
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comentarios_caso     ON public.comentarios(caso_id) WHERE caso_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comentarios_capitulo ON public.comentarios(capitulo_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_publicos ON public.comentarios(creado_en DESC) WHERE oculto = false;

-- ============================================================================
-- 9. PADRINOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.padrinos (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                      varchar(140) NOT NULL,
  tipo_apoyo                  public.tipo_apoyo NOT NULL,
  descripcion                 text,
  logo_url                    text,
  contacto_privado_email      citext,
  contacto_privado_tel        varchar(20),
  publicado                   boolean NOT NULL DEFAULT true,
  creado_en                   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.padrinos_caso (
  caso_id              uuid NOT NULL REFERENCES public.casos(id)     ON DELETE CASCADE,
  padrino_id           uuid NOT NULL REFERENCES public.padrinos(id)  ON DELETE CASCADE,
  aporte_descripcion   text,
  desde                date,
  hasta                date,
  PRIMARY KEY (caso_id, padrino_id)
);

-- ============================================================================
-- 10. AUDITORÍA y SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accion       varchar(60) NOT NULL,
  entidad      varchar(40) NOT NULL,
  entidad_id   text,
  diff         jsonb,
  ip           inet,
  user_agent   text,
  creado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entidad ON public.audit_log(entidad, entidad_id, creado_en DESC);

CREATE TABLE IF NOT EXISTS public.settings (
  key    text PRIMARY KEY,
  value  jsonb NOT NULL
);

COMMIT;
