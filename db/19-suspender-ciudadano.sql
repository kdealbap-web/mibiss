-- ============================================================================
-- 19-suspender-ciudadano.sql · BISS Sprint F · F3
--
-- RPCs para que admin/superadmin pueda suspender (soft-delete) y reactivar
-- ciudadanos. RLS por defecto no permite UPDATE ajeno; estas RPC corren con
-- SECURITY DEFINER y validan rol en cuerpo.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.suspender_ciudadano(
  p_ciudadano_id uuid,
  p_motivo text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios_cms u
    WHERE u.id = auth.uid()
      AND u.activo = true
      AND u.rol IN ('admin', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'No autorizado. Solo admin/superadmin pueden suspender ciudadanos.';
  END IF;

  UPDATE public.ciudadanos
    SET eliminado_en = now()
    WHERE id = p_ciudadano_id AND eliminado_en IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciudadano no existe o ya está suspendido.';
  END IF;

  -- Motivo se guarda como nota descriptiva en una sola fila auxiliar
  -- (no creamos tabla de auditoría todavía — diferido a Sprint G).
  PERFORM 1; -- noop; p_motivo se loguea en aplicación si se decide más adelante
END $$;

CREATE OR REPLACE FUNCTION public.reactivar_ciudadano(
  p_ciudadano_id uuid
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios_cms u
    WHERE u.id = auth.uid()
      AND u.activo = true
      AND u.rol IN ('admin', 'superadmin')
  ) THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  UPDATE public.ciudadanos
    SET eliminado_en = NULL
    WHERE id = p_ciudadano_id AND eliminado_en IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ciudadano no existe o ya está activo.';
  END IF;
END $$;

COMMIT;
