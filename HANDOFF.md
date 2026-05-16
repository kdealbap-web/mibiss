# HANDOFF · BISS para Claude Code

> **Banco de Ideas y Soluciones de Soledad** — app cívica del municipio de Soledad (Atlántico, Colombia). Concejal Kevin Balvuena. Lema: *"Solo cosas buenas"*.
>
> Este archivo es el contrato de implementación. El prototipo HTML estático en este repo es la **fuente visual de verdad**. Aquí está todo lo que necesitas para portarlo a Vite + React + Supabase **sin perder fidelidad ni inventar nada**.

---

## 0. Reglas de oro (no negociables)

1. **El prototipo manda visualmente.** Si una decisión visual no está en el prototipo, no la tomes solo: revisa primero los archivos en `shared/` y los HTML. Si sigue ambiguo, pregunta.
2. **NO usar Tailwind atómico regado.** Las clases del prototipo son semánticas (`btn-primary`, `card`, `chip`, `badge-critical`). El dev las porta como CSS Modules, Vanilla Extract, Panda CSS, o equivalente que preserve el nombre. Una clase `.btn-primary` no se vuelve `bg-teal-500 px-5 py-3 ...`.
3. **Cero inventos de marca.** El logo `shared/logos/biss-logo.png` y `biss-mark.png` son los archivos canónicos del cliente — no los redibujes, no los reconstruyas como SVG hecho a mano.
4. **VAG Rounded Next es la única fuente de display + UI.** No cambies a Nunito, Roboto, Inter, ni nada. Sin fallbacks bonitos: `system-ui` como último recurso.
5. **Lima NO existe.** El proyecto migró a la paleta teal del manual oficial. Si encuentras `--biss-lima` o `--biss-navy` en componentes, son **aliases legacy que apuntan a teal** — no los uses para nada nuevo.
6. **Lima/teal NO es color de éxito.** Éxito = verde esmeralda `#3DAF6C`. Teal = marca.
7. **Tono cercano, siempre tú, nunca usted.** Frases cortas. Errores que abrazan. Confirmaciones que celebran sin gritar. Tabla completa en §6.

---

## 1. Stack obligatorio

| Capa | Tech |
|---|---|
| Build | Vite 5+ con React 18, TypeScript |
| Routing | React Router 6 |
| Data | Supabase (Postgres + Auth + Storage en B2 vía S3 compat) |
| Mapas | Leaflet 1.9.4 + tiles Carto Voyager (raster) |
| Iconos | Lucide React (`lucide-react`) — los mismos que ya están en el prototipo |
| Fuentes | VAG Rounded Next (CDN cdnfonts) + JetBrains Mono (Google Fonts) + Caveat (Google Fonts). **NO Nunito.** |
| Estado | React Query para server state; Context/useReducer para UI state local. Cero Redux/Zustand a menos que algo lo justifique. |
| Forms | React Hook Form + Zod |
| OTP/SMS | Twilio (gateway de SMS por celular del ciudadano) |
| Analytics | Plausible (self-hosted) o Umami · privacy-first, sin cookies. Stats expuestos en `/admin/metricas` vía API del proveedor. |

**Prohibido:**
- Tailwind atómico, daisyUI, Bootstrap, MUI, Chakra, Mantine — cualquier framework que imponga su sistema.
- Inventar componentes que ya están en el prototipo (`Drawer`, `Stepper`, `Chip`, etc.). Portar lo que hay.
- Generar SVGs del logo a partir de "cómo se ve". Usar PNG oficial.

---

## 2. Estructura del repo (objetivo)

