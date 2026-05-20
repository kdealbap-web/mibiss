-- ============================================================================
-- 26-rls-solicitudes-relax.sql · BISS
--
-- Quita el requisito de `verificado_email = true` para INSERT en
-- solicitudes_caso. Basta con tener un ciudadano vinculado al auth.uid().
--
-- Por qué: el trigger `sync_email_verified` no siempre marca verificado_email
-- inmediatamente tras OTP, lo que bloqueaba a ciudadanos nuevos al intentar
-- reportar su primer caso. La verificación de email ya quedó implícita por
-- el simple hecho de tener una sesión válida + ciudadano creado durante el
-- flujo de registro OTP.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS p_solicitudes_insert_self ON public.solicitudes_caso;
CREATE POLICY p_solicitudes_insert_self ON public.solicitudes_caso
  FOR INSERT
  WITH CHECK (
    ciudadano_id IN (
      SELECT id FROM public.ciudadanos
      WHERE auth_user_id = auth.uid()
        AND eliminado_en IS NULL
    )
  );

COMMIT;
