-- ============================================================================
-- 30-testimonios-anon.sql · BISS · Testimonios anónimos públicos
--
-- Permite a usuarios SIN sesión (anon) crear testimonios.
-- Reglas:
--   • ciudadano_id DEBE ser NULL (sin sesión).
--   • estado fuerza 'pendiente' (default ya lo es; verificamos en WITH CHECK).
--   • capitulo_id o caso_id obligatorio (check existente lo cubre).
-- Los testimonios anónimos pasan igual por moderación admin.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS p_testimonios_insert_anon ON public.testimonios;
CREATE POLICY p_testimonios_insert_anon
ON public.testimonios
FOR INSERT
TO anon, authenticated
WITH CHECK (
  ciudadano_id IS NULL
  AND estado = 'pendiente'
);

COMMIT;

-- Verificación
SELECT polname, polcmd FROM pg_policy WHERE polrelid='public.testimonios'::regclass ORDER BY polname;