```
biss-app/
├── public/
│   ├── biss-logo.png          ← copiar de shared/logos/biss-logo.png
│   ├── biss-mark.png          ← copiar de shared/logos/biss-mark.png
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── styles/
│   │   ├── tokens.css         ← portar shared/tokens.css 1:1 (no cambiar hex)
│   │   ├── base.css           ← portar shared/base.css
│   │   ├── components.css     ← portar shared/components.css
│   │   ├── admin.css          ← portar shared/admin.css
│   │   ├── storyboard.css     ← portar shared/storyboard.css
│   │   └── fonts.css          ← portar shared/fonts.css
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   └── format.ts          ← formatFolio, formatDate, slugBarrio
│   ├── hooks/
│   │   ├── useAuth.ts         ← ciudadano (OTP) + editor (email/pass)
│   │   ├── useCases.ts        ← React Query
│   │   ├── useBarrios.ts
│   │   └── useDrawer.ts       ← controla el drawer del mapa (Opción A)
│   ├── components/
│   │   ├── brand/
│   │   │   ├── BissLogo.tsx   ← <img src="/biss-logo.png" />, variants "default" | "white"
│   │   │   └── BissMark.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── NavMobile.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── AdminTopbar.tsx
│   │   ├── ui/                ← primitivas mappeadas a clases del prototipo
│   │   │   ├── Button.tsx     ← class="btn btn-primary"
│   │   │   ├── Card.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Badge.tsx      ← variant: state | category | folio | brand
│   │   │   ├── Field.tsx      ← input + label + helper + error
│   │   │   ├── Otp.tsx        ← 6 dígitos con auto-avance
│   │   │   ├── Stepper.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Tabs.tsx       ← data-tone="social|resolved|agua" para acentos
│   │   │   ├── Tooltip.tsx    ← data-tooltip + data-tooltip-tone
│   │   │   ├── Drawer.tsx     ← bottom-sheet mobile / lateral desktop
│   │   │   ├── Modal.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── ImgPlaceholder.tsx
│   │   ├── map/
│   │   │   ├── BissMap.tsx        ← Leaflet wrapper
│   │   │   ├── CasePin.tsx        ← divIcon 38×46
│   │   │   ├── HitoPin.tsx        ← divIcon 26×26
│   │   │   ├── MapDrawer.tsx      ← drawer lateral con caso resumido
│   │   │   ├── MapFilters.tsx     ← chips de categoría arriba
│   │   │   ├── MapStateBar.tsx    ← chips de estado debajo
│   │   │   └── MapSearch.tsx      ← autocomplete de barrio
│   │   ├── flows/                 ← drawer multi-step
│   │   │   ├── FlowReportar.tsx
│   │   │   ├── FlowTestimonio.tsx
│   │   │   ├── FlowApadrinar.tsx
│   │   │   └── FlowIngresar.tsx
│   │   └── splash/
│   │       └── BookSplash.tsx     ← libro 3D que se abre
│   ├── pages/
│   │   ├── Splash.tsx
│   │   ├── Home.tsx
│   │   ├── Capitulo.tsx
│   │   ├── Caso.tsx
│   │   ├── Login.tsx
│   │   ├── MiCuenta.tsx
│   │   ├── Showcase.tsx           ← útil mantenerla en dev
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── Solicitudes.tsx
│   │       ├── CasoEdit.tsx
│   │       ├── Testimonios.tsx
│   │       ├── MapaBarrios.tsx
│   │       ├── Padrinos.tsx
│   │       ├── Usuarios.tsx
│   │       └── Metricas.tsx
│   └── types/
│       ├── caso.ts
│       ├── barrio.ts
│       └── usuario.ts
```

---

## 3. Identidad visual · DON'T TOUCH

### 3.1 Logo
- **Archivo canónico:** `public/biss-logo.png` (wordmark + tagline) y `public/biss-mark.png` (solo B + bocadillos).
- **Variantes:**
  - `default` → tal cual el PNG (teal sobre fondo blanco).
  - `white` → CSS `filter: brightness(0) invert(1)` para fondos teal/oscuros.
  - `mono` → CSS `filter: grayscale(1) brightness(0.45)` para impresión.
- **Reglas del manual oficial:** isologo siempre en una sola tinta. Bocadillos en contraforma. Cero recoloreo arbitrario de partes del logo.

### 3.2 Paleta (tokens exactos)

