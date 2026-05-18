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

## Sprint D — Cierre (2026-05-17)

Sesión autónoma · 13 bloques en orden. Fuente visual: `Design/HANDOFFv2.0.md` (con punto, no underscore).

### Bloques completados

- **Bloque 1 · `db/14-fix-v-capitulos-publicos.sql`** — DROP + CREATE de la vista con `casos_progreso` (era `casos_gestion` en prod por drift de migración 10). No toca MV ni otras vistas.
- **Bloque 2 · Auth UI email-only + /recuperar** — Login simplificado a una sola entrada email + OTP (sin tabs SMS vs editor). `useMiRol` nuevo en `useMiCuenta.ts` para detectar rol post-OTP. FlowIngresar refactor: step 1 solo email, cédula movida al step 3, verifyOtp redirige a `/admin` si es CMS. `/recuperar` + `/recuperar/nueva-contrasena` nuevos. Copy SMS → email en Home, MiCuenta, CasoEdit, FlowReportar. Admin/Usuarios mueve columna Teléfono al final.
- **Bloque 3 · UI primitives** — `<SearchInput />`, `<FilterChip />`, `<Select />` en `components/ui/`. CSS `.search-wrap` en `components.css`. Reemplazos en admin/Usuarios y admin/MapaBarrios. Mapa público filtros intactos (zona segura).
- **Bloque 4 · Splash mobile + tagline** — Breakpoints `(max-width: 700px) or (max-height: 720px)`. Auto-redirect 7s cancelable con scroll/touch. Tagline `.lema` con `.accent` highlight amarillo sobre "primer libro vivo".
- **Bloque 5 · Admin sidebar drawer <900px** — AdminLayout con estado sidebarOpen + Esc + focus trap. Burger button, overlay teal 45%, onNavigate cierra drawer. Orden de secciones intacto (zona segura §11.2).
- **Bloque 8 · Iconos lucide** — NO requirió cambios. `grep "data-lucide" frontend/src` devolvió 0 matches: el código React ya usaba componentes desde Sprint A.
- **Bloque 9 · Flows padding mobile ≤640px** — `.flow-shell` 16/14/56, `.flow-header` 20/18, h1 compacto.
- **Bloque 10 · Accesibilidad básica** — `useFocusTrap` nuevo en `hooks/`. Aplicado a `Drawer` (FlowDrawer + cualquier modal futuro). aria-pressed ya en FilterChip (Bloque 3). axe-cli documentado abajo (no instalado).
- **Bloque 11 · Coords desde DB** — `SOLEDAD_CENTER` y `SOLEDAD_BOUNDS` en `lib/config.ts`. BissMap lee constante. Resto del mapa (barrios, casos) ya leía de DB desde Sprint A. HITOS hardcoded de admin/MapaBarrios (aeropuerto, alcaldía, etc.) quedan: no son barrios y no hay tabla `hitos`.
- **Bloque 6 · /admin/ajustes** — Página con 6 secciones (perfil, seguridad, notificaciones, flujos & moderación, integraciones, exportar). `<Toggle />` nuevo en `components/ui/`. Persistencia en tabla `config_app` (db/15) con upsert directo desde frontend. RLS bloquea anon y filtra writes a admin/superadmin. Export CSV cliente-side. Sin SMS/Twilio.
- **Bloque 7 · /admin/barrios** CRUD — `BarriosLista` paginada (12/pág) con search + filtros zona/estado + KPIs. `BarrioEditor` con Leaflet (marker arrastrable, click en mapa, Nominatim rate-limited 1/s, vecinos atenuados). `BarrioMapPicker` reusable en `components/admin/`. Validación con Zod standalone (sin `@hookform/resolvers` para evitar nueva dep). Mutations create/update/delete en `hooks/useBarriosCrud.ts`. Slug auto-generado desde nombre. Bounding box `SOLEDAD_BOUNDS` valida lat/lng. Sin importar CSV (placeholder v1.1). Eliminar requiere escribir "ELIMINAR".

### Bloques diferidos a Sprint E (default conservador)

- **Bloque 12 · Auditoría admin** — diferido. La spec marca este bloque como CONDICIONAL ("si Kevin marca duda, DEJA esto para Sprint E"). En sesión autónoma no hay señal explícita, default = NO implementar. Si Kevin lo quiere para Sprint D, basta con aplicar `db/16-auditoria.sql` (no creado) + crear `pages/admin/Auditoria.tsx`. Patrón sugerido en spec original.

