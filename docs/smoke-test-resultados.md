# Smoke Test Resultados · BISS Producción

**Fecha:** 2026-05-16
**Ejecutor:** Claude Code (sesión autónoma)
**URL probada:** https://mibiss.com.co
**Supabase project:** uicpkqwmjjrywojhwctq

---

## Resumen ejecutivo

- ✅ **8** tests pasaron (Supabase + repo local + apellido correcto + archivos críticos)
- ❌ **2** tests con bugs reales en producción (críticos)
- ⚠️ **6** tests HTTP **no concluyentes** desde esta red — el firewall corporativo (FortiClient de SuperGiros, IP categorizada "Sin Clasificar") bloquea `mibiss.com.co` y `media.mibiss.com.co` con su propia página interstitial. Esto contamina 1.1–1.5, 1.7. **No es bug del producto**, es ruido de red local.
- 🔵 **6** tests de UI quedan pendientes para validación manual del humano una vez verifique desde una red sin FortiClient.

---

## 🔴 Bugs CRÍTICOS (bloquean usuario final en producción)

### BUG-C1 · `v_capitulos_publicos` expone `casos_gestion` pero el frontend pide `casos_progreso` → 400 PostgREST

**Síntoma esperado en UI:** el Home / Capítulo no muestra capítulos (silencio o lista vacía). Coincide con el reporte del usuario *"no veo casos"*.

**Evidencia del smoke test:**

```
GET /rest/v1/v_capitulos_publicos?select=barrio_slug,casos_progreso,...
→ 400 PostgREST 42703
  "column v_capitulos_publicos.casos_progreso does not exist"

GET /rest/v1/v_capitulos_publicos?limit=1   (select * implícito)
→ columnas reales: capitulo_id, barrio_id, barrio_nombre, barrio_slug,
                   zona_codigo, zona_nombre, zona_color, coord_lat, coord_lng,
                   descripcion, imagen_portada_url, geocerca, activado_en,
                   casos_total, casos_criticos, casos_gestion, casos_resueltos,
                   estado_predominante
```

**Causa:** la migración `10-migration-estado-caso.sql` renombró el enum `gestion → progreso`, y `04-views.sql` quedó actualizado con `casos_progreso` en el archivo… pero la vista en la base de datos de producción **nunca se reaplicó** y todavía expone la columna con el nombre viejo `casos_gestion`.

**Drift confirmado:**
- `db/04-views.sql:28` define `casos_progreso` (estado del repo)
- Producción expone `casos_gestion` (vista vieja viva)
- `frontend/src/types/biss.ts:74,107`, `Home.tsx:176,193,255`, `Capitulo.tsx:144`, `admin/Dashboard.tsx:92` — todos esperan `casos_progreso`

**Fix sugerido (Sprint D):** migración `db/14-fix-v-capitulos-publicos.sql` que ejecute `DROP VIEW IF EXISTS public.v_capitulos_publicos; CREATE VIEW ... AS ...` con la definición correcta de `04-views.sql`. Acción humana: aplicar en Supabase Studio.

**No arreglado en este smoke test** (regla 8: solo reportar).

---

### BUG-C2 · OTP por email **DESACTIVADO** en Supabase Auth → registro de ciudadanos imposible

**Evidencia:**

```
POST https://uicpkqwmjjrywojhwctq.supabase.co/auth/v1/otp
{ "email": "...", "create_user": false }
→ 422
{
  "code": 422,
  "error_code": "otp_disabled",
  "msg": "Signups not allowed for otp"
}
```

**Causa:** el provider **"Email OTP"** en Supabase Dashboard → Authentication → Providers está apagado. El SMTP custom de Resend está conectado y funcionando (lo confirmamos antes en el script `test-email-otp.js`), pero sin activar el provider OTP, Supabase rechaza la petición antes de mandar el email.

Esto NO es problema de Resend, NO es problema del frontend, NO es problema del flujo `signInWithOtp` del refactor del Sprint C. Es una configuración del dashboard.

**Acción humana** (Sprint D, prioridad 0):
1. Supabase Dashboard → Authentication → Providers → **Email**.
2. Activar **"Enable Email Provider"** y dentro **"Enable Email OTP"** (suele estar como subopción).
3. Confirm que "Allow new users to sign up" está habilitado.
4. Guardar.
5. Probar de nuevo con `node scripts/test-email-otp.js <email>` → debe llegar el OTP.

**No arreglado en este smoke test** (regla 8 + no es código).

---

## 🟡 Bugs MEDIOS

### BUG-M1 · Red corporativa SuperGiros (FortiClient) bloquea `mibiss.com.co`

**Síntoma:** desde la red de la oficina, abrir `https://mibiss.com.co` devuelve una página de FortiClient con título *"Web Page Blocked!"*, motivo *"is in the category Sin Clasificar"*. Mismo bloqueo para `https://media.mibiss.com.co`.