```css
/* MARCA · única familia teal */
--biss-teal:        #0CB9C1;   /* brand · CTAs, links, focus */
--biss-teal-700:    #0A9BA2;   /* hover */
--biss-teal-900:    #06777C;   /* titulares, navbar text */
--biss-teal-100:    #C2EBED;   /* borders suaves */
--biss-teal-50:     #E1F7F8;   /* fondos sutiles, chips inactivos */

/* TINTA Y SUPERFICIE */
--ink-strong:       #06777C;
--ink:              #1F2937;
--ink-soft:         #53575F;
--ink-faint:        #9AA3B2;
--ink-inverse:      #FFFFFF;
--surface:          #FFFFFF;
--surface-raised:   #FAFBFC;
--surface-sunken:   #F2F3F4;
--border:           #E5E7EB;

/* ESTADOS (NO los confundas con marca) */
--state-critical:        #E4042C;   /* crítico */
--state-progress:        #FDC746;   /* en gestión · amarillo */
--state-progress-ink:    #8A6800;   /* texto legible sobre amarillo */
--state-resolved:        #3DAF6C;   /* resuelto · éxito */

/* 8 CATEGORÍAS */
--cat-agua:            #3773B9;
--cat-luz:             #F59E0B;
--cat-infraestructura: #92400E;
--cat-salud:           #E11D48;
--cat-educacion:       #7C3AED;
--cat-medio-ambiente:  #15803D;
--cat-social:          #D20B62;
--cat-otros:           #53575F;

/* 5 ZONAS TERRITORIALES (solo chips/labels, NO peleen con marca) */
--zone-centro-norte:    #1FAF4A;
--zone-occidental:      #2F33A3;
--zone-oriental:        #C99C0A;
--zone-sur:             #D9534F;
--zone-sur-occidental:  #7E57C2;
```

Hex completo + `*-bg` y `*-border` en `shared/tokens.css`. **Copia textual, no reinterpretes.**

### 3.3 Tipografía

```html
<link rel="stylesheet" href="shared/fonts.css">
```

- **Display + UI:** `'VAG Rounded Next', system-ui, sans-serif`
- **Mono (folios `CS-XXX`, coords, IDs):** `'JetBrains Mono', ui-monospace, monospace`
- **Hand (solo firma Kevin):** `'Caveat', cursive`

Pesos usados: 400, 600, 700, 800, 900. No agregar otros.

### 3.4 Radios, sombras, transiciones

Token-driven. Copiar `tokens.css` 1:1. **Sombras siempre tinted con teal** (rgba `6, 119, 124`), no negro puro.

---

## 4. Componentes obligatorios

Cada uno **ya existe** en el prototipo. La firma React debe respetar sus clases CSS exactas. No reinventes APIs.

### 4.1 Button
```tsx
<Button variant="primary" size="base" icon={<Megaphone />} block>
  Cuenta tu caso
</Button>
```
Variantes: `primary | secondary | ghost | danger`. Tamaños: `sm | base | lg`. Modificador: `icon-only`, `block`.

### 4.2 Drawer (CRÍTICO)
**Patrón híbrido** (ver §13 de `showcase.html`):
- Click en pin del mapa o card desde lista → **Drawer** se monta sobre el contexto.
- Llegar por URL directa (`/caso/CS-2026-0142`) → **página completa** con navbar+footer.

Comportamiento dentro del drawer (**Opción A, ya decidida**):
- Click en card de caso desde drawer de capítulo → **reemplaza** el contenido del drawer, aparece breadcrumb `← Capítulo X`. Cerrar drawer cierra todo.
- **NO drawer-on-drawer.**

Forma:
- Mobile ≤768px: bottom sheet 92vh, slide desde abajo 280ms, handle teal 36×4px arriba.
- Desktop ≥1024px: lateral 520px desde la derecha, radius 20px solo top-left.
- Tablet 768-1024: bottom sheet (recomendado, un solo breakpoint).

### 4.3 Mapa público
- Tiles: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- Centro: `[10.917, -74.762]`, zoom 13.
- Pines de caso: `divIcon` 38×46px, color de categoría, `state-tag` 12×6 abajo con color de estado.
- Hitos: `divIcon` 26×26px, blanco con borde teal-900.
- Click en pin → **MapDrawer** (componente que reusa la forma del Drawer general pero sin navbar interno, va embebido en el iframe del mapa con `position: absolute`).
- Cluster: navy teal con número, `>4` puntos cercanos.
- Filtros:
  - **Categorías arriba**, chips en barra blanca centrada. Multi-select dentro del grupo (toggle).
  - **Estados debajo del mapa** en barra teal-50 con label "Filtra por estado del caso:".
  - **Search de barrio** dentro del panel lateral derecho, encima de "Barrios con bitácora".
- Geocercas de barrio (cuando se tenga shapefile): stroke teal-900 1.5px + fill 6% teal en hover.

### 4.4 Stepper
- Pendiente: gris neutro.
- Active: **magenta social** `#D20B62` con anillo de foco rgba 18%.
- Done: **verde resuelto** `#3DAF6C` + label del mismo color + línea siguiente verde.

### 4.5 Tabs
- Default activo: teal-900 con underline teal.
- Con `data-tone="social|resolved|agua"`: underline + texto cambian al color del tono. Útil en `capitulo.html` y `mi-cuenta.html`.

