-- ============================================================================
-- 15-config-app.sql · BISS Sprint D · Bloque 6
--
-- Tabla key/value de configuración global del app (settings de moderación,
-- toggles de notificaciones por admin, prefijos de folio, etc.) consumida por
-- /admin/ajustes. Solo lectura/escritura por rol editor/admin (RLS).
--
-- Si la tabla ya existe con esquema distinto, NO ejecutar — revisar primero.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.config_app (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.config_app IS
  'Key/value de configuración global del app (BISS Sprint D · Bloque 6)';

ALTER TABLE public.config_app ENABLE ROW LEVEL SECURITY;

-- Helpers: ya existe public.is_admin() desde Sprint A. Si no, usar JWT directo.
DROP POLICY IF EXISTS config_app_select_cms ON public.config_app;
CREATE POLICY config_app_select_cms ON public.config_app
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_cms u
      WHERE u.id = auth.uid() AND u.activo = true
    )
  );

DROP POLICY IF EXISTS config_app_write_cms ON public.config_app;
CREATE POLICY config_app_write_cms ON public.config_app
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_cms u
      WHERE u.id = auth.uid()
        AND u.activo = true
        AND u.rol IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios_cms u
      WHERE u.id = auth.uid()
        AND u.activo = true
        AND u.rol IN ('admin', 'superadmin')
    )
  );

-- Seeds: claves por defecto.
INSERT INTO public.config_app (key, value) VALUES
  ('moderacion.pre_testimonios',     'true'::jsonb),
  ('moderacion.auto_marcar_criticos','false'::jsonb),
  ('moderacion.comentarios_publicos','true'::jsonb),
  ('moderacion.auto_archivar_dias',  '90'::jsonb),
  ('moderacion.palabras_filtradas',  '[]'::jsonb),
  ('folio.prefijo',                  '"CS"'::jsonb),
  ('notificaciones.email_criticos',  'true'::jsonb),
  ('notificaciones.email_resumen',   'false'::jsonb),
  ('notificaciones.slack_webhook',   '""'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ============================================================================
-- APLICACIÓN HUMANA (Kevin):
--   1. Supabase Dashboard → SQL Editor.
--   2. Pega este archivo completo.
--   3. Run.
--   4. Valida con: SELECT key, value FROM public.config_app;
--      Debe devolver 9 filas con los defaults.
--
-- Si la tabla `config_app` ya existe con otro esquema, NO ejecutes esto.
-- Documenta el conflicto en PORT_NOTES.md "Decisiones pendientes Sprint D".
-- ============================================================================
