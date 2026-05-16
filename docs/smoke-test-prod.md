# Smoke Test · Producción

Ejecutar después de cada deploy a <https://mibiss.com.co>.

## Anónimo (sin login)

- [ ] Home carga en menos de 3 seg
- [ ] Mapa renderiza geocercas de Soledad
- [ ] Casos demo aparecen como pines en el mapa
- [ ] Click en capítulo activo → `/capitulo/:slug` carga
- [ ] Click en pin de caso → MapDrawer abre con caso real
- [ ] Click en caso → `/caso/:slug` con timeline + testimonios + padrinos
- [ ] Navbar anchors scrollean a secciones del home (Mapa, Casos, Barrios, El concejal, Cómo funciona)
- [ ] Footer con info de Kevin visible
- [ ] DevTools console: sin errores rojos

## Registro de ciudadano (email OTP)

- [ ] `/login` → tab Ciudadano
- [ ] Email + Continuar → abre FlowIngresar con email pre-llenado
- [ ] Paso 1: email + cedula
- [ ] Email llega de `noreply@mibiss.com.co` en menos de 60 seg
- [ ] Código de 6 dígitos verifica correctamente
- [ ] Paso 3: datos del ciudadano (nombres, apellidos, fecha nac, barrio, dirección, estrato, hogar, habeas data)
- [ ] Submit exitoso, mensaje de bienvenida
- [ ] Verificar en Supabase Studio: `SELECT * FROM ciudadanos WHERE email = 'tu-test@email.com';` → registro existe con `verificado_email=true`
- [ ] F5 (refresh hard) → sigue logueado
- [ ] `/mi-cuenta` muestra perfil con nombre real

## Flow Testimonio

- [ ] Logueado → click "Sumar testimonio" desde un caso
- [ ] Llenar 3 pasos
- [ ] Submit exitoso, mensaje de confirmación
- [ ] Verificar en Supabase: `SELECT * FROM testimonios ORDER BY creado_en DESC LIMIT 1;` → estado `pendiente`

## Flow Reportar caso

- [ ] Logueado → click "Cuenta tu caso"
- [ ] Paso 1: categoría
- [ ] Paso 2: título + descripción
- [ ] Paso 3: ubicación (label + detalle)
- [ ] Paso 4: fotos (preview local, no se suben todavía — esperado en Sprint C)
- [ ] Paso 5: confirmar
- [ ] Folio `SOL-2026-XXXXXXXX` generado
- [ ] Verificar en Supabase: `SELECT * FROM solicitudes_caso ORDER BY creado_en DESC LIMIT 1;` → estado `pendiente`

## Flow Apadrinar

- [ ] Click "Apadrinar este caso" en cualquier caso
- [ ] Llenar 3 pasos (tipo, aportes, contacto)
- [ ] Confirmar
- [ ] Mensaje de gracias visible
- [ ] Verificar en Supabase: `SELECT * FROM padrinos ORDER BY creado_en DESC LIMIT 1;` → existe

## Admin (login editor)

- [ ] `/login` → tab Editor → `dev@biss.local` + clave dev
- [ ] Redirige a `/admin`
- [ ] `/admin/solicitudes` muestra cola con nuevo registro
- [ ] Aprobar una solicitud → caso aparece en home
- [ ] `/admin/testimonios` muestra cola y permite aprobar/rechazar
- [ ] `/admin/caso/:folio` muestra editor con timeline + multimedia
- [ ] Cambiar estado de caso → fila nueva en `actualizaciones_caso`

## Verificación de upload R2 (Sprint D — todavía no aplica)

Cuando se complete la acción humana de deploy de `r2-presign` + CORS:

- [ ] FlowReportar paso 4: seleccionar foto → preview local + log "uploading"
- [ ] Network tab: POST a `/functions/v1/r2-presign` con 200
- [ ] Network tab: PUT a `https://<accountid>.r2.cloudflarestorage.com/mibissbucket/...` con 200
- [ ] Imagen visible en `https://media.mibiss.com.co/casos-fotos/...`
