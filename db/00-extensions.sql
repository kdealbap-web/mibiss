-- ============================================================================
-- 00-extensions.sql · BISS (Banco de Ideas y Soluciones de Soledad)
-- Extensiones requeridas en Supabase. Ejecutar primero, una sola vez.
-- ============================================================================

-- UUIDs (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- citext para email case-insensitive UNIQUE
CREATE EXTENSION IF NOT EXISTS "citext";

-- Búsqueda fuzzy + trigramas (para barrio/caso search)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- unaccent para slugify y busquedas sin tildes
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Wrapper IMMUTABLE de unaccent para usar en índices y columnas GENERATED.
-- unaccent() es STABLE por defecto (depende de diccionario), por eso PostgreSQL
-- rechaza su uso directo en index expressions / generated columns.
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, $1);
$$;

-- (Opcional, fase 2 si se usa PostGIS para geocercas reales)
-- CREATE EXTENSION IF NOT EXISTS "postgis";
