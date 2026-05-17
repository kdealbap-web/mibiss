# PORT_NOTES — Sprint A + B

Notas de hallazgos, decisiones y observaciones durante el wiring real de Supabase.
Lectura B sobre backend: anoto, no modifico (HANDOFF §13 + R5).

---

## Hallazgos en backend / db (no toco, anoto)

### [db/04-views.sql:110] — `mv_stats_globales` filtra por `'gestion'`, valor que YA NO existe en el enum
La migración `10-migration-estado-caso.sql` renombró `gestion → progreso`, pero la MV se quedó con el filtro viejo:
```sql
(SELECT COUNT(*) FROM public.casos WHERE estado = 'gestion') AS casos_progreso
```
Debería ser `WHERE estado = 'progreso'`. Como `ALTER TYPE ... RENAME VALUE` actualiza datos pero el literal `'gestion'` ya no existe en el enum, esta query falla o devuelve 0.

**Mitigación temporal (frontend):** `useStatsGlobales` consulta la MV. Si devuelve `casos_progreso=0` cuando hay casos en gestión, lo verás. **Solo es display**, no rompe lógica. Pendiente: re-ejecutar `04-views.sql` con la corrección en una migración `11-fix-mv-stats.sql`.

### [db/01-schema.sql] — Tabla `casos` NO tiene columna `folio`
El HANDOFF §7.1 dice "folio CS-YYYY-NNNN generado en trigger", pero el trigger real es `tg_casos_slug_auto` (db/03-functions.sql:209-234) que genera el campo **`slug`**, no folio.

**Decisión:** uso `caso.slug` como display "folio" en la UI con formato `slug.toUpperCase()`. En URLs uso `caso.slug` también (el path param sigue siendo `:folio` por convención visual; internamente es slug). Si el cliente quiere folio CS-YYYY-NNNN real, agregar columna `folio text UNIQUE GENERATED ALWAYS AS ('CS-' || extract(year from creado_en) || '-' || lpad(...)) STORED` en migración futura.

### [db/01-schema.sql] — Tabla `solicitudes_caso` NO tiene `folio`
Mismo caso. Las solicitudes no tienen identificador legible. Uso `id::text` truncado para display si hace falta.

### [db/04-views.sql] — NO existe `v_solicitudes_pendientes_admin`
El bloque pide consumir esta vista. Solo existe `v_solicitudes_pendientes`. La uso (devuelve `id, titulo, descripcion, lat, lng, creado_en, estado, ciudadano_id, ciudadano, telefono_celular, barrio_id, barrio, categoria_codigo, categoria`).

### [db/01-schema.sql] — `ciudadanos.barrio_id` es smallint NOT NULL
FlowIngresar paso 3 pide "barrio" como texto. Para insertar un ciudadano necesito resolver el nombre → smallint via `barrios` (lookup por slug o nombre fuzzy). Por ahora dejo el INSERT a Sprint C cuando Twilio esté listo; FlowIngresar continúa con mock visual (sin INSERT real).

### [db/02-rls-policies.sql] — RLS de `testimonios.insert` requiere `verificado_sms=true`
```sql
ciudadano_id IN (SELECT id FROM public.ciudadanos WHERE auth_user_id = auth.uid() AND verificado_sms = true)
```
En dev sin Twilio, los flows NO podrán insertar testimonios/solicitudes salvo que use service_role o el usuario tenga `verificado_sms=true` manualmente. **Mitigación:** los flows funcionan visualmente. El submit real lo intenta y captura el error de RLS para mostrar "Necesitas verificar tu celular primero" (link a /login → FlowIngresar). En Sprint C, con Twilio, esto se desbloquea.

---

## Decisiones tomadas (R5)

### D1. Hook `useCaso(folio)` busca por `slug`, no por folio real
El path param `/caso/:folio` siempre es el `slug` del caso (lo que se ve en la URL). Internamente:
```ts
.from('v_casos_publicos').select('*').eq('slug', folio).maybeSingle()
```