### 4.6 Tooltip
- Default: teal-900.
- Con `data-tooltip-tone="success|warning|critical|social"`: cambia al color del tono. Implementado en CSS, no librería.

### 4.7 OTP segmentado (6 dígitos)
- Auto-avance entre casillas. Backspace borra y retrocede.
- Filled: fondo `--biss-teal-50` + borde `--biss-teal`.

---

## 5. Páginas (12 + admin extras)

### Públicas
| Ruta | Componente | Notas |
|---|---|---|
| `/` | `Splash.tsx` | Libro 3D abriéndose · 7s · auto-redirect a `/home` |
| `/home` | `Home.tsx` | Hero, stats, **mapa con drawer**, categorías, barrios, Kevin, cómo funciona, footer |
| `/capitulo/:slug` | `Capitulo.tsx` | Hero del barrio · stats · casos · testimonios · padrinos · FAB stack |
| `/caso/:folio` | `Caso.tsx` | Hero · multimedia · timeline · testimonios · padrinos · action bar sticky |
| `/login` | `Login.tsx` | Tabs **Soy ciudadano** (default · cel+OTP) / **Soy editor** (email+pass) |
| `/mi-cuenta` | `MiCuenta.tsx` | Perfil · mis casos · mis testimonios · padrinazgos · notificaciones |

### Flujos (modales drawer multi-step)
- `FlowReportar` — 5 pasos · genera folio `CS-YYYY-NNNN` al enviar.
- `FlowTestimonio` — 3 pasos · toggle anónimo.
- `FlowApadrinar` — 3 pasos · empresa/persona, tipo aporte (multi-select), contacto.
- `FlowIngresar` — 3 pasos · celular → OTP → datos básicos (skip si ya existe).

Cada flujo es **un solo componente** con estado local (`useReducer`). Persiste borrador en `localStorage` con clave `biss:flow:<nombre>`. Confirmación final es un estado dentro del mismo drawer, no una página.

### Admin (sidebar fijo)
| Ruta | Componente |
|---|---|
| `/admin` | `Dashboard.tsx` · alerta + 6 KPI + actividad + barras por categoría + top barrios |
| `/admin/solicitudes` | `Solicitudes.tsx` · cola con filtros · acción rápida ✓/×/edit |
| `/admin/caso/:folio` | `CasoEdit.tsx` · editor + timeline editable + media + zona peligrosa |
| `/admin/testimonios` | `Testimonios.tsx` · cola de moderación con filtro de lenguaje |
| `/admin/mapa-barrios` | `MapaBarrios.tsx` · preview de zonas + CRUD barrios + CRUD hitos |
| `/admin/padrinos` | `Padrinos.tsx` · padrinos activos + sin asignar · casos huérfanos |
| `/admin/usuarios` | `Usuarios.tsx` · ciudadanos + editores · suspender, promover |
| `/admin/metricas` | `Metricas.tsx` · **Analytics de visitas** (visitas únicas, páginas vistas, tiempo en sitio, mobile vs desktop, fuentes de tráfico — WhatsApp/Google/directo/redes) + KPIs operativos + line chart + bar chart + heatmap + top barrios |

---

## 6. Tono y copy (cerrado)

**Siempre tú. Nunca usted.** Sin excepciones.

| Lugar | Copy oficial |
|---|---|
| Splash CTA | "Abrir el libro" |
| Hero principal | "Tu Soledad, **contada por ti**." |
| Hero CTA | "Cuenta lo que pasa" |
| Hero CTA secundario | "Mira el mapa" |
| Reportar paso 1 | "¿Qué tipo de problema es?" |
| Reportar paso 2 | "Cuéntanos qué está pasando" |
| Reportar paso 3 | "Marca dónde queda" |
| Reportar paso 4 | "Si tienes fotos, súbelas" |
| Reportar paso 5 | "Revisa y envía" |
| Confirmación reporte | "Listo, llegó tu caso. Te avisamos cuando lo revisemos." |
| Folio | "Tu folio: CS-XXX. Guárdalo." |
| Testimonio paso 1 | "¿Quién eres tú aquí?" |
| Testimonio paso 2 | "¿Qué pasó? ¿Qué sentiste?" |
| Testimonio paso 3 | "¿Cómo firmas?" |
| Toggle anónimo | "Prefiero ser anónimo" |
| Apadrinar paso 1 | "¿Eres empresa o persona?" |
| Apadrinar paso 2 | "¿Cómo quieres aportar?" |
| Apadrinar paso 3 | "Déjanos cómo contactarte" |
| OTP envío | "Tu celular para enviarte el código" |
| OTP verificar | "Pon el código que te llegó" |
| Vacío casos | "Aquí no hay casos todavía. Sé el primero en contar." |
| Vacío testimonios | "Aquí no hay voces todavía. Si vives esto, cuéntalo." |
| Error genérico | "Algo salió raro. Vuelve a intentarlo." |
| Cargando | "Un segundo..." |
| Borrar confirm | "¿Seguro que quieres borrarlo?" |
| Tagline footer | "Solo cosas buenas" |
| Tagline splash | "El primer libro vivo de Soledad — escrito en tiempo real por sus vecinos." |

