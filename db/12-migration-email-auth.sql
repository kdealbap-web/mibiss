-- ============================================================================
-- db/12-migration-email-auth.sql · BISS
-- Migra ciudadanos de verificación SMS → Email OTP (Resend SMTP custom).
-- Idempotente: re-ejecutable sin efectos secundarios.
-- ============================================================================

BEGIN;

-- 1. Agregar columna verificado_email (default false)
ALTER TABLE public.ciudadanos
  ADD COLUMN IF NOT EXISTS verificado_email boolean NOT NULL DEFAULT false;

-- 2. Hacer telefono_celular opcional (ya no es la fuente de verdad de auth)
ALTER TABLE public.ciudadanos
  ALTER COLUMN telefono_celular DROP NOT NULL;

-- 3. Hacer email obligatorio (es la nueva fuente de verdad)
-- Primero asegurar que no haya nulls existentes (dev@biss.local ya tiene email)
UPDATE public.ciudadanos
  SET email = 'sin-email-' || id::text || '@migracion.biss.local'
  WHERE email IS NULL OR email = '';

ALTER TABLE public.ciudadanos
  ALTER COLUMN email SET NOT NULL;

-- 4. Asegurar email único (case-insensitive)
-- El schema original ya tiene UNIQUE sobre email (citext, así que case-insensitive).
-- Crear índice funcional adicional por si el tipo cambia en el futuro.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ciudadanos_email_lower_unique
  ON public.ciudadanos (lower(email::text));

-- 5. Backfill: si verificado_sms=true, considerar verificado_email=true
-- (para no romper dev@biss.local ni cualquier ciudadano legacy)
UPDATE public.ciudadanos
  SET verificado_email = true
  WHERE verificado_sms = true;

-- 6. NO eliminamos verificado_sms todavía (deprecación gradual)
COMMENT ON COLUMN public.ciudadanos.verificado_sms
  IS 'DEPRECATED: usar verificado_email. Se eliminará después del lanzamiento estable.';

-- 7-9. Actualizar RLS de tablas que gatean por verificación.
-- Cada sección se ejecuta solo si la tabla existe — así la migración es
-- order-agnostic respecto a 09-testimonios.sql u otras tablas opcionales.

DO $$
BEGIN
  -- 7. testimonios.insert
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'testimonios'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS testimonios_insert_verificado ON public.testimonios';
    EXECUTE 'DROP POLICY IF EXISTS p_testimonios_insert_verificado ON public.testimonios';
    EXECUTE 'DROP POLICY IF EXISTS p_testimonios_insert_self ON public.testimonios';
    EXECUTE $POL$
      CREATE POLICY p_testimonios_insert_verificado ON public.testimonios
        FOR INSERT TO authenticated
        WITH CHECK (
          ciudadano_id IN (
            SELECT id FROM public.ciudadanos
            WHERE auth_user_id = auth.uid()
              AND verificado_email = true
          )
        )
    $POL$;
  END IF;

  -- 8. solicitudes_caso.insert (tabla viene de 01-schema, siempre debería existir)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'solicitudes_caso'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS p_solicitudes_insert_self ON public.solicitudes_caso';
    EXECUTE 'DROP POLICY IF EXISTS solicitudes_caso_insert_verificado ON public.solicitudes_caso';
    EXECUTE $POL$
      CREATE POLICY p_solicitudes_insert_self ON public.solicitudes_caso
        FOR INSERT TO authenticated
        WITH CHECK (
          ciudadano_id IN (
            SELECT id FROM public.ciudadanos
            WHERE auth_user_id = auth.uid()
              AND verificado_email = true
          )
        )
    $POL$;
  END IF;

  -- 9. comentarios.insert
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comentarios'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS p_comentarios_insert ON public.comentarios';
    EXECUTE $POL$
      CREATE POLICY p_comentarios_insert ON public.comentarios
        FOR INSERT TO authenticated
        WITH CHECK (
          ciudadano_id IN (
            SELECT id FROM public.ciudadanos
            WHERE auth_user_id = auth.uid()
              AND verificado_email = true
          )
        )
    $POL$;
  END IF;
END $$;

-- 10. Función trigger: cuando un auth.user confirma email, marcar verificado_email
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at <> NEW.email_confirmed_at) THEN
    UPDATE public.ciudadanos
      SET verificado_email = true
      WHERE auth_user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_email_verified ON auth.users;
CREATE TRIGGER trg_sync_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_verified();

COMMIT;

-- Verificación
SELECT
  COUNT(*) FILTER (WHERE verificado_email = true) AS verificados_email,
  COUNT(*) FILTER (WHERE verificado_sms   = true) AS verificados_sms_legacy,
  COUNT(*) AS total
FROM public.ciudadanos;