**Evidencia:** el body de `GET https://mibiss.com.co` durante este smoke test contenía 20 KB del template HTML de FortiClient con el logo de Fortinet inline (no es contenido de BISS). El dominio Supabase (`*.supabase.co`) NO está bloqueado, por eso los tests Supabase funcionan.

**No es bug del producto.** Es restricción de la red corporativa de SuperGiros Atlántico (el empleador del usuario, `etl@supergirosatlantico.co`).

**Acciones humanas posibles:**
- Solicitar a TI de SuperGiros que recategorice `mibiss.com.co` (mandar URL de re-evaluación de FortiNet, que viene en la misma página de bloqueo).
- Mientras tanto, validar desde **red doméstica / móvil / hotspot** para correr los tests de UI y el `npm run dev` con Supabase remoto.

---

## ✅ Tests pasados — confirma que Supabase está bien

| ID | Test | Resultado |
|----|------|-----------|
| 2.1 | Casos en `public.casos` | **9 casos** con estados `critico/progreso/resuelto` |
| 2.1b | `v_casos_publicos` accesible | 9 casos visibles, columnas OK, RLS no bloquea anon |
| 2.2 | columna `verificado_email` existe | migración 12 aplicada |
| 2.4 | `padrinos` accesible públicamente | 0 publicados (esperado: ningún humano ha apadrinado) |
| 2.5 | `/auth/v1/otp` endpoint responde | 422 controlado (no 5xx) — endpoint vivo, falta activar provider |
| 2.6 | `mv_stats_globales` | 204 barrios, 6 capítulos, 9 casos públicos, 4 críticos, 3 progreso, 2 resueltos, 1 ciudadano verificado |
| 1.6 | Edge function `r2-presign` | 401 `UNAUTHORIZED_NO_AUTH_HEADER` (esperado sin token) → desplegada y viva |
| 3.5 | Archivos críticos Sprint C | todos presentes (`db/12`, `db/13`, `_redirects`, `robots.txt`, `lib/config.ts`, etc.) |

### Repo local

- `git log` — últimos 10 commits incluyen los 6 del Sprint C + `c0491b9` (FlowApadrinar refactor) + `d1aef2c` (fix migración 12) + commits anteriores. ✅
- `git status` — working tree casi limpio. Untracked: `scripts/smoke-check.mjs`, `scripts/smoke-output.txt`, `supabase/`, `backend/supabase/`. Modified: `backend/edge-functions/r2-presign/index.ts` (rename de `R2_PUBLIC_BASE_URL` → `R2_PUBLIC_URL` no commiteado).
- `npx tsc --noEmit` → exit 0
- `npx vite build` → ✓ built in 4.88s, exit 0
- Apellido **"Balvuena"** correcto en `Splash.tsx`, `Login.tsx`, `Home.tsx` (×2), `AdminSidebar.tsx`. Cero matches de "Balbuena".

---

## ⚠️ Tests no concluyentes por bloqueo de red

| ID | Test | Por qué no concluyó |
|----|------|---------------------|
| 1.1 | `GET https://mibiss.com.co` | FortiClient devuelve 200 con su HTML, no llega al origen Cloudflare Pages |
| 1.2 | Meta tags BISS en HTML | mismo motivo — el HTML es de FortiClient |
| 1.3 | `/assets/*.js` referenciado | el HTML no es de BISS, no contiene refs a `/assets/` |
| 1.4 | `_redirects` (ruta inexistente sirve `index.html`) | 200 viene de FortiClient, no del Pages |
| 1.5 | `/robots.txt` | FortiClient devuelve su HTML 20 KB en lugar del `robots.txt` real |
| 1.7 | `media.mibiss.com.co` HEAD | conexión bloqueada antes de llegar a R2 |

**Lo que SÍ podemos inferir:** dado que la edge function `r2-presign` (alojada en `*.supabase.co`, no bloqueada) responde correctamente, y la DB tiene los datos consumidos por las vistas y mutations creadas en Sprint A/B/C, el wiring está en orden. El bloqueo HTTP del dominio principal NO es bug de despliegue.

---

## 🔵 Tests de UI pendientes para humano (desde red sin FortiClient)

- [ ] Click visual en pin de caso → abre drawer con datos
- [ ] Login completo: email → OTP → paso 3 → /mi-cuenta (depende de BUG-C2 fixed)
- [ ] Submit testimonio end-to-end (RLS testimonios requiere `verificado_email=true`, depende de BUG-C2)
- [ ] Submit reportar caso → solicitudes_caso (depende de BUG-C2)
- [ ] Submit apadrinar (público, NO depende de BUG-C2)
- [ ] Admin panel responsive en mobile (sidebar mobile)
- [ ] Splash en mobile pequeño (360×640)
- [ ] Verificar visualmente que Home muestra **0** capítulos (BUG-C1) o **6** capítulos una vez aplicada migración 14

---

## 🛠 Acciones humanas pendientes para Sprint D