### D2. Hook de capítulo: `useCapituloPorSlug(slug)` (no `useCapituloPorBarrio`)
El path es `/capitulo/:slug` donde `slug` es el `barrio.slug` (no `capitulo.id`). El hook resuelve barrio → capítulo internamente.

### D3. Avatar inicial — primeras 2 letras del nombre, mayúsculas
Reutilizo helper `initials(nombre: string)` en `frontend/src/lib/format.ts`.

### D4. Empty states siguen el copy del prototipo
- Sin casos: "Aquí no hay casos todavía. Sé el primero en contar."
- Sin testimonios: "Aquí no hay voces todavía. Si vives esto, cuéntalo."
- Sin actualizaciones: "Todavía no hay movimientos. Te avisamos cuando algo pase."
- Sin padrinos: "Aún nadie ha apadrinado este caso. ¿Quieres ser el primero?"

### D5. Mutaciones · invalidations sin optimistic updates
Cada mutation espera `success` del server antes de invalidar. Más simple. (R6 del bloque ya lo dice.)

### D6. Error capture en flows
Capturo error de Supabase. Si el mensaje contiene `row-level security`, muestro copy cercano: "Necesitas verificar tu celular antes de continuar." Si es genérico: "Algo salió raro. Vuelve a intentarlo."

### D7. CiudadanosService.crearVerificado queda en standby
La RLS de `ciudadanos.insert` requiere `auth_user_id = auth.uid()`, que solo se obtiene tras `signInWithOtp` real (Twilio). En dev sin Twilio NO podemos crear ciudadanos desde el frontend (lo bloquea RLS). FlowIngresar paso 3 queda con `TODO: Sprint C — reemplazar mock OTP` y no llama a Supabase. Cuando Twilio esté listo, el edge function `otp-verify` debería crear `auth.users` + `ciudadanos` juntos con service_role.

---

## Fix post Sprint B (commit fix(post-sprint-b))

### F1. SessionContext centralizado
Antes cada `useSession()` montaba su propio `getSession()` + `onAuthStateChange`. Con StrictMode y varios consumidores (Navbar, MiCuenta, FlowReportar, FlowTestimonio, CasoEdit), había N suscripciones independientes con state desincronizado → al cambiar de ruta, partes de la app veían `session=null` mientras otras seguían logueadas.

**Fix:** `frontend/src/context/SessionContext.tsx` con `SessionProvider` que monta UNA sola suscripción y expone `{ session, user, loading }` por context. `main.tsx` envuelve la app. `useSession()` quedó como wrapper backward-compatible que lee de `useSessionContext().session` — los call sites de Sprint A/B no se tocan.

### F2. useScrollToHash
React Router 6 no hace scroll a `#anchor` automáticamente. Agregado hook `frontend/src/hooks/useScrollToHash.ts` y montado en `Home.tsx`. Navbar/NavMobile ya usaban `<Link to="/home#...">` y los `<section id="...">` ya estaban, no se tocaron.

### F3. BissLogo · prop `width` adicional
El prototipo `Design/login.html` define el logo del side panel con `width: 220px`, pero el componente solo aceptaba `height`. Agregada prop `width` (mutuamente exclusiva con `height`, fallback `height=40`). Footer sigue con `height={50}`, sin cambios.

### F4. Demo casos (manual)
Creado `db/11-demo-casos.sql` para que el equipo cargue casos visibles desde Supabase Studio. **NO ejecutado automáticamente** — el archivo es idempotente (`ON CONFLICT`) pero el usuario decide cuándo correrlo.

---

## Por revisar en Sprint C (no toco ahora)

- Bucket B2 legacy: backend/.env.secrets cambió a R2, pero `backend/edge-functions/b2-presign/` sigue como B2. Se elimina/renombra en Sprint C.
- Edge function `notify-email` sigue con `Resend` placeholder.
- `og-image` edge function: el dominio hardcoded sería `mibiss.com.co` (ya quedó actualizado en ciclo previo).
- `Metricas.tsx` admin: gráficos siguen siendo SVG hardcoded con números mock. Connection a `v_stats_globales` + creación de vistas adicionales (`v_top_paginas`, `v_origen_visitas`) son Sprint posterior — analytics depende de Plausible/Umami que aún no está integrado.

---

## Sprint C — Cierre (2026-05-16)

### Bloques completados

- Bloque 1: Refactor OTP SMS → Email (Resend SMTP custom)
- Bloque 2: Backend R2 wiring (sin upload real todavía — Sprint D)
- Bloque 3: Cloudflare Pages config + SEO + redirects SPA
- Bloque 4: Demo data + cleanup MV legacy
- Bloque 5: Documentación

### Acciones humanas pendientes para producción

| # | Acción | Dónde | Tiempo |
|---|---|---|---|
| 1 | Ejecutar `db/12-migration-email-auth.sql` | Supabase SQL Editor | 1 min |
| 2 | Ejecutar `db/13-cleanup-mv-stats.sql` (después de 12) | Supabase SQL Editor | 1 min |
| 3 | Crear API Token R2 + secretos en Supabase (ver `backend/SECRETS.md`) | CLI o Dashboard | 5 min |
| 4 | Desplegar edge function r2-presign | `supabase functions deploy r2-presign --project-ref uicpkqwmjjrywojhwctq` | 2 min |
| 5 | Configurar CORS del bucket R2 (JSON en `backend/SECRETS.md`) | Cloudflare Dashboard → R2 → mibissbucket → Settings → CORS Policy | 2 min |
| 6 | Crear proyecto Cloudflare Pages conectado al repo `kdealbap-web/mibiss` | Cloudflare Dashboard → Workers & Pages | 10 min |
| 7 | Setear env vars en Pages (`docs/cloudflare-pages-env.md`) | Pages → Settings → Environment variables | 5 min |
| 8 | Conectar custom domain `mibiss.com.co` + `www.mibiss.com.co` | Pages → Custom domains | 5 min |
| 9 | Activar Email Routing Cloudflare (`admin@`, `hola@`, `contacto@`) | Cloudflare Dashboard → Email | 5 min |

### Bloqueos conocidos para Sprint D

- **Upload real de fotos** en FlowReportar paso 4 (queda con preview local hasta que el humano ejecute acciones #3, #4, #5).
- **Email Routing** (recibir emails a `admin@mibiss.com.co` y forwardear) — independiente del registro de usuarios; queda fuera de Sprint C.
- **Logo y branding visual** (Claude Design tiene pendiente HANDOFF v2 con sidebar mobile + splash responsive).
- **Edge functions Twilio (`otp-send`, `otp-verify`)**: quedan en repo pero marcadas DEPRECATED. Se eliminan después del lanzamiento estable cuando se confirme que ningún cliente legacy las consume.

### Decisiones técnicas tomadas

- **D1 Sprint C** — OTP por email reemplaza Twilio SMS. Razones: costo cero adicional sobre Resend, simplicidad (un solo provider de email para OTP + notificaciones), deliverability universal, Supabase Auth nativo (`signInWithOtp({ type: 'email' })`).
- **D2 Sprint C** — `verificado_sms` queda deprecated pero NO eliminada todavía. Migración 12 hace backfill (`verificado_email = verificado_sms`) y comenta la columna. Eliminación post-lanzamiento para no romper queries externas que no controlemos.
- **D3 Sprint C** — Edge function `r2-presign` valida JWT antes de firmar URL. Mismo patrón que `b2-presign`. Solo usuarios autenticados pueden subir.
- **D4 Sprint C** — Sin upload real en este sprint. FlowReportar paso 4 sigue con `URL.createObjectURL` preview local hasta que humano ejecute acciones #3-#5.
- **D5 Sprint C** — SEO básico solo: OG + Twitter Cards + canonical + `robots.txt`. Sitemap.xml dinámico queda para Sprint D (necesita servicio que lo genere de `casos.slug` + `barrios.slug`).
- **D6 Sprint C** — `R2_PUBLIC_BASE_URL=https://media.mibiss.com.co` requiere que el humano configure el custom domain en el bucket R2 antes del deploy. Sin custom domain, `media.mibiss.com.co` no resuelve.

### Acción humana — CORS del bucket R2

Pega este JSON en Cloudflare Dashboard → R2 → mibissbucket → Settings → CORS Policy:

```json
[
  {
    "AllowedOrigins": [
      "https://mibiss.com.co",
      "https://www.mibiss.com.co",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Sin CORS, el navegador rechaza el PUT firmado desde la SPA.

---

## Sprint D — En curso (2026-05-16)

Sesión autónoma · 13 bloques en orden. Fuente visual: `Design/HANDOFFv2.0.md` (con punto, no underscore).

### Bloques completados

- **Bloque 1 · `db/14-fix-v-capitulos-publicos.sql`** — DROP + CREATE de la vista con `casos_progreso` (era `casos_gestion` en prod por drift de migración 10). No toca MV ni otras vistas.
- **Bloque 2 · Auth UI email-only + /recuperar** — Login simplificado a una sola entrada email + OTP (sin tabs SMS vs editor). `useMiRol` nuevo en `useMiCuenta.ts` para detectar rol post-OTP. FlowIngresar refactor: step 1 solo email, cédula movida al step 3, verifyOtp redirige a `/admin` si es CMS. `/recuperar` + `/recuperar/nueva-contrasena` nuevos. Copy SMS → email en Home, MiCuenta, CasoEdit, FlowReportar. Admin/Usuarios mueve columna Teléfono al final.

### Migraciones DB pendientes de aplicación humana (en orden)

| # | Archivo | Razón | Tiempo |
|---|---|---|---|
| 1 | `db/14-fix-v-capitulos-publicos.sql` | BUG-C1 · vista en prod expone `casos_gestion`, frontend pide `casos_progreso` → 400. Desbloquea Home. | 2 min |

**Acciones humanas Bloque 2:**
- Configurar `Site URL` y `Redirect URLs` en Supabase Auth para que `${APP_CONFIG.url}/recuperar/nueva-contrasena` sea permitido como redirect del email de reset. Dashboard → Authentication → URL Configuration.

### ⚠️ Decisiones pendientes Sprint D

#### D-Sprint-D-1 · Password de editor: ¿login con password o solo OTP?

**Contexto:** la spec del Bloque 2 dice "Una sola entrada por email · El rol se resuelve por DB después de validar OTP (ya está implementado en Sprint C; revisa useAuth / hooks/auth)". **No existía** `useMiRol` ni equivalente en Sprint C; lo creé en `frontend/src/hooks/useMiCuenta.ts` consultando `usuarios_cms` + `ciudadanos`.

**Lo que hice (default · reversible):**
- Login.tsx: una sola pantalla con input email → `signInWithOtp` → abre FlowIngresar drawer (paso 2 OTP).
- FlowIngresar.verifyOtp: después de OTP éxito, busca `usuarios_cms.id = user.id`. Si match → `navigate('/admin')` + cierra drawer. Si no, busca en `ciudadanos`. Si match → sesión lista. Si no → step 3 registro.
- Quité `signInWithPassword` del Login. Editores ahora entran SIEMPRE por OTP desde la UI.
- El password de Supabase Auth sigue válido para herramientas externas (Supabase Studio, CLI). `/recuperar` permite resetearlo.

**Pregunta para Kevin:** ¿está bien que editores entren SIEMPRE por OTP (no password)? O quieres recuperar el login con password como secundario (un link "soy editor con contraseña") para entrada más rápida en uso diario?

**Reversión si quieres password de vuelta:** restaurar el branch de tabs ciudadano/editor en Login.tsx (commit anterior a Bloque 2) y dejar OTP como default.

#### D-Sprint-D-2 · Columna "Teléfono" en admin/Usuarios

**Contexto:** la spec dice "si está en uso real, mantenla pero al final; si era placeholder, bórrala". El campo `ciudadanos.telefono_celular` SE USA (FlowIngresar paso 3 lo pide opcional, FlowReportar/admin/Solicitudes lo leen).

**Lo que hice:** la moví al final de la tabla (después de Registrado). Header renombrado de "Celular" a "Teléfono" para evitar confusión con SMS. Placeholder del search input también actualizado.
