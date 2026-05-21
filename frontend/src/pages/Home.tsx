import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Map as MapIcon,
  Zap,
  Droplets,
  Lightbulb,
  Construction,
  Heart,
  GraduationCap,
  TreePine,
  Users,
  MoreHorizontal,
  Search,
  WifiOff,
  Eye,
  Instagram,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BissMap } from '../components/map/BissMap';
import { MapDrawer } from '../components/map/MapDrawer';
import { Modal } from '../components/ui';
import { useFlowDrawer } from '../context/FlowDrawer';

import { useBarrios } from '../hooks/useBarrios';
import { useZonas } from '../hooks/useZonas';
import { useStatsGlobales } from '../hooks/useStats';
import { useStatsPorCategoria } from '../hooks/useCategorias';
import { useCapitulosPublicos } from '../hooks/useCapitulos';
import { useScrollToHash } from '../hooks/useScrollToHash';
import { useVisitasPublicasMes } from '../hooks/useVisitasPublicas';
import { formatNumber } from '../lib/format';
import type { Barrio, CapituloPublico, CasoPublico, Zona } from '../types/biss';

const CATEGORIA_ICON: Record<string, typeof MapIcon> = {
  agua: Droplets,
  luz: Lightbulb,
  infraestructura: Construction,
  salud: Heart,
  educacion: GraduationCap,
  'medio-ambiente': TreePine,
  social: Users,
  otros: MoreHorizontal,
};

const CATEGORIA_VIEW = [
  { codigo: 'agua', nombre: 'Agua', color: 'var(--cat-agua)' },
  { codigo: 'luz', nombre: 'Luz', color: 'var(--cat-luz)' },
  { codigo: 'infraestructura', nombre: 'Infraestructura', color: 'var(--cat-infraestructura)' },
  { codigo: 'salud', nombre: 'Salud', color: 'var(--cat-salud)' },
  { codigo: 'educacion', nombre: 'Educación', color: 'var(--cat-educacion)' },
  { codigo: 'medio-ambiente', nombre: 'Medio ambiente', color: 'var(--cat-medio-ambiente)' },
  { codigo: 'social', nombre: 'Social', color: 'var(--cat-social)' },
  { codigo: 'otros', nombre: 'Otros', color: 'var(--cat-otros)' },
] as const;

type EstadoFilter = 'critical' | 'progress' | 'resolved';

