-- ============================================================================
-- 25-padrinos-tier.sql · BISS
--
-- Añade tier de aporte (bronce / plata / oro) a public.padrinos.
-- El tier es declarativo del padrino, no calculado. Se usa como indicador
-- visual del nivel de compromiso al apadrinar.
-- ============================================================================

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.padrino_tier AS ENUM ('bronce', 'plata', 'oro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.padrinos
  ADD COLUMN IF NOT EXISTS tier public.padrino_tier;

COMMENT ON COLUMN public.padrinos.tier IS
  'Nivel declarativo del aporte: bronce (apoyo puntual) | plata (recurrente) | oro (sostenido). NULL = sin definir.';

COMMIT;