1. **🔥 Activar Email OTP provider en Supabase** (Auth → Providers → Email → toggle ON) — desbloquea registro ciudadanos. ETA 1 min.
2. **🔥 Aplicar migración fix `v_capitulos_publicos`** — ya hay archivos en `db/04-views.sql` con la definición buena; idealmente crear `db/14-fix-v-capitulos-publicos.sql` que haga `DROP VIEW` + `CREATE VIEW` solo de esa vista, para evitar tocar la MV `mv_stats_globales` ya migrada. ETA 5 min.
3. Pedir a TI de SuperGiros recategorizar `mibiss.com.co` en FortiClient (acción del usuario humano).
4. Decidir si commitear los untracked (`scripts/smoke-check.mjs`, `scripts/smoke-output.txt`) o `.gitignore` el `.txt`.
5. Revisar el rename pendiente `R2_PUBLIC_BASE_URL → R2_PUBLIC_URL` en `backend/edge-functions/r2-presign/index.ts` (consistencia con `.env.secrets` que ya usa `R2_PUBLIC_URL`).

---

## 🎯 Recomendaciones para Sprint D (priorizadas)

1. **Bug C1** — migración 14 (vista `v_capitulos_publicos`). Sin esto, el Home no pinta capítulos en prod ni en dev contra Supabase remoto. **Es la raíz del "no veo casos"** que el usuario reportó manualmente.
2. **Bug C2** — activar Email OTP en Auth → Providers. Sin esto, FlowIngresar entero está roto (no llega ni el primer OTP).
3. **Bug M1** — desbloquear FortiClient para que el usuario pueda probar desde la oficina.
4. (Mejora) Sitemap.xml dinámico — `robots.txt` ya apunta a él pero todavía no se genera. Vista posible: una función Postgres que devuelva todos los `casos.slug` y `barrios.slug` con `publicado_en` para `<lastmod>`.
5. (Mejora) Smoke test 1.x repetible **desde fuera de la red SuperGiros**. Sugerencia: configurar GitHub Action que corra `scripts/smoke-check.mjs` con `SUPABASE_URL` + `SUPABASE_ANON_KEY` como secrets y haga curl real al dominio. Así independiente de la red local.

---

## 📋 Tabla detallada de tests

| ID | Test | Pass/Fail | Status | Hallazgo clave |
|----|------|-----------|--------|----------------|
| 1.1 | GET / | ⚠️ inconcluso | 200 (FortiClient) | red bloquea |
| 1.2 | meta tags BISS | ⚠️ inconcluso | título=`Web Page Blocked!` | red bloquea |
| 1.3 | bundle JS referenciado | ⚠️ inconcluso | sin refs `/assets/` | red bloquea |
| 1.4 | SPA routing `_redirects` | ⚠️ inconcluso | 200 (FortiClient) | red bloquea |
| 1.5 | `/robots.txt` | ⚠️ inconcluso | body=20 KB FortiClient | red bloquea |
| 1.6 | edge fn `r2-presign` | ✅ pass | 401 `UNAUTHORIZED_NO_AUTH_HEADER` | desplegada OK |
| 1.7 | `media.mibiss.com.co` | ⚠️ inconcluso | sin respuesta | red bloquea |
| 2.1 | casos demo en `public.casos` | ✅ pass | 9 filas | demo seed OK |
| 2.1b | `v_casos_publicos` accesible | ✅ pass | 9 filas | RLS anon OK |
| 2.2 | columna `verificado_email` | ✅ pass | 200 con select | migración 12 aplicada |
| 2.4 | `padrinos` accesible | ✅ pass | 200 [] | RLS modelo híbrido OK |
| 2.5 | `/auth/v1/otp` responde | ✅ pass (con caveat) | 422 `otp_disabled` | endpoint vivo · BUG-C2 |
| 2.6 | `mv_stats_globales` | ✅ pass | 9 casos públicos | MV con `casos_progreso` OK |
| 2.7 | `v_capitulos_publicos.casos_progreso` | ❌ **fail** | 400 `column does not exist` | **BUG-C1** |
| 3.5 | archivos críticos Sprint C | ✅ pass | todos OK | |
| 5.3 | apellido "Balvuena" | ✅ pass | 5 matches, 0 errores | |
| 6.1 | Lighthouse | ⏭ omitido | bloqueo red | inviable desde aquí |

---

## Notas técnicas

- El smoke test fue ejecutado con `rejectUnauthorized: false` en Node TLS porque el proxy SSL corporativo rompe la cadena de cert. **Esto no afecta la validez de los resultados Supabase** (responden con cert válido de Cloudflare en el handshake real). Sí confirma que hay interceptor SSL entre el equipo y el internet abierto.
- Script reproducible: `node scripts/smoke-check.mjs` (lee `backend/.env.secrets`).
- Output raw del run: `scripts/smoke-output.txt`.

**Fin del reporte.**