**Prohibido:** "estimado", "diligencie", "agregue", "proceda", "ingrese su". Verbos directos: **cuenta, mira, abre, súmate, comparte, marca, toca**.

---

## 7. Backend (Supabase)

### 7.1 Tablas mínimas

```sql
-- usuarios
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  rol text not null check (rol in ('ciudadano', 'editor', 'admin')) default 'ciudadano',
  celular text unique,            -- ciudadanos
  email text unique,              -- editores/admin
  nombre text,
  barrio_id uuid references barrios(id),
  notif_sms_estado boolean default true,
  notif_sms_testimonio boolean default true,
  created_at timestamptz default now()
);

-- barrios
create table barrios (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  zona text not null check (zona in ('centro-norte','occidental','oriental','sur','sur-occidental')),
  coord_lat numeric,
  coord_lng numeric,
  poligono jsonb,                 -- GeoJSON cuando llegue el shapefile
  foto_portada_url text,
  capitulo_activo boolean default false,
  descripcion text,
  created_at timestamptz default now()
);

-- casos
create table casos (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,     -- CS-YYYY-NNNN, generado en trigger
  titulo text not null,
  descripcion text not null,
  categoria text not null check (categoria in ('agua','luz','infraestructura','salud','educacion','medio-ambiente','social','otros')),
  estado text not null check (estado in ('pendiente','critico','progreso','resuelto','archivado')) default 'pendiente',
  coord_lat numeric not null,
  coord_lng numeric not null,
  barrio_id uuid references barrios(id),
  reportado_por uuid references usuarios(id),
  fecha_publicacion timestamptz,
  fecha_resolucion timestamptz,
  visible boolean default false,  -- aparece en mapa público
  acepta_testimonios boolean default true,
  acepta_padrinos boolean default true,
  destacado boolean default false,
  created_at timestamptz default now()
);

-- multimedia
create table multimedia (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid references casos(id) on delete cascade,
  tipo text check (tipo in ('foto','video','pdf')),
  url text not null,              -- B2 / S3 compat
  orden int default 0,
  created_at timestamptz default now()
);

-- timeline_eventos
create table timeline_eventos (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid references casos(id) on delete cascade,
  estado_pre text,
  estado_post text,
  titulo text not null,
  descripcion text,
  autor_id uuid references usuarios(id),
  created_at timestamptz default now()
);

-- testimonios
create table testimonios (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid references casos(id),
  barrio_id uuid references barrios(id),  -- testimonio puede ir al barrio si no hay caso
  autor_id uuid references usuarios(id),
  autor_rol text,                 -- 'vecino','familia','testigo','profesional','prefiere-no-decir'
  texto text not null,
  es_anonimo boolean default false,
  estado text check (estado in ('pendiente','aprobado','rechazado')) default 'pendiente',
  created_at timestamptz default now()
);

-- padrinos
create table padrinos (
  id uuid primary key default gen_random_uuid(),
  tipo text check (tipo in ('persona','empresa')),
  nombre text not null,
  representante text,
  nit text,
  celular text,
  email text,
  aportes text[],                 -- ['dinero','materiales','mano-de-obra','difusion']
  detalle text,
  monto_aproximado numeric,
  estado text check (estado in ('solicitado','activo','suspendido')) default 'solicitado',
  created_at timestamptz default now()
);

create table padrinos_casos (
  padrino_id uuid references padrinos(id),
  caso_id uuid references casos(id),
  primary key (padrino_id, caso_id)
);

-- comentarios (en cascada del caso, públicos)
create table comentarios (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid references casos(id) on delete cascade,
  autor_id uuid references usuarios(id),
  texto text not null,
  created_at timestamptz default now()
);

-- hitos_municipio
create table hitos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text,                      -- 'institucional','salud','transporte','comercial','espacio-publico'
  icono text,                     -- nombre lucide
  coord_lat numeric not null,
  coord_lng numeric not null,
  created_at timestamptz default now()
);
```