### Resumen ejecutivo Sprint D

**Commits** (de `c0491b9` → HEAD):

| Bloque | Commit | Resumen |
|--------|--------|---------|
| 1 | `ef63793` | DB fix v_capitulos_publicos (drift `casos_gestion`) |
| 2 | `97cc2c4` | Auth email-only + /recuperar |
| 3 | `6a2283d` | UI primitives SearchInput/FilterChip/Select |
| 4 | `cb06230` | Splash mobile + tagline highlight |
| 5 | `06830be` | Admin sidebar drawer <900px |
| 9 | `e5c651c` | Flows padding mobile ≤640px |
| 11 | `629655b` | Hoist Soledad coords a lib/config |
| 10 | `1bfb48a` | useFocusTrap + Drawer + axe docs |
| 6 | `6bf67ce` | /admin/ajustes (6 secciones) |
| 7 | `efe9580` | /admin/barrios CRUD + Leaflet |
| 12 | (diferido a Sprint E) | Auditoría admin |
| R2 | `ad03bc1` | rename `R2_PUBLIC_BASE_URL → R2_PUBLIC_URL` |
| 13 | (este commit) | Cierre + cleanup |

**Bloque 8 (lucide migration)** — NO requirió cambios (0 matches de `data-lucide` en `frontend/src`; el código ya estaba migrado desde Sprint A).

### Acciones humanas post-deploy (en orden)

1. **🔥 Aplicar `db/14-fix-v-capitulos-publicos.sql`** en Supabase SQL Editor → desbloquea Home (BUG-C1 del smoke test).
2. **Aplicar `db/15-config-app.sql`** → habilita `/admin/ajustes` (sin esto la página carga pero los upserts fallan con 404 de tabla).
3. **Configurar Supabase Auth → URL Configuration**: añadir `https://mibiss.com.co/recuperar/nueva-contrasena` a Redirect URLs.
4. **Smoke test desde red sin FortiClient** validando:
   - `/` carga splash, lema con "primer libro vivo" resaltado, redirect a `/home` cancela con scroll/touch.
   - `/login` muestra una sola entrada email (sin tabs).
   - `/recuperar` envía email (alguna cuenta de prueba editor).
   - `/admin` desde 360×640: burger abre drawer con menú; click en link cierra drawer.
   - `/admin/ajustes` muestra 6 secciones sin SMS/Twilio.
   - `/admin/barrios` lista los 211 barrios paginados; click en fila abre editor con mapa Leaflet.
   - `/admin/barrios/nuevo` permite crear con mapa.
5. **Opcional · axe-cli**: correr `npx axe http://localhost:4173/inicio /login /recuperar` antes del release.
6. **TI SuperGiros** (sin código): solicitar recategorizar `mibiss.com.co` en FortiClient.

---

## Sprint E — Cierre (2026-05-17)

Sesión continua después del cierre Sprint D. Migraciones aplicadas por Claude directo via `npx supabase db query --linked`.

### Bloques completados

- **E1 · Upload R2 real en FlowReportar** (commit `b2f980d`) — db/16 añade `solicitudes_caso.fotos_urls text[]`. Hook `useR2Upload` (presigned PUT via edge function `r2-presign`). FlowReportar paso 5 sube fotos a `solicitudes-multimedia/<uid>/...` antes de crear la solicitud. Botón muestra `Subiendo fotos N/M…`.
- **E2 · Solicitudes → caso publicado** (commit `9faab59`) — db/17 actualiza RPC `aprobar_solicitud()` para copiar `fotos_urls` a `multimedia_casos` con `subido_por=NULL`. Vista `v_solicitudes_pendientes` ahora incluye `fotos_urls` + `ciudadano_email`. Panel `/admin/solicitudes` con preview de fotos en accordion, botones aprobar/duplicada/rechazar, navega a `/admin/caso/:id` post-aprobar.
- **E3 · Editor de capítulo** (commit `0c14757`) — `/admin/capitulos` lista con filtros, KPIs, checklist de contenido. `/admin/capitulos/:id/editar` con upload de imagen a R2 (bucket `barrios-portadas`), textarea geocerca GeoJSON con validación inline, toggle activo bloqueado por `chk_capitulos_activo_completo`. Sidebar admin reorganizado: Editor de caso → Capítulos → Barrios → Mapa global → Padrinos.

### Migraciones DB aplicadas a prod en Sprint E

| # | Archivo | Razón | Estado |
|---|---|---|---|
| 16 | `db/16-fotos-solicitudes.sql` | Columna `fotos_urls text[]` en `solicitudes_caso` | ✅ Aplicada 2026-05-17 |
| 17 | `db/17-aprobar-solicitud-fotos.sql` | RPC `aprobar_solicitud` copia fotos + vista `v_solicitudes_pendientes` enriquecida | ✅ Aplicada 2026-05-17 |

### Acciones humanas pendientes post Sprint E

1. **🔥 Configurar CORS R2 en Cloudflare Dashboard** → R2 bucket → CORS (JSON ya documentado en sección Sprint C "Acción humana — CORS del bucket R2"). Sin esto, el navegador rechaza el PUT firmado y los uploads del Sprint E NO funcionan en prod.
2. **🔥 Configurar custom domain `media.mibiss.com.co` en R2** apuntando al bucket. Sin esto, `R2_PUBLIC_URL` no resuelve y las fotos no se ven después de subir.
3. Smoke test end-to-end del ciclo ciudadano → admin:
   - Reportar caso con 1-2 fotos desde móvil.
   - Verificar en R2 dashboard que los archivos llegaron a `solicitudes-multimedia/<uid>/yyyymm/...`.
   - En `/admin/solicitudes`: ver preview de fotos.
   - Aprobar la solicitud → caso aparece en `/caso/:slug` con las mismas fotos en `multimedia_casos`.
   - Editar capítulo del barrio → subir imagen portada → activar.
   - Verificar capítulo activo aparece en Home + mapa público.

---

## Sprint F — Cierre (2026-05-18)

Smoke audit del HANDOFF v2.0 + 4 bloques + fix de bugs mobile reportados por Kevin.

### Smoke audit · resultados

**🔴 Bugs encontrados y corregidos:**

- **Filtros del mapa no filtraban pines** (commit `42d3f5c`, HANDOFF §5). `BissMap` no recibía `catFilter`/`stateFilter`. Chips cambiaban visualmente pero todos los casos seguían visibles.
- **Click en barrio del panel lateral muerto** (commit `42d3f5c`). `<a>` + `preventDefault()` sin navegación → reemplazado por `<Link>`.
- **Mapa con tiles grises en mobile** (commit `25efb56`). Leaflet medía altura=0 al montar antes del primer paint. Fix: 3 `invalidateSize()` (0/250/700ms) + listeners de `resize`/`orientationchange`.
- **Pines aparentemente en ciénaga/aeropuerto/río** (commit `25efb56`). Fallback: si `caso.lat/lng` está fuera del bounding box del municipio o es `null`, usa `barrios.coord_lat/coord_lng` del barrio asociado. Si tampoco hay, omite el pin (no salta el mapa).
- **"Un segundo…" colgado encima del mapa en mobile** (commit `25efb56`). El loading del panel lateral aparecía justo bajo el mapa y se leía como overlay. Reemplazado por skeleton sutil de 4 barras gris-claro.
- **Mapa 600px en mobile lo dominaba todo** (commit `25efb56`). Ahora 420px mobile, 520 tablet, 600 desktop. Panel lateral mobile max-height 360px.
- **Chips de filtro saltaban en mobile** (commit `25efb56`). Padding/gap reducidos en `≤640px`.

### Bloques completados

- **F1 · /admin/casos lista CRUD** (commit `51b9653`) — Tabla paginada con filtros estado/categoría/zona, KPIs de 6 valores, edad color-coded (≤7d verde, ≤30d amarillo, >30d rojo). Click en fila abre editor. Export CSV.
- **F2 · Notas internas + reabrir caso** (commit `1a7c659`) — db/18: tabla `caso_notas_internas` + RLS editor/admin + RPC `reabrir_caso`. Sección nueva en `CasoEdit` con form + lista. "Zona peligrosa" se reemplaza por "Caso archivado" con botón "Reabrir" cuando `estado=archivado`.
- **F3 · Modales invitar editor + suspender ciudadano** (commit `31083a3`) — db/19: RPC `suspender_ciudadano` / `reactivar_ciudadano`. Edge function `invitar-editor` desplegada (auth.admin.inviteUserByEmail + insert usuarios_cms). Modal primitivo `<Modal />`. UI en `/admin/usuarios` con 3 modales y badge "Suspendido" rojo con line-through.
- **F4 · Sitemap.xml + notify-email** (commit `5832dd7`) — Edge function `sitemap-xml` desplegada y validada (curl OK). `_redirects` rewrite `/sitemap.xml`. `notify-email` re-desplegada con SITE_URL. Secrets configurados: RESEND_API_KEY, EMAIL_FROM, SITE_URL.

### Migraciones DB aplicadas a prod en Sprint F

| # | Archivo | Razón | Estado |
|---|---|---|---|
| 18 | `db/18-notas-internas-y-reabrir.sql` | Tabla `caso_notas_internas` + RPC `reabrir_caso` | ✅ Aplicada 2026-05-17 |
| 19 | `db/19-suspender-ciudadano.sql` | RPCs `suspender_ciudadano` y `reactivar_ciudadano` | ✅ Aplicada 2026-05-17 |

### Edge functions desplegadas en Sprint F

| Function | URL | Estado |
|---|---|---|
| `invitar-editor` | `https://uicpkqwmjjrywojhwctq.supabase.co/functions/v1/invitar-editor` | ✅ Desplegada 2026-05-17 (Docker no requerido) |
| `sitemap-xml` | `https://uicpkqwmjjrywojhwctq.supabase.co/functions/v1/sitemap-xml` | ✅ Desplegada 2026-05-18 |
| `notify-email` | `https://uicpkqwmjjrywojhwctq.supabase.co/functions/v1/notify-email` | ✅ Desplegada 2026-05-18 (re-deploy con SITE_URL) |

### Acciones humanas pendientes Sprint F

- **🔥 CORS R2 en Cloudflare** (heredada de Sprint E): aún sin esto los uploads del FlowReportar fallan en prod.
- **📋 Cablear `notify-email` desde RPCs DB**: actualmente la función vive pero nadie la llama automáticamente al aprobar solicitud o cambiar estado. Sprint G deberá hacer `PERFORM net.http_post(...)` desde dentro de `aprobar_solicitud`/`cambiar_estado_caso`, o un trigger después-de-update sobre `casos.estado`. Necesita extensión `pg_net` activada en Supabase.
- **🌐 Verificar `/sitemap.xml`** una vez que Pages publique los cambios de `_redirects`. URL pública: `https://mibiss.com.co/sitemap.xml`. Debería responder XML del endpoint Supabase.

---

## Sprint G — Cierre (2026-05-18)

Foco: cerrar el ciclo del ciudadano en `/mi-cuenta`. Editable, vinculado y con historial.

### Bloques completados (commit único `b0c27e4`)

- **G1 · Perfil editable** — Tab "Datos" ahora es form con nombres, apellidos, teléfono, dirección, barrio, estrato, miembros del hogar + toggle de notificaciones funcional. Persiste con `UPDATE ciudadanos` (RLS `update_self` ya existía). Bloque adicional "Cambiar correo electrónico" llama `auth.updateUser({ email })` con confirmación dual de email viejo + nuevo.
- **G2 · Padrinazgos vinculados** — db/20 RPC `mis_padrinazgos()` SECURITY DEFINER hace match `padrinos.contacto_privado_email = auth.users.email` del caller. Saltea la RLS de `padrinos` que oculta filas no publicadas. UI muestra organización + tipo apoyo + caso vinculado (con link) + descripción + estado del caso + badge "pendiente de moderación" si aplica.
- **G3 · Historial inline por caso** — Click en una fila de caso en "Mis casos" expande mini-timeline con últimas 3 actualizaciones. Lee `useActualizaciones` on-demand. Footer "Ver caso completo →" navega al timeline público entero.

### Migraciones DB aplicadas a prod en Sprint G

| # | Archivo | Razón | Estado |
|---|---|---|---|
| 20 | `db/20-mis-padrinazgos.sql` | RPC `mis_padrinazgos()` para ciudadano (RLS-bypass controlado) | ✅ Aplicada 2026-05-18 |

### Acciones humanas heredadas

- **✅ CORS R2 en Cloudflare** — aplicado por Kevin el 2026-05-18. Pendiente solo: smoke test end-to-end (reportar caso con foto desde móvil → ver llegada al bucket → aprobar → caso público con foto).
- **✅ Cablear `notify-email` desde RPCs** — cerrado en Sprint H · H1 (db/21, 2026-05-18). `pg_net` habilitado, triggers en `solicitudes_caso`, RPCs `aprobar_solicitud` y `cambiar_estado_caso` modificadas.

---

## Sprint H — Cierre (2026-05-18)

Foco: cerrar el loop de notificaciones DB → email y modernizar paneles de moderación admin.

### Bloques completados

- **H1 · notify-email cableado** (commit `49e7dd0`, db/21) — Extensión `pg_net` habilitada. Helper `enviar_notificacion(tipo, ciudadano_id, payload)` fire-and-forget. Triggers `AFTER INSERT` y `AFTER UPDATE OF estado` sobre `solicitudes_caso` para `solicitud_recibida` y `solicitud_rechazada`. RPCs `aprobar_solicitud` y `cambiar_estado_caso` re-escritas para disparar `solicitud_aprobada` y `caso_avanzo` al ciudadano de la solicitud origen.
- **H2 · `/admin/testimonios`** (commit `7b6eec4`) — Hook `useTestimoniosAdmin(filtro)` lee directo de `testimonios` con join client-side a `ciudadanos`. 5 filtros (pendiente/aprobado/rechazado/oculto/todos) + SearchInput. Skeleton loader. Estado badge + alert con motivo cuando aplica. "Aprobar visibles" con `useAprobarLote` (serie, tolerante a fallos). Link "Ver caso" cuando hay `caso_id`.
- **H3 · `/admin/padrinos`** (commit pendiente abajo) — 3 FilterChips por estado + Select por tipo de apoyo + SearchInput. Modal detalle migrado al primitivo `<Modal />` con focus trap. Skeleton loader. Botón "Exportar" funcional (CSV cliente). "Registrar padrino" deshabilitado para Sprint I.

### Migraciones DB aplicadas a prod en Sprint H

| # | Archivo | Razón | Estado |
|---|---|---|---|
| 21 | `db/21-notify-cableado.sql` | `pg_net` + helper `enviar_notificacion` + triggers + RPCs aprobar/cambiar | ✅ Aplicada 2026-05-18 |

### Smoke test post Sprint H sugerido

1. Reportar un caso desde la app (cualquier email) → debe llegar correo "Recibimos tu solicitud".
2. Aprobar desde `/admin/solicitudes` → debe llegar "Tu solicitud fue aprobada" + URL del caso.
3. Cambiar estado del caso a "resuelto" en `/admin/caso/:slug` → debe llegar "Hay novedades en un caso que sigues".
4. Rechazar otra solicitud → debe llegar "Tu solicitud no pudo ser aprobada" + motivo.
5. Si algún email no llega, revisar logs de `net._http_response` en Postgres y Resend dashboard.

---

## Sprint I — Cierre (2026-05-18)

Foco: métricas reales de visitas + reescribir `/admin/metricas` con queries en vivo (sin mocks).

### Bloques completados (commit `d3535e1`)

- **I1 · web_visits tracking** — db/22 con tabla `web_visits` (sin IP, sin cookies). RLS anon-INSERT + cms-SELECT. Vistas `v_visits_kpis`, `v_visits_top_paths`, `v_visits_semanal`. Hook `useTrackPageview` en App.tsx pingea por cambio de pathname (excluye `/admin/*`).
- **I2 · /admin/metricas** — Reemplaza el mock. 4 KPIs visitas + chart barras semanal + tabla top paths + 7 KPIs operativos + chart doble casos abiertos vs resueltos por mes + top categorías + top barrios.
- **I3 · Cloudflare Web Analytics opcional** — `main.tsx` inyecta el beacon si `VITE_CF_ANALYTICS_TOKEN` está set. Sin token, no carga.

### Migraciones DB aplicadas a prod en Sprint I

| # | Archivo | Razón | Estado |
|---|---|---|---|
| 22 | `db/22-web-visits.sql` | Tabla `web_visits` + 3 vistas KPI | ✅ Aplicada 2026-05-18 |

### Acciones humanas Sprint I (opcionales)

