-- =============================================================================
-- 09-testimonios.sql — Voces de los vecinos asociadas a un caso o un capítulo.
-- Patrón replicado de comentarios + solicitudes_caso (RLS, moderación).
-- Aplicar manualmente en Supabase tras revisar los demás archivos del directorio db/.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.testimonios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciudadano_id    uuid REFERENCES public.ciudadanos(id) ON DELETE SET NULL,
  firmar_como     text,
  relacion        text NOT NULL CHECK (relacion IN ('vecino','victima','lider','familiar','otro')),
  mensaje         text NOT NULL CHECK (length(mensaje) BETWEEN 20 AND 1500),
  capitulo_id     uuid REFERENCES public.capitulos(id) ON DELETE CASCADE,
  caso_id         uuid REFERENCES public.casos(id) ON DELETE CASCADE,
  CHECK (capitulo_id IS NOT NULL OR caso_id IS NOT NULL),
  estado          text NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','aprobado','rechazado','oculto')),
  motivo_rechazo  text,
  creado_en       timestamptz NOT NULL DEFAULT now(),
  moderado_en     timestamptz,
  moderado_por    uuid REFERENCES public.usuarios_cms(id)
);

CREATE INDEX IF NOT EXISTS idx_testimonios_capitulo
  ON public.testimonios(capitulo_id) WHERE estado = 'aprobado';
CREATE INDEX IF NOT EXISTS idx_testimonios_caso
  ON public.testimonios(caso_id) WHERE estado = 'aprobado';
CREATE INDEX IF NOT EXISTS idx_testimonios_pendientes
  ON public.testimonios(creado_en) WHERE estado = 'pendiente';

ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_testimonios_select_pub ON public.testimonios;
CREATE POLICY p_testimonios_select_pub ON public.testimonios FOR SELECT
  USING (estado = 'aprobado');

DROP POLICY IF EXISTS p_testimonios_insert_self ON public.testimonios;
CREATE POLICY p_testimonios_insert_self ON public.testimonios FOR INSERT
  WITH CHECK (
    ciudadano_id IN (
      SELECT id FROM public.ciudadanos
      WHERE auth_user_id = auth.uid() AND verificado_sms = true
    )
  );

DROP POLICY IF EXISTS p_testimonios_admin_all ON public.testimonios;
CREATE POLICY p_testimonios_admin_all ON public.testimonios FOR ALL
  USING (public.is_editor_o_admin())
  WITH CHECK (public.is_editor_o_admin());

CREATE OR REPLACE VIEW public.v_testimonios_publicos AS
SELECT
  t.id,
  t.relacion,
  t.mensaje,
  t.capitulo_id,
  t.caso_id,
  t.creado_en,
  COALESCE(t.firmar_como, 'Anónimo') AS autor_visible
FROM public.testimonios t
WHERE t.estado = 'aprobado';

GRANT SELECT ON public.v_testimonios_publicos TO anon, authenticated;

CREATE OR REPLACE VIEW public.v_testimonios_pendientes AS
SELECT
  t.id,
  t.relacion,
  t.mensaje,
  t.firmar_como,
  t.capitulo_id,
  t.caso_id,
  t.creado_en,
  c.nombres || ' ' || c.apellidos AS ciudadano_nombre,
  c.telefono_celular              AS ciudadano_telefono
FROM public.testimonios t
LEFT JOIN public.ciudadanos c ON c.id = t.ciudadano_id
WHERE t.estado = 'pendiente'
ORDER BY t.creado_en;

GRANT SELECT ON public.v_testimonios_pendientes TO authenticated;
