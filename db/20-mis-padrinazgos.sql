-- ============================================================================
-- 20-mis-padrinazgos.sql · BISS Sprint G · G2
--
-- RPC mis_padrinazgos() — el ciudadano autenticado ve los padrinazgos que
-- inscribió usando su email actual (auth.users.email).
--
-- Necesario porque padrinos.publicado = false oculta la fila por RLS, y
-- contacto_privado_email queda fuera del scope público. Esta RPC corre
-- SECURITY DEFINER y filtra por match exacto del email del caller.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.mis_padrinazgos()
RETURNS TABLE (
  padrino_id        uuid,
  padrino_nombre    text,
  tipo_apoyo        text,
  descripcion       text,
  contacto_email    text,
  contacto_tel      text,
  publicado         boolean,
  padrino_creado_en timestamptz,
  caso_id           uuid,
  caso_titulo       text,
  caso_slug         text,
  caso_estado       text,
  aporte_descripcion text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sin sesión.';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id                       AS padrino_id,
    p.nombre                   AS padrino_nombre,
    p.tipo_apoyo::text         AS tipo_apoyo,
    p.descripcion              AS descripcion,
    p.contacto_privado_email   AS contacto_email,
    p.contacto_privado_tel     AS contacto_tel,
    p.publicado                AS publicado,
    p.creado_en                AS padrino_creado_en,
    c.id                       AS caso_id,
    c.titulo                   AS caso_titulo,
    c.slug                     AS caso_slug,
    c.estado::text             AS caso_estado,
    pc.aporte_descripcion      AS aporte_descripcion
  FROM public.padrinos p
  LEFT JOIN public.padrinos_caso pc ON pc.padrino_id = p.id
  LEFT JOIN public.casos c ON c.id = pc.caso_id
  WHERE lower(p.contacto_privado_email) = lower(v_email)
  ORDER BY p.creado_en DESC;
END $$;

COMMIT;