- **Activar Cloudflare Web Analytics**: Cloudflare Dashboard → Web Analytics → Add site `mibiss.com.co` → copiar token → Pages → Settings → Environment variables → `VITE_CF_ANALYTICS_TOKEN=<token>`. Re-deploy.
- **Retención `web_visits`**: post-launch, agendar `DELETE FROM web_visits WHERE ts < now() - interval '90 days';` semanal (cron).

### Lo que NO entró en Sprint D (Sprint E backlog)

- Upload real de fotos en FlowReportar paso 4 (necesita CORS R2 + token testing).
- Sitemap.xml dinámico (robots.txt ya lo apunta).
- Métricas Plausible/Umami.
- OG image dinámica (edge function `og-image`).
- 2FA TOTP.
- Importar CSV de barrios.
- Eliminar columna `verificado_sms` legacy.
- Suspender/reactivar ciudadano con modal.
- Reabrir caso archivado + notas internas por caso.
- Auditoría admin (`/admin/auditoria` + triggers DB · ver decisión D-Sprint-D-3).
- Editor de capítulo: `descripcion`, `imagen_portada_url`, `activo`, `geocerca` (campos viven en `public.capitulos`).

### Migraciones DB pendientes de aplicación humana (en orden)

| # | Archivo | Razón | Tiempo | Estado |
|---|---|---|---|---|
| 1 | `db/14-fix-v-capitulos-publicos.sql` | BUG-C1 · vista en prod expone `casos_gestion`, frontend pide `casos_progreso` → 400. Desbloquea Home. | 2 min | ✅ Aplicada 2026-05-17 (Claude via `supabase db query --linked`) |
| 2 | `db/15-config-app.sql` | Tabla `config_app` key/value para `/admin/ajustes` + RLS editor/admin + 9 seeds. | 2 min | ✅ Aplicada 2026-05-17 (Claude via `supabase db query --linked`) |

**Acciones humanas Bloque 2:**
- Configurar `Site URL` y `Redirect URLs` en Supabase Auth para que `${APP_CONFIG.url}/recuperar/nueva-contrasena` sea permitido como redirect del email de reset. Dashboard → Authentication → URL Configuration.

**Bloque 10 · Accesibilidad — correr axe-cli antes de release (no bloqueante):**

```bash
# Una vez por máquina:
npm install -D @axe-core/cli

# Cada release:
cd frontend
npm run build
npx vite preview --port 4173 &
sleep 2
npx axe http://localhost:4173/inicio http://localhost:4173/login http://localhost:4173/recuperar
# Si admin tiene credenciales en .env de test, también:
# npx axe http://localhost:4173/admin
```

Resultado esperado: 0 errores WCAG 2 AA en home, login, recuperar, caso, capítulo, splash. Avisos `incomplete` o `best-practice` no bloquean release.

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

#### D-Sprint-D-3 · Schema `barrios` no tiene `archivado_en`/`visible`/`capitulo_activo`/`descripcion`

**Contexto:** la spec del Bloque 7 menciona toggles `capitulo_activo` y `visible` + textarea `descripcion` en el editor de barrio. Esos campos NO existen en `public.barrios` (solo en `public.capitulos` y como `descripcion text` allí). Tampoco existe `archivado_en` para soft-delete.

**Lo que hice (default · reversible):**
- Editor SOLO toca campos reales de `barrios`: nombre, slug, zona_id, coord_lat, coord_lng, codigo_oficial.
- "Archivar" no implementado (no hay columna).
- "Eliminar" hace hard-delete con confirmación textual "ELIMINAR". Si FK constraint falla, mensaje claro al usuario.
- Descripción/imagen/capítulo_activo se editan en una pantalla aparte de capítulos (no creada todavía).

**Pregunta para Kevin:** ¿migrar `archivado_en`/`visible`/`descripcion` a `barrios`, o dejarlos en `capitulos`?

#### D-Sprint-D-2 · Columna "Teléfono" en admin/Usuarios

**Contexto:** la spec dice "si está en uso real, mantenla pero al final; si era placeholder, bórrala". El campo `ciudadanos.telefono_celular` SE USA (FlowIngresar paso 3 lo pide opcional, FlowReportar/admin/Solicitudes lo leen).

**Lo que hice:** la moví al final de la tabla (después de Registrado). Header renombrado de "Celular" a "Teléfono" para evitar confusión con SMS. Placeholder del search input también actualizado.
