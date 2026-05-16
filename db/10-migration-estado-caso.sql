-- ============================================================================
-- 10-migration-estado-caso.sql · BISS
-- Migración del enum estado_caso para alinearse con el HANDOFF §7.1.
--
--   Antes (legacy "La Bitácora de Soledad"):
--     ('borrador','critico','gestion','resuelto','archivado')
--   Después (BISS, contractual):
--     ('pendiente','critico','progreso','resuelto','archivado')
--
-- Mapeo de valores:
--     borrador → pendiente
--     gestion  → progreso
--     critico, resuelto, archivado → sin cambio
--
-- Estrategia: ALTER TYPE ... RENAME VALUE actualiza datos, CHECK constraints,
-- vistas y policies automáticamente (OID interno permanece). Solo es necesario
-- recrear las funciones plpgsql que comparan estado con literales (los literales
-- en PL/pgSQL se castean en runtime, no en CREATE FUNCTION).
--
-- Idempotente: usa IF/EXISTS para poder ejecutarse aún si la migración ya corrió.
-- Ejecutar UNA VEZ en Supabase SQL Editor.
-- ============================================================================

BEGIN;

-- ─── 1. Renombrar valores del enum ──────────────────────────────────────────
-- ALTER TYPE ... RENAME VALUE es transaccional en Postgres 12+.
-- El OID del valor no cambia, así que defaults, CHECKs, vistas, RLS, índices
-- parciales y datos en columnas se actualizan automáticamente.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'estado_caso' AND e.enumlabel = 'borrador'
  ) THEN
    ALTER TYPE public.estado_caso RENAME VALUE 'borrador' TO 'pendiente';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'estado_caso' AND e.enumlabel = 'gestion'
  ) THEN
    ALTER TYPE public.estado_caso RENAME VALUE 'gestion' TO 'progreso';
  END IF;
END $$;

-- ─── 2. Recrear funciones plpgsql que tenían literales 'borrador'/'gestion' ──
-- Estas funciones referencian literales como strings → Postgres los parsea
-- a OID en cada ejecución; con el rename, los literales viejos ya no existen.

CREATE OR REPLACE FUNCTION public.tg_caso_estado_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Cuando pasa de pendiente → publicado
  IF OLD.estado = 'pendiente' AND NEW.estado <> 'pendiente' AND NEW.publicado_en IS NULL THEN
    NEW.publicado_en := now();
  END IF;
  -- Cuando pasa a resuelto
  IF NEW.estado = 'resuelto' AND OLD.estado <> 'resuelto' THEN
    NEW.resuelto_en := now();
  END IF;
  -- Cuando reabren un caso resuelto
  IF OLD.estado = 'resuelto' AND NEW.estado <> 'resuelto' THEN
    NEW.resuelto_en := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.aprobar_solicitud(p_solicitud_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sol public.solicitudes_caso%ROWTYPE;
  v_capitulo_id uuid;
  v_caso_id uuid;
BEGIN
  IF NOT public.is_editor_o_admin() THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  SELECT * INTO v_sol FROM public.solicitudes_caso WHERE id = p_solicitud_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no existe.'; END IF;
  IF v_sol.estado <> 'pendiente' THEN RAISE EXCEPTION 'La solicitud no está pendiente.'; END IF;

  SELECT id INTO v_capitulo_id FROM public.capitulos WHERE barrio_id = v_sol.barrio_id;
  IF v_capitulo_id IS NULL THEN
    -- crear capítulo inactivo si el barrio no lo tiene
    INSERT INTO public.capitulos (barrio_id, activo) VALUES (v_sol.barrio_id, false)
    RETURNING id INTO v_capitulo_id;
  END IF;

  INSERT INTO public.casos (
    capitulo_id, categoria_id, titulo, slug, descripcion, estado,
    lat, lng, solicitud_origen_id, creado_por
  ) VALUES (
    v_capitulo_id, v_sol.categoria_id, v_sol.titulo, NULL, v_sol.descripcion, 'pendiente',
    v_sol.lat, v_sol.lng, v_sol.id, auth.uid()
  ) RETURNING id INTO v_caso_id;

  UPDATE public.solicitudes_caso
    SET estado = 'aprobada',
        revisado_por = auth.uid(),
        revisado_en = now(),
        caso_generado_id = v_caso_id
    WHERE id = p_solicitud_id;

  RETURN v_caso_id;
END $$;

COMMIT;

-- ─── 3. Verificación post-migración ─────────────────────────────────────────
-- Ejecuta estas queries después del COMMIT para confirmar:
--
-- SELECT unnest(enum_range(NULL::public.estado_caso));
--   -- esperado: pendiente, critico, progreso, resuelto, archivado
--
-- SELECT estado, count(*) FROM public.casos GROUP BY estado;
--   -- todos los registros con valores nuevos; ningún 'borrador'/'gestion'
--
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.casos'::regclass AND contype = 'c';
--   -- chk_casos_publicado debería decir (estado = 'pendiente'::estado_caso OR ...)