### 7.2 RLS (políticas obligatorias)

- `casos.visible = false` → solo editores ven en `select`.
- `testimonios.estado != 'aprobado'` → solo editores y el autor ven.
- Inserts de ciudadano siempre con `reportado_por = auth.uid()`.
- Update de estado de caso solo por `editor` o `admin`.

### 7.3 Auth

- **Ciudadano:** OTP por SMS vía Twilio (`/auth/v1/otp` con `phone`). Sesión 30 días.
- **Editor/Admin:** Email + password Supabase Auth estándar.
- Login unificado en `/login`: tabs deciden el método.

### 7.4 Storage

- Bucket `caso-media` en Backblaze B2 (S3 compat).
- Upload diferido al pulsar "Continuar" en paso 4 del flujo Reportar (background, no bloquea UI).
- Path: `caso-media/{folio}/{uuid}.{ext}`.

---

### 7.5 Analytics de visitas (requerido por el cliente)

Kevin necesita ver cuántas personas visitan el sitio una vez publicado. **No usar Google Analytics** (cookies + privacidad cuestionable para sitio cívico).

Opciones recomendadas:
- **Plausible self-hosted** (Docker) — sin cookies, GDPR-friendly, dashboard limpio. Recomendado.
- **Umami** (self-hosted, MIT) — alternativa equivalente.
- **Vercel Analytics** si se despliega en Vercel (más caro, integrado).

Instalar el snippet en `index.html` de Vite. Exponer en `/admin/metricas` (componente `Metricas.tsx`) los siguientes datos vía API del proveedor:

