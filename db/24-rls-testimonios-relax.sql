-- ============================================================================
-- 24-rls-testimonios-relax.sql · BISS
--
-- Quita el requisito de `verificado_email = true` para INSERT en testimonios.
-- El testimonio público no requiere validación adicional: basta con tener
-- sesión y un ciudadano vinculado al auth.uid().
--
-- La validación de email sigue VIGENTE para insertar solicitudes_caso
-- (reportar caso), donde sí queremos identificar al reportante.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS p_testimonios_insert_self ON public.testimonios;
CREATE POLICY p_testimonios_insert_self ON public.testimonios
  FOR INSERT
  WITH CHECK (
    ciudadano_id IN (
      SELECT id FROM public.ciudadanos
      WHERE auth_user_id = auth.uid()
        AND eliminado_en IS NULL
    )
  );

COMMIT;
