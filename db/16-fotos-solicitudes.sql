-- ============================================================================
-- 16-fotos-solicitudes.sql · BISS Sprint E · Bloque 1 (Upload R2)
--
-- Añade `fotos_urls text[]` a public.solicitudes_caso para que la solicitud
-- pueda traer las URLs de R2 subidas por el ciudadano. Cuando un editor
-- aprueba la solicitud y crea el caso (Bloque E2), las URLs se copian a
-- public.multimedia_casos con `subido_por = NULL`.
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS.
-- ============================================================================

BEGIN;

ALTER TABLE public.solicitudes_caso
  ADD COLUMN IF NOT EXISTS fotos_urls text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.solicitudes_caso.fotos_urls IS
  'URLs públicas de R2 (https://media.mibiss.com.co/solicitudes-multimedia/...) subidas por el ciudadano al reportar. Se copian a multimedia_casos cuando el editor aprueba.';

COMMIT;

-- ============================================================================
-- APLICACIÓN HUMANA:
--   Esta migración es safe: ADD COLUMN con DEFAULT array vacío. Sin lock largo.
--   Validación: SELECT array_length(fotos_urls, 1) FROM solicitudes_caso LIMIT 1;
-- ============================================================================