- **Visitas únicas / 30d** (KPI grande)
- **Páginas vistas** + ratio vistas/sesión
- **Tiempo promedio en sitio**
- **Tasa de rebote**
- **% mobile vs desktop** (con desglose iOS/Android)
- **Fuentes de tráfico:** WhatsApp (esperado el #1), Google orgánico, directo, Facebook, prensa local
- **Top páginas visitadas:** Home/Mapa, cada caso individual (`/caso/CS-XXX`), capítulos por barrio (`/capitulo/:slug`)
- **Gráfica diaria de visitas** últimos 30 días (barras teal, con picos resaltados en magenta cuando coinciden con publicaciones importantes)

Si Plausible/Umami se cae, el panel debe degradar grácil mostrando "Datos de analítica no disponibles. Verifica conexión a Plausible." — nunca romper la página.

## 8. Geografía y mapa

- **Sistema:** EPSG:4326 (lat/lng) en frontend y DB. El PDF oficial está en EPSG:3116 (MAGNA_Colombia_Bogota).
- **Bounding box:** NW `10.952, -74.798` · SE `10.882, -74.726`.
- **Centro inicial:** `10.917, -74.762` zoom 13.
- **Pendientes del backend (no del diseño):**
  1. Cruzar lista del PDF oficial (211 barrios) vs DB (204) — reconciliar diferencia.
  2. Geocoding aproximado con Nominatim mientras llega shapefile oficial.
  3. Solicitud formal a Secretaría de Planeación (Iris Polo) por el shapefile.
- En el frontend usar `proj4` solo si llega el shapefile en EPSG:3116; mientras tanto, todo en 4326.

---

## 9. Animaciones (mantener fidelidad)

- **Splash:** libro 3D con `transform-style: preserve-3d`, `perspective: 2200px`. Tapa rota -178° en 1800ms con `cubic-bezier(0.65, 0, 0.35, 1)` con delay 700ms. Auto-redirect a `/home` a los 7s. Botón "Saltar" siempre disponible. Respeta `prefers-reduced-motion`.
- **Drawer:** mobile slide desde abajo 280ms `cubic-bezier(0.16, 1, 0.3, 1)`. Desktop slide desde la derecha mismo timing.
- **Modal:** mismo easing, mobile bottom-sheet, desktop centered.
- **Botones:** hover sutil, `translateY(-2px)` en cards interactivas.
- **Pines mapa:** hover `translateY(-2px) scale(1.08)`.

Todas las transiciones definidas en `--t-fast | --t-base | --t-page | --t-modal | --t-bounce`. Usa esos tokens, no hardcodees.

---

## 10. Checklist de portado (en este orden)

1. ✅ Bootstrap Vite + React + TS + React Router 6.
2. ✅ Copiar `shared/` completo → `src/styles/`. **No tocar valores.**
3. ✅ Copiar PNGs del logo → `public/`.
4. ✅ Setup Supabase: tablas + RLS + función trigger para folio `CS-YYYY-NNNN`.
5. ✅ Auth ciudadano (OTP) + editor (email/pass) en una sola página `/login` con tabs.
6. ✅ Componentes UI primitivos (Button, Card, Chip, Badge, Field, Otp, Stepper, Alert, Tabs, Tooltip, Drawer, Modal, Timeline).
7. ✅ Navbar + NavMobile + Footer.
8. ✅ Splash con libro 3D (CSS-only, no framer-motion necesario).
9. ✅ Home con hero + stats + mapa Leaflet + MapDrawer + categorías + barrios + Kevin + cómo funciona.
10. ✅ Páginas Capítulo y Caso (públicas, deep-linkable).
11. ✅ 4 flujos como `<Drawer>` con `useReducer`.
12. ✅ Mi cuenta.
13. ✅ Admin: Sidebar + Dashboard + Solicitudes + CasoEdit + Testimonios + MapaBarrios + Padrinos + Usuarios + Métricas.
14. ✅ React Query queries por entidad: casos, barrios, testimonios, padrinos, usuarios.
15. ✅ SMS Twilio para OTP y notificaciones de estado.
16. ✅ Upload diferido a B2.
17. ✅ Setup despliegue (Vercel/Netlify para front, Supabase para back).

---

## 11. Lo que **NO** hagas

- ❌ Cambiar la paleta a "algo más moderno". Es la del manual.
- ❌ Usar Lima, Navy o cualquier hex viejo del primer brief.
- ❌ Sustituir VAG Rounded Next por Nunito, Inter, etc.
- ❌ Reescribir el logo como SVG hecho a mano.
- ❌ Inventar variantes del logo no documentadas.
- ❌ Drawer-on-drawer (Opción B). Solo reemplazo con breadcrumb (Opción A).
- ❌ Tailwind atómico regado en JSX.
- ❌ Usted, estimado, diligencie, agregue.
- ❌ Emojis como iconos.
- ❌ Pergamino, números romanos decorativos, sellos rotados, serif italic.
- ❌ Lima como color de éxito (no existe lima, pero por si acaso: éxito = verde esmeralda).

---

## 12. Si quedan dudas

El prototipo HTML está vivo y completo. Antes de inventar:
1. Abre el archivo HTML correspondiente y mira cómo se ve.
2. Revisa `shared/components.css` para la clase exacta.
3. Revisa el `showcase.html` §13 para el patrón de drawer y §10 para el stepper.
4. Si después de eso sigue ambiguo: pregunta al equipo (Kevin / Iris / el dev a cargo). No supongas.

##  13. Hay cosas que ya estaban avanzadas en lo funcional:
1. Backend avanzado con otro diseño, incorporar al diseño, o editar ese backend para que sea compatible, con este nuevo diseño.
2. Existe ya una conexión a un backblaze r2 , para multimedia, imagenes, videos, material relevante como documentos etc.
3. Conexión ya definida con una base de datos, te voy a pasar dentro de la estructura un archivo .env.local.
4. Luego hacemos pruebas funcionales de todo y vamos construyendo la aplicación 

## 14. Fijate que ya en db hay una carpeta donde está la estructura creada triggers, funciones y schemas.

Lo nuevo sería hacer el update, porque ya tenemos un aproximado de las coordenadas correspondientes a cada ubicación del barrio en cuanto a latitud y longitud, este query se ejecutará en paralelo, es decir que ya no podemos estar ubicando los iconos de los casos, aleatoriamente, si no en base a la ubicación real, aproximada del barrio dentro del mapa, segun la base de datos, esto es nuevo.


## 15. Regla de oro:

El nombre real del proyecto ahora es biss. ya no mas la bitacora de soledad.

**Fin del handoff.** El primer libro vivo de Soledad espera. Adelante.

— Equipo BISS · concejal Kevin Balvuena · "Solo cosas buenas"