export function Home() {
  useScrollToHash();
  const { openFlow } = useFlowDrawer();
  const navigate = useNavigate();
  const stats = useStatsGlobales();
  const statsCat = useStatsPorCategoria();
  const barrios = useBarrios();
  const zonas = useZonas();
  const capitulos = useCapitulosPublicos();
  const { data: visitasMes } = useVisitasPublicasMes();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<EstadoFilter | null>(null);
  const [barrioSinCasos, setBarrioSinCasos] = useState<Barrio | null>(null);
  const [drawerCaso, setDrawerCaso] = useState<CasoPublico | null>(null);

  const totals = stats.data;

  const zonaById = useMemo<Record<number, Zona>>(() => {
    return (zonas.data ?? []).reduce<Record<number, Zona>>((acc, z) => {
      acc[z.id] = z;
      return acc;
    }, {});
  }, [zonas.data]);

  // Conjunto de barrio_id que tienen al menos un capítulo público con casos.
  const barriosConCasos = useMemo<Set<number>>(() => {
    const s = new Set<number>();
    (capitulos.data ?? []).forEach((c) => {
      if (c.casos_total > 0) s.add(c.barrio_id);
    });
    return s;
  }, [capitulos.data]);

  // Lista TODOS los barrios. Los que ya tienen bitácora abierta llevan al
  // capítulo; los que no, abren un modal invitando a reportar el primer caso.
  const barriosFiltrados = useMemo<Barrio[]>(() => {
    const list = barrios.data ?? [];
    const q = search.trim().toLowerCase();
    if (q) return list.filter((b) => b.nombre.toLowerCase().includes(q));
    return list;
  }, [barrios.data, search]);

  const catCounts = useMemo<Record<string, number>>(() => {
    return (statsCat.data ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.codigo] = c.casos;
      return acc;
    }, {});
  }, [statsCat.data]);

  const stateCounts = useMemo(() => {
    if (totals) {
      return {
        critical: totals.casos_criticos,
        progress: totals.casos_progreso,
        resolved: totals.casos_resueltos,
      };
    }
    return { critical: 0, progress: 0, resolved: 0 };
  }, [totals]);

  // Capítulos reales para el grid "Bitácoras activas". Si aún no hay
  // ninguna bitácora abierta, mostramos un empty state en lugar de demos.
  const capitulosVisibles = useMemo(() => {
    const list = capitulos.data ?? [];
    return list.slice(0, 6).map((c: CapituloPublico) => ({
      slug: c.barrio_slug,
      nombre: c.barrio_nombre,
      zona: c.zona_nombre,
      resumen: c.descripcion ?? '',
      criticos: c.casos_criticos,
      progreso: c.casos_progreso,
      resueltos: c.casos_resueltos,
      cover: undefined as string | undefined,
    }));
  }, [capitulos.data]);

  const toggleState = (s: EstadoFilter) => {
    setStateFilter((prev) => (prev === s ? null : s));
  };

  return (
    <>
      <Navbar active="mapa" />

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="kicker">Banco de Ideas y Soluciones de Soledad</div>
            <h1>
              Tu Soledad, <span className="accent">contada por ti.</span>
            </h1>
            <p className="lead">
              Lo que pasa en tu barrio merece un lugar donde quede escrito, donde la gente lo vea
              y donde se mueva. Aquí abres caso, sumas testimonio y miras qué está cambiando.
            </p>
            <div className="hero-cta">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => openFlow('reportar')}
              >
                <Megaphone />Cuenta lo que pasa
              </button>
              <a className="btn btn-secondary btn-lg" href="#mapa">
                <MapIcon />Mira el mapa
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <span className="badge-float-top">
              <Zap style={{ width: 12, height: 12 }} />
              {formatNumber(totals?.casos_publicos ?? 0)} casos vivos
            </span>
            <img src="/biss-logo.png" alt="BISS" />
            <span className="badge-float">Soledad, Atlántico</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats-band">
        <div className="stats-grid">
          <div className="stat-big">
            <div className="n">{formatNumber(totals?.barrios_total ?? barrios.data?.length ?? 0)}</div>
            <div className="l">Barrios mapeados</div>
          </div>
          <div className="stat-big critical">
            <div className="n">{formatNumber(totals?.casos_criticos ?? 0)}</div>
            <div className="l">Casos críticos</div>
          </div>
          <div className="stat-big progress">
            <div className="n">{formatNumber(totals?.casos_progreso ?? 0)}</div>
            <div className="l">En gestión</div>
          </div>
          <div className="stat-big resolved">
            <div className="n">{formatNumber(totals?.casos_resueltos ?? 0)}</div>
            <div className="l">Resueltos</div>
          </div>
        </div>
        {typeof visitasMes === 'number' && visitasMes > 0 && (
          <div
            style={{
              maxWidth: 1100,
              margin: '14px auto 0',
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              role="status"
              aria-label={`${visitasMes} visitas en los últimos 30 días`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 9999,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Eye size={14} strokeWidth={2.2} />
              <span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatNumber(visitasMes)}
                </strong>{' '}
                vecinos leyeron BISS en los últimos 30 días
              </span>
            </div>
          </div>
        )}
      </section>

      {/* MAPA */}
      <section className="sec" id="mapa">
        <div className="sec-inner">
          <div className="sec-head">
            <div>
              <div className="kicker">El mapa</div>
              <h2>Toca cualquier punto y mira lo que pasa.</h2>
            </div>
            <p>
              Cada gota es un caso. Cada círculo es un hito que da contexto. Filtra por categoría,
              estado o busca por barrio.
            </p>
          </div>

          {/* Filtros de categoría · chips toggleables filtran los pines del mapa */}
          <div className="map-toolbar">
            <div className="map-filter-chips">
              <button
                type="button"
                className={catFilter === 'all' ? 'chip chip-active' : 'chip'}
                onClick={() => setCatFilter('all')}
              >
                Todas las categorías
              </button>
              {CATEGORIA_VIEW.map((c) => {
                const Icon = CATEGORIA_ICON[c.codigo] ?? MoreHorizontal;
                const active = catFilter === c.codigo;
                return (
                  <button
                    key={c.codigo}
                    type="button"
                    className={active ? 'chip chip-active' : 'chip'}
                    title={c.nombre}
                    onClick={() => setCatFilter(active ? 'all' : c.codigo)}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        width: 18,
                        height: 18,
                        borderRadius: 99,
                        background: c.color,
                        color: '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon style={{ width: 10, height: 10 }} strokeWidth={2.5} />
                    </span>
                    {c.nombre}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="map-wrap">
            <BissMap
              onBarrioClick={(b) => navigate(`/capitulo/${b.slug}`)}
              onCasoClick={(c) => setDrawerCaso(c)}
              categoryFilter={catFilter}
              stateFilter={
                stateFilter === 'critical' ? 'critico' :
                stateFilter === 'progress' ? 'progreso' :
                stateFilter === 'resolved' ? 'resuelto' :
                null
              }
            />
            <MapDrawer
              open={drawerCaso !== null}
              onClose={() => setDrawerCaso(null)}
              caso={drawerCaso}
            />
            <aside className="map-side">
              <div className="map-side-sticky">
                <div className="map-search-wrap" style={{ marginBottom: 8 }}>
                  <Search strokeWidth={2.2} />
                  <input
                    type="search"
                    placeholder="Buscar tu barrio…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <h3 style={{ margin: 0 }}>
                  {search.trim() ? 'Coincidencias' : 'Barrios con bitácora'}
                </h3>
              </div>
              <div>
                {barrios.isLoading && (
                  <div style={{ display: 'grid', gap: 6, padding: '4px 2px' }} aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: 38,
                          borderRadius: 8,
                          background: 'var(--surface-sunken)',
                          opacity: 0.7 - i * 0.12,
                        }}
                      />
                    ))}
                  </div>
                )}
                {barrios.isError && (
                  <p className="caption" style={{ padding: '6px 8px' }}>
                    Algo salió raro al leer los barrios. Vuelve a intentarlo.
                  </p>
                )}
                {!barrios.isLoading && !barrios.isError && barriosFiltrados.length === 0 && (
                  <p className="caption" style={{ padding: '6px 8px' }}>
                    Aquí no hay barrios todavía. Si vives en Soledad, cuéntalo.
                  </p>
                )}
                {barriosFiltrados.slice(0, 60).map((b) => {
                  const zona = zonaById[b.zona_id];
                  const tieneCasos = barriosConCasos.has(b.id);
                  if (tieneCasos) {
                    return (
                      <Link
                        key={b.id}
                        className="barrio-mini"
                        to={`/capitulo/${b.slug}`}
                        aria-label={`Abrir capítulo del barrio ${b.nombre}`}
                      >
                        <div>
                          <div className="name">{b.nombre}</div>
                          <div className="zone">{zona?.nombre ?? '—'}</div>
                        </div>
                        <span className="cnt">·</span>
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className="barrio-mini"
                      onClick={() => setBarrioSinCasos(b)}
                      aria-label={`${b.nombre} aún no tiene casos`}
                      style={{
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      <div>
                        <div className="name">{b.nombre}</div>
                        <div className="zone">{zona?.nombre ?? '—'} · sin casos</div>
                      </div>
                      <span className="cnt" style={{ color: 'var(--ink-faint)' }}>—</span>
                    </button>
                  );
                })}
              </div>
              <div className="legend">
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-soft)',
                    marginBottom: 2,
                  }}
                >
                  Leyenda
                </div>
                <div className="row">
                  <span className="dot" style={{ background: 'var(--state-critical)' }} />
                  <span><strong>Crítico</strong> · necesita acción ya</span>
                </div>
                <div className="row">
                  <span className="dot" style={{ background: 'var(--state-progress)' }} />
                  <span><strong>En gestión</strong> · Kevin lo está moviendo</span>
                </div>
                <div className="row">
                  <span className="dot" style={{ background: 'var(--state-resolved)' }} />
                  <span><strong>Resuelto</strong> · cuadrilla cerró el caso</span>
                </div>
                <div
                  className="row"
                  style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}
                >
                  <span
                    className="dot"
                    style={{ background: '#FFFFFF', border: '2px solid var(--biss-teal-900)' }}
                  />
                  <span><strong>Hito</strong> · referencia municipal</span>
                </div>
              </div>
            </aside>
          </div>

          {/* Filtros de ESTADO debajo del mapa */}
          <div className="map-state-bar">
            <span className="msb-label">Filtra por estado del caso:</span>
            <div className="map-filter-chips">
              <button
                type="button"
                className={stateFilter === 'critical' ? 'chip chip-active' : 'chip'}
                onClick={() => toggleState('critical')}
              >
                <span className="state-dot" style={{ background: 'var(--state-critical)' }} />
                Crítico <span className="chip-count">{stateCounts.critical}</span>
              </button>
              <button
                type="button"
                className={stateFilter === 'progress' ? 'chip chip-active' : 'chip'}
                onClick={() => toggleState('progress')}
              >
                <span className="state-dot" style={{ background: 'var(--state-progress)' }} />
                En gestión <span className="chip-count">{stateCounts.progress}</span>
              </button>
              <button
                type="button"
                className={stateFilter === 'resolved' ? 'chip chip-active' : 'chip'}
                onClick={() => toggleState('resolved')}
              >
                <span className="state-dot" style={{ background: 'var(--state-resolved)' }} />
                Resuelto <span className="chip-count">{stateCounts.resolved}</span>
              </button>
            </div>
          </div>

          <p className="net-note">
            <WifiOff style={{ width: 13, height: 13, verticalAlign: -2 }} /> Si los tiles del mapa
            no cargan, verifica tu conexión a internet.
          </p>
        </div>
      </section>

      {/* CASOS POR CATEGORÍA · cada card lleva a /categoria/:codigo */}
      <section
        className="sec"
        id="casos"
        style={{ background: 'var(--surface-sunken)', paddingTop: 60, paddingBottom: 60 }}
      >
        <div className="sec-inner">
          <div className="sec-head">
            <div>
              <div className="kicker">Casos por categoría</div>
              <h2>Explora por temática.</h2>
            </div>
            <p>
              Toca una categoría para ver todos los casos relacionados con ese tema en Soledad.
            </p>
          </div>
          <div className="cat-grid">
            {CATEGORIA_VIEW.map((c) => {
              const Icon = CATEGORIA_ICON[c.codigo] ?? MoreHorizontal;
              const n = catCounts[c.codigo] ?? 0;
              return (
                <Link key={c.codigo} className="cat-card" to={`/categoria/${c.codigo}`}>
                  <div className="ic" style={{ background: c.color }}>
                    <Icon />
                  </div>
                  <div className="name">{c.nombre}</div>
                  <div className="cnt">{formatNumber(n)} casos abiertos</div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* BARRIOS · Bitácoras activas */}
      <section className="sec" id="barrios">
        <div className="sec-inner">
          <div className="sec-head">
            <div>
              <div className="kicker">Bitácoras activas</div>
              <h2>Barrios con historia abierta.</h2>
            </div>
            <p>
              Cada barrio tiene su propia bitácora con casos, voces y padrinos. Tap en una tarjeta
              para entrar.
            </p>
          </div>
          {capitulosVisibles.length === 0 ? (
            <div
              style={{
                padding: '36px 24px',
                textAlign: 'center',
                background: 'var(--surface-sunken)',
                borderRadius: 16,
                border: '1px dashed var(--border)',
                maxWidth: 720,
                margin: '0 auto',
              }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>
                Aún no hay bitácoras abiertas.
              </h3>
              <p
                style={{
                  margin: '0 0 18px',
                  color: 'var(--ink-soft)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Cuando un vecino reporta el primer caso de su barrio, abrimos un capítulo público.
                Sé tú quien escriba la primera página.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openFlow('reportar')}
              >
                <Megaphone size={14} /> Reportar el primer caso
              </button>
            </div>
          ) : (
            <div className="barrios-grid">
              {capitulosVisibles.map((b) => (
                <Link
                  key={b.slug}
                  className="barrio-card"
                  to={`/capitulo/${b.slug}`}
                >
                  <div
                    className="barrio-cover"
                    style={b.cover ? { backgroundImage: b.cover } : undefined}
                  >
                    <span className="zone-chip">{b.zona}</span>
                  </div>
                  <div className="barrio-body">
                    <h3>{b.nombre}</h3>
                    {b.resumen && <p>{b.resumen}</p>}
                    <div className="barrio-stats">
                      {b.criticos > 0 && (
                        <span className="badge badge-critical">{b.criticos} críticos</span>
                      )}
                      {b.progreso > 0 && (
                        <span className="badge badge-progress">{b.progreso} en gestión</span>
                      )}
                      {b.resueltos > 0 && (
                        <span className="badge badge-resolved">{b.resueltos} resueltos</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* KEVIN */}
      <section
        className="sec"
        id="concejal"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <div className="sec-inner">
          <div className="kevin">
            <div className="kevin-photo" />
            <div>
              <span className="kicker-k">El concejal</span>
              <h2>Kevin Balvuena</h2>
              <div className="slogan">
                "No prometo nada. Cuento lo que pasa y muestro qué hicimos."
              </div>
              <p className="bio">
                Concejal de Soledad. Aquí no hablamos de promesas — mostramos qué pasa, qué se
                está moviendo y quién está aportando. Cada caso que abren los vecinos llega a su
                escritorio y queda con folio. Cuando algo se resuelve, lo decimos. Cuando no,
                también.
              </p>
              <div className="sig">Kevin Balvuena</div>
              <a
                className="kevin-ig"
                href="https://www.instagram.com/kevinbalvuenav?igsh=MWU0ZDNyNHptYm41Yw=="
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram de Kevin Balvuena"
              >
                <Instagram style={{ width: 14, height: 14 }} />
                @kevinbalvuenab
              </a>
              <br></br>
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: -8,
                  display: 'inline-block',
                }}
              >
                Concejal · período 2024–2027
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="sec" id="como-funciona">
        <div className="sec-inner">
          <div className="sec-head">
            <div>
              <div className="kicker">Cómo funciona</div>
              <h2>De tu calle al folio en 4 pasos.</h2>
            </div>
          </div>
          <div className="how-grid">
            <div className="how-step">
              <span className="n">01</span>
              <h4>Cuentas lo que pasa</h4>
              <p>
                Eliges categoría, escribes lo que viste, marcas dónde queda. Si tienes fotos, las
                subes.
              </p>
            </div>
            <div className="how-step">
              <span className="n">02</span>
              <h4>BISS revisa</h4>
              <p>
                Tu caso entra a la cola del equipo. Lo verificamos y lo publicamos con folio único.
              </p>
            </div>
            <div className="how-step">
              <span className="n">03</span>
              <h4>Sumamos voces</h4>
              <p>
                Otros vecinos cuentan su versión. Empresas y personas pueden apadrinar.
              </p>
            </div>
            <div className="how-step">
              <span className="n">04</span>
              <h4>Kevin lo mueve</h4>
              <p>
                El concejal radica oficios, coordina cuadrillas, te avisa por email cada vez que
                cambia.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => openFlow('reportar')}
            >
              <Megaphone />Empieza ahora
            </button>
          </div>
        </div>
      </section>

      <Modal
        open={barrioSinCasos !== null}
        onClose={() => setBarrioSinCasos(null)}
        title={`${barrioSinCasos?.nombre ?? ''} aún no tiene casos`}
        description="Sé el primero en abrir un caso en tu barrio."
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBarrioSinCasos(null)}
            >
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setBarrioSinCasos(null);
                openFlow('reportar');
              }}
            >
              <Megaphone size={14} />
              Reportar primer caso
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--ink-strong)', margin: 0, lineHeight: 1.5 }}>
          Cuando alguien reporta el primer caso en este barrio, abrimos un capítulo público con
          su bitácora. Cualquier vecino puede leer, comentar y sumar testimonios.
        </p>
      </Modal>

      <Footer />
    </>
  );
}
