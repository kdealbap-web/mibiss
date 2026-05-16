-- ============================================================================
-- 07-bootstrap-superadmin.sql · BISS (Banco de Ideas y Soluciones de Soledad)
-- Crea (o eleva) el primer superadmin del CMS.
-- Idempotente: re-ejecutable sin efectos secundarios.
--
-- ⚠️  PASSWORD NO SE COMMITTEA. Se pasa al ejecutar el script:
--
--    En Supabase SQL Editor:
--      1. Setea las variables al inicio del editor (o usa SET LOCAL):
--           SET app.superadmin_email = 'tu-email@dominio.com';
--           SET app.superadmin_password = 'TuPasswordFuerteAqui';
--           SET app.superadmin_nombre = 'Tu Nombre';
--      2. Ejecuta este archivo.
--      3. Al terminar, ejecuta:  RESET ALL;  (para limpiar la sesión)
--
-- Estrategia:
--   1) Si ya existe el usuario en auth.users con ese email → lo reusa.
--   2) Si no existe → lo crea con email confirmado y password indicado.
--   3) Inserta/actualiza la fila espejo en public.usuarios_cms con rol superadmin.
--
-- IMPORTANTE: ejecutar desde Supabase SQL Editor (rol postgres / service_role).
-- ============================================================================
DO $$
DECLARE
  v_email    citext  := COALESCE(NULLIF(current_setting('app.superadmin_email', true), ''), '__NO_EMAIL_SET__')::citext;
  v_password text    := COALESCE(NULLIF(current_setting('app.superadmin_password', true), ''), '__NO_PASSWORD_SET__');
  v_nombre   text    := COALESCE(NULLIF(current_setting('app.superadmin_nombre', true), ''), 'Superadmin BISS');
  v_user_id  uuid;
BEGIN
  -- Validación: rechazar ejecución si no se setearon las variables de sesión
  IF v_email::text = '__NO_EMAIL_SET__' OR v_password = '__NO_PASSWORD_SET__' THEN
    RAISE EXCEPTION 'Antes de ejecutar este script, setea las variables de sesión: SET app.superadmin_email = ''...''; SET app.superadmin_password = ''...''; SET app.superadmin_nombre = ''...'';';
  END IF;

  -- 1) Buscar usuario existente
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email::text;

  -- 2) Crear si no existe
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated', 'authenticated',
      v_email::text,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nombre', v_nombre, 'rol_inicial', 'superadmin'),
      now(), now(),
      '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email::text, 'email_verified', true),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
    RAISE NOTICE 'Auth user creado: % (id=%)', v_email, v_user_id;
  ELSE
    RAISE NOTICE 'Auth user ya existe: % (id=%)', v_email, v_user_id;
  END IF;

  -- 3) Espejo en public.usuarios_cms con rol superadmin
  INSERT INTO public.usuarios_cms (id, nombre, email, rol, activo)
  VALUES (v_user_id, v_nombre, v_email, 'superadmin', true)
  ON CONFLICT (id) DO UPDATE
    SET nombre = EXCLUDED.nombre,
        email  = EXCLUDED.email,
        rol    = 'superadmin',
        activo = true;

  RAISE NOTICE 'Superadmin listo en public.usuarios_cms: %', v_email;
END $$;