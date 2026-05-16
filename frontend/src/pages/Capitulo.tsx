import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Construction,
  Droplets,
  Lightbulb,
  Users,
  TreePine,
  Heart,
  GraduationCap,
  MoreHorizontal,
  ArrowDown,
  MessageSquareQuote,
  HandHeart,
  Megaphone,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useBarrios } from '../hooks/useBarrios';
import { useZonas } from '../hooks/useZonas';
import { useFlowDrawer } from '../context/FlowDrawer';

import '../styles/page-capitulo.css';

const ICON: Record<string, typeof Construction> = {
  agua: Droplets,
  luz: Lightbulb,
  infraestructura: Construction,
  salud: Heart,
  educacion: GraduationCap,
  'medio-ambiente': TreePine,
  social: Users,
  otros: MoreHorizontal,
};

interface CasoPlaceholder {
  folio: string;
  titulo: string;
  categoria: keyof typeof ICON;
  vecinos: number;
  publicado: string;
  estado: 'critico' | 'progreso' | 'resuelto';
}

const CASOS_PLACEHOLDER: CasoPlaceholder[] = [
  { folio: 'CS-2026-0142', titulo: 'Cráter en la calle 30', categoria: 'infraestructura', vecinos: 14, publicado: 'hace 8 meses', estado: 'progreso' },
  { folio: 'CS-2026-0128', titulo: 'Sin agua los lunes en toda la manzana', categoria: 'agua', vecinos: 23, publicado: 'hace 6 semanas', estado: 'critico' },
  { folio: 'CS-2026-0089', titulo: 'Tres postes apagados desde febrero', categoria: 'luz', vecinos: 9, publicado: 'hace 12 semanas', estado: 'progreso' },
  { folio: 'CS-2026-0044', titulo: 'Niños sin parque seguro tras cierre', categoria: 'social', vecinos: 18, publicado: 'hace 5 meses', estado: 'critico' },
  { folio: 'CS-2025-0398', titulo: 'Basurero ilegal en zona verde', categoria: 'medio-ambiente', vecinos: 6, publicado: 'hace 4 meses', estado: 'resuelto' },
];

const TESTIMONIOS_PLACEHOLDER = [
  {
    iniciales: 'DP',
    color: 'var(--cat-social)',
    nombre: 'Diana Pérez',
    rol: 'vecina',
    cuando: 'hace 3 semanas',
    texto:
      'El cráter de la calle 30 lleva ocho meses sin tapar. La moto de Don Édgar se cayó dos veces. Los carros lo esquivan invadiendo el carril contrario. Esto no debería ser normal.',
  },
  {
    iniciales: 'MJ',
    color: 'var(--cat-agua)',
    nombre: 'Marlén J.',
    rol: 'vecina',
    cuando: 'hace 5 días',
    texto:
      'Llevo cuatro lunes seguidos sin agua. Mi hija nació hace dos meses. Para hervir tetero toca cargar baldes de la casa de mi mamá en San Vicente.',
  },
  {
    iniciales: 'DR',
    color: 'var(--biss-teal)',
    nombre: 'Don Rafael',
    rol: 'líder comunal',
    cuando: 'hace 2 semanas',
    texto:
      'Como líder de la cuadra, ya nos cansamos. Llevamos doce oficios radicados a Triple A y aún no hay respuesta formal. Que se entere la prensa.',
  },
];

const LIDERES_PLACEHOLDER = [
  { iniciales: 'DR', nombre: 'Don Rafael Caicedo', rol: 'Presidente JAC' },
  { iniciales: 'MP', nombre: 'María del Pilar', rol: 'Líder de cuadra · sector A' },
  { iniciales: 'EP', nombre: 'Édgar Polo', rol: 'Vecino activo' },
];

const PADRINOS_PLACEHOLDER = [
  { iniciales: 'FD', bg: 'var(--state-resolved-bg)', ink: 'var(--state-resolved)', nombre: 'Ferretería Don Iván', rol: 'Aporta materiales · 2 casos' },
  { iniciales: 'PA', bg: 'var(--cat-luz-bg)', ink: 'var(--cat-luz)', nombre: 'Panadería Atlántico', rol: 'Difusión y refrigerios' },
];

export function Capitulo() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { openFlow } = useFlowDrawer();
  const { data: barrios = [] } = useBarrios();
  const { data: zonas = [] } = useZonas();

  const barrio = useMemo(
    () => barrios.find((b) => b.slug === slug),
    [barrios, slug],
  );
  const zona = useMemo(
    () => zonas.find((z) => z.id === barrio?.zona_id),
    [zonas, barrio],
  );

  const nombre = barrio?.nombre ?? slug.replace(/-/g, ' ').toUpperCase();
  const zonaNombre = zona?.nombre ?? 'Zona occidental';
  const zonaSlug = zona?.codigo ?? 'occidental';

  return (
    <>
      <Navbar active="barrios" />

      <section
        className="chap-hero"
        style={{
          backgroundImage:
            zonaSlug === 'centro-norte'
              ? `linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-centro-norte) 0 24px, #167F38 24px 48px)`
              : zonaSlug === 'oriental'
              ? `linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-oriental) 0 24px, #A37F08 24px 48px)`
              : zonaSlug === 'sur'
              ? `linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-sur) 0 24px, #B83F3D 24px 48px)`
              : zonaSlug === 'sur-occidental'
              ? `linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-sur-occidental) 0 24px, #6442A4 24px 48px)`
              : undefined,
        }}
      >
        <div className="chap-hero-inner">
          <div className="chap-breadcrumb">
            <Link to="/home">Soledad</Link> <span>/</span>
            <Link to="/home#barrios">Barrios</Link> <span>/</span>
            <span>{nombre}</span>
          </div>
          <div>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
              {zonaNombre}
            </span>
            <h1 style={{ marginTop: 12 }}>{nombre}</h1>
            <p className="sub">
              {barrio
                ? `Bitácora abierta del barrio. Aquí los vecinos cuentan lo que pasa y miran qué se está moviendo.`
                : `Aún no encontramos este capítulo. Si vives aquí, súmate y abrámoslo juntos.`}
            </p>
          </div>
        </div>
      </section>

      <div className="chap-stats">
        <div className="stat-tile"><div className="n">23</div><div className="l">Casos activos</div></div>
        <div className="stat-tile critical"><div className="n">3</div><div className="l">Críticos</div></div>
        <div className="stat-tile progress"><div className="n">14</div><div className="l">En gestión</div></div>
        <div className="stat-tile resolved"><div className="n">6</div><div className="l">Resueltos</div></div>
      </div>

      <main className="chap-main">
        <div className="chap-grid">
          <div>
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className="tab" data-state="active" type="button">Casos (23)</button>
              <button className="tab" data-tone="social" type="button">Testimonios (8)</button>
              <button className="tab" data-tone="agua" type="button">Comentarios (47)</button>
              <button className="tab" data-tone="resolved" type="button">Padrinos (3)</button>
            </div>

            <div className="chap-section">
              <h2>Casos abiertos del barrio</h2>
              {CASOS_PLACEHOLDER.map((c) => {
                const Icon = ICON[c.categoria] ?? MoreHorizontal;
                const badgeClass =
                  c.estado === 'critico' ? 'badge badge-critical'
                    : c.estado === 'progreso' ? 'badge badge-progress'
                    : 'badge badge-resolved';
                const badgeText =
                  c.estado === 'critico' ? 'Crítico'
                    : c.estado === 'progreso' ? 'En gestión'
                    : 'Resuelto';
                return (
                  <Link key={c.folio} className="case-card" to={`/caso/${c.folio}`}>
                    <div className="ico" style={{ background: `var(--cat-${c.categoria})` }}>
                      <Icon />
                    </div>
                    <div>
                      <div className="title">{c.titulo}</div>
                      <div className="meta">
                        <span className="mono">{c.folio}</span> · {c.vecinos} vecinos sumados · publicado {c.publicado}
                      </div>
                    </div>
                    <span className={badgeClass}>
                      <span className="dot" />{badgeText}
                    </span>
                  </Link>
                );
              })}
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>
                Ver los otros 18 casos <ArrowDown />
              </button>
            </div>

            <div className="chap-section">
              <h2>Voces del barrio</h2>
              {TESTIMONIOS_PLACEHOLDER.map((t, i) => (
                <div key={i} className="testimonio">
                  <p>{t.texto}</p>
                  <div className="author">
                    <div className="leader-av" style={{ background: t.color }}>{t.iniciales}</div>
                    <span><strong>{t.nombre}</strong> · {t.rol} · {t.cuando}</span>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 6 }}
                onClick={() => openFlow('testimonio', { capituloSlug: slug })}
              >
                <MessageSquareQuote />Sumar tu voz
              </button>
            </div>
          </div>

          <aside>
            <div className="side-card">
              <h3>El barrio en una línea</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                {zonaNombre} · ~12 mil habitantes. JAC activa. 23 casos abiertos y 6 ya resueltos.
              </p>
            </div>

            <div className="side-card">
              <h3>Líderes activos</h3>
              {LIDERES_PLACEHOLDER.map((l) => (
                <div key={l.iniciales} className="leader">
                  <div className="av">{l.iniciales}</div>
                  <div>
                    <div className="name">{l.nombre}</div>
                    <div className="role">{l.rol}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="side-card"
              style={{ background: 'var(--biss-teal)', color: '#FFFFFF', borderColor: 'var(--biss-teal-700)' }}
            >
              <h3 style={{ color: '#FFFFFF' }}>¿Quieres apadrinar este barrio?</h3>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.92)', lineHeight: 1.55, marginBottom: 14 }}>
                Empresas y personas pueden aportar a un caso específico o a la bitácora completa.
              </p>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  ['--btn-bg' as never]: '#fff',
                  ['--btn-ink' as never]: 'var(--biss-teal-900)',
                  ['--btn-border' as never]: '#fff',
                  ['--btn-bg-hover' as never]: 'rgba(255,255,255,0.92)',
                }}
                onClick={() => openFlow('apadrinar', { capituloSlug: slug, casoTitulo: `el barrio ${nombre}` })}
              >
                Apadrinar {nombre} <HandHeart />
              </button>
            </div>

            <div className="side-card">
              <h3>Padrinos del barrio</h3>
              {PADRINOS_PLACEHOLDER.map((p) => (
                <div key={p.iniciales} className="leader">
                  <div className="av" style={{ background: p.bg, color: p.ink }}>{p.iniciales}</div>
                  <div>
                    <div className="name">{p.nombre}</div>
                    <div className="role">{p.rol}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <div className="fab-stack">
        <button
          type="button"
          className="fab social"
          aria-label="Sumar testimonio"
          onClick={() => openFlow('testimonio', { capituloSlug: slug })}
        >
          <MessageSquareQuote />
        </button>
        <button
          type="button"
          className="fab"
          aria-label="Reportar caso"
          onClick={() => openFlow('reportar')}
        >
          <Megaphone />
        </button>
      </div>
    </>
  );
}
