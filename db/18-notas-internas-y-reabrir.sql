-- ============================================================================
-- 18-notas-internas-y-reabrir.sql · BISS Sprint F · F2
--
-- 1. Tabla public.caso_notas_internas para notas privadas del equipo CMS.
-- 2. RPC public.reabrir_caso(p_caso_id) para des-archivar.
-- ============================================================================

BEGIN;

-- ─── 1. Tabla notas internas ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.caso_notas_internas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id       uuid NOT NULL REFERENCES public.casos(id) ON DELETE CASCADE,
  autor_cms_id  uuid NOT NULL REFERENCES public.usuarios_cms(id) ON DELETE RESTRICT,
  texto         text NOT NULL CHECK (length(trim(texto)) >= 1),
  creado_en     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notas_caso ON public.caso_notas_internas(caso_id, creado_en DESC);

COMMENT ON TABLE public.caso_notas_internas IS
  'Notas privadas del equipo CMS sobre un caso. NUNCA visibles al ciudadano (Sprint F · F2).';

ALTER TABLE public.caso_notas_internas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notas_internas_select_cms ON public.caso_notas_internas;
CREATE POLICY notas_internas_select_cms ON public.caso_notas_internas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_cms u
      WHERE u.id = auth.uid() AND u.activo = true
    )
  );

DROP POLICY IF EXISTS notas_internas_insert_cms ON public.caso_notas_internas;
CREATE POLICY notas_internas_insert_cms ON public.caso_notas_internas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios_cms u
      WHERE u.id = auth.uid() AND u.activo = true
    )
    AND autor_cms_id = auth.uid()
  );

-- Delete solo por autor o admin (no editor general).
DROP POLICY IF EXISTS notas_internas_delete_propio ON public.caso_notas_internas;
CREATE POLICY notas_internas_delete_propio ON public.caso_notas_internas
  FOR DELETE
  USING (
    autor_cms_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.usuarios_cms u
      WHERE u.id = auth.uid()
        AND u.activo = true
        AND u.rol IN ('admin', 'superadmin')
    )
  );

-- ─── 2. RPC reabrir_caso ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reabrir_caso(p_caso_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_estado_actual public.estado_caso;
BEGIN
  IF NOT public.is_editor_o_admin() THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  SELECT estado INTO v_estado_actual FROM public.casos WHERE id = p_caso_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caso no existe.';
  END IF;
  IF v_estado_actual <> 'archivado' THEN
    RAISE EXCEPTION 'Solo casos archivados se pueden reabrir. Estado actual: %', v_estado_actual;
  END IF;

  UPDATE public.casos
    SET estado = 'pendiente',
        resuelto_en = NULL,
        actualizado_en = now()
    WHERE id = p_caso_id;

  INSERT INTO public.actualizaciones_caso (caso_id, tipo, texto, estado_anterior, estado_nuevo, autor_cms_id, ocurrido_en)
  VALUES (p_caso_id, 'cambio_estado', 'Caso reabierto para re-evaluación.', 'archivado', 'pendiente', auth.uid(), current_date);
END $$;

COMMIT;
