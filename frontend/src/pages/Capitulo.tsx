import { useState } from 'react';
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
  MessageSquareQuote,
  HandHeart,
  Megaphone,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { BarrioMiniMap } from '../components/map/BarrioMiniMap';
import { useFlowDrawer } from '../context/FlowDrawer';
import { useCapituloPorSlug, useCasosPorCapitulo } from '../hooks/useCapitulos';
import { useTestimoniosPorCapitulo } from '../hooks/useTestimonios';
import { formatFolio, formatRelative, initials } from '../lib/format';
import type { CasoPublico, EstadoCaso, TestimonioPublico } from '../types/biss';

import '../styles/page-capitulo.css';

const ICON_CAT: Record<string, typeof Construction> = {
  agua: Droplets,
  luz: Lightbulb,
  infraestructura: Construction,
  salud: Heart,
  educacion: GraduationCap,
  'medio-ambiente': TreePine,
  social: Users,
  otros: MoreHorizontal,
};

const ESTADO_BADGE: Record<EstadoCaso, { cls: string; txt: string }> = {
  pendiente: { cls: 'badge', txt: 'Pendiente' },
  critico: { cls: 'badge badge-critical', txt: 'Crítico' },
  progreso: { cls: 'badge badge-progress', txt: 'En gestión' },
  resuelto: { cls: 'badge badge-resolved', txt: 'Resuelto' },
  archivado: { cls: 'badge', txt: 'Archivado' },
};

type Tab = 'casos' | 'testimonios' | 'comentarios' | 'padrinos';

export function Capitulo() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { openFlow } = useFlowDrawer();
  const [tab, setTab] = useState<Tab>('casos');

  const { data: capitulo, isLoading } = useCapituloPorSlug(slug);
  const { data: casos = [] } = useCasosPorCapitulo(capitulo?.capitulo_id ?? null);
  const { data: testimonios = [] } = useTestimoniosPorCapitulo(capitulo?.capitulo_id ?? null);

  if (isLoading) {
    return (
      <>
        <Navbar active="barrios" />
        <section className="chap-hero">
          <div className="chap-hero-inner">
            <p className="caption" style={{ color: 'rgba(255,255,255,0.9)' }}>Un segundo…</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (!capitulo) {
    return (
      <>
        <Navbar active="barrios" />
        <section className="chap-hero">
          <div className="chap-hero-inner">
            <h1>No hay bitácora abierta aquí todavía</h1>
            <p className="sub">
              Este barrio existe pero su capítulo no está activo. Si vives aquí, súmate y abrámoslo juntos.
            </p>
          </div>
        </section>
        <main className="chap-main">
          <div className="chap-grid">
            <div>
              <p className="caption">
                <Link to="/home#barrios" style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}>
                  Volver al listado de barrios
                </Link>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const zonaSlug = capitulo.zona_codigo;
  const heroBg =
    zonaSlug === 'centro-norte'
      ? 'linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-centro-norte) 0 24px, #167F38 24px 48px)'
      : zonaSlug === 'oriental'
      ? 'linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-oriental) 0 24px, #A37F08 24px 48px)'
      : zonaSlug === 'sur'
      ? 'linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-sur) 0 24px, #B83F3D 24px 48px)'
      : zonaSlug === 'sur-occidental'
      ? 'linear-gradient(180deg, rgba(6,119,124,0.55) 0%, rgba(6,119,124,0.85) 100%), repeating-linear-gradient(135deg, var(--zone-sur-occidental) 0 24px, #6442A4 24px 48px)'
      : undefined;

  return (
    <>
      <Navbar active="barrios" />

      <section className="chap-hero" style={heroBg ? { backgroundImage: heroBg } : undefined}>
        <div className="chap-hero-inner">
          <div className="chap-breadcrumb">
            <Link to="/home">Soledad</Link> <span>/</span>
            <Link to="/home#barrios">Barrios</Link> <span>/</span>
            <span>{capitulo.barrio_nombre}</span>
          </div>
          <div>
            <span className="chip" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
              {capitulo.zona_nombre}
            </span>
            <h1 style={{ marginTop: 12 }}>{capitulo.barrio_nombre}</h1>
            <p className="sub">
              {capitulo.descripcion ?? 'Bitácora abierta del barrio. Aquí los vecinos cuentan lo que pasa y miran qué se está moviendo.'}
            </p>
          </div>
        </div>
      </section>

      <div className="chap-stats">
        <div className="stat-tile">
          <div className="n">{capitulo.casos_total}</div>
          <div className="l">Casos activos</div>
        </div>
        <div className="stat-tile critical">
          <div className="n">{capitulo.casos_criticos}</div>
          <div className="l">Críticos</div>
        </div>
        <div className="stat-tile progress">
          <div className="n">{capitulo.casos_progreso}</div>
          <div className="l">En gestión</div>
        </div>
        <div className="stat-tile resolved">
          <div className="n">{capitulo.casos_resueltos}</div>
          <div className="l">Resueltos</div>
        </div>
      </div>

      <main className="chap-main">
        <div className="chap-grid">
          <div>
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button
                type="button"
                className="tab"
                data-state={tab === 'casos' ? 'active' : undefined}
                onClick={() => setTab('casos')}
              >
                Casos ({casos.length})
              </button>
              <button
                type="button"
                className="tab"
                data-tone="social"
                data-state={tab === 'testimonios' ? 'active' : undefined}
                onClick={() => setTab('testimonios')}
              >
                Testimonios ({testimonios.length})
              </button>
            </div>

            {tab === 'casos' && (
              <div className="chap-section">
                <h2>Casos abiertos del barrio</h2>
                {casos.length === 0 ? (
                  <p className="caption">Aquí no hay casos todavía. Sé el primero en contar.</p>
                ) : (
                  casos.map((c) => <CaseCardRow key={c.id} caso={c} />)
                )}
              </div>
            )}

            {tab === 'testimonios' && (
              <div className="chap-section">
                <h2>Voces del barrio</h2>
                {testimonios.length === 0 ? (
                  <p className="caption">Aquí no hay voces todavía. Si vives esto, cuéntalo.</p>
                ) : (
                  testimonios.map((t) => <TestimonioRow key={t.id} testimonio={t} />)
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: 6 }}
                  onClick={() =>
                    openFlow('testimonio', {
                      capituloId: capitulo.capitulo_id,
                      capituloSlug: slug,
                    })
                  }
                >
                  <MessageSquareQuote />Sumar tu voz
                </button>
              </div>
            )}
          </div>

          <aside>
            <div className="side-card">
              <h3 style={{ marginBottom: 12 }}>Ubicación del barrio</h3>
              <BarrioMiniMap
                barrioId={capitulo.barrio_id}
                barrioNombre={capitulo.barrio_nombre}
                zonaNombre={capitulo.zona_nombre}
                lat={capitulo.coord_lat}
                lng={capitulo.coord_lng}
                geocerca={capitulo.geocerca}
                accent={capitulo.zona_color || 'var(--biss-teal)'}
                height={220}
              />
            </div>

            <div className="side-card">
              <h3>El barrio en una línea</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                {capitulo.zona_nombre} · {capitulo.casos_total} casos abiertos · {capitulo.casos_resueltos} resueltos.
              </p>
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
                onClick={() =>
                  openFlow('apadrinar', {
                    capituloId: capitulo.capitulo_id,
                    capituloSlug: slug,
                    casoTitulo: `el barrio ${capitulo.barrio_nombre}`,
                  })
                }
              >
                Apadrinar {capitulo.barrio_nombre} <HandHeart />
              </button>
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
          onClick={() => openFlow('testimonio', { capituloId: capitulo.capitulo_id, capituloSlug: slug })}
        >
          <MessageSquareQuote />
        </button>
        <button type="button" className="fab" aria-label="Reportar caso" onClick={() => openFlow('reportar')}>
          <Megaphone />
        </button>
      </div>
    </>
  );
}

function CaseCardRow({ caso }: { caso: CasoPublico }) {
  const Icon = ICON_CAT[caso.categoria_codigo] ?? MoreHorizontal;
  const { cls, txt } = ESTADO_BADGE[caso.estado];
  return (
    <Link className="case-card" to={`/caso/${caso.slug}`}>
      <div className="ico" style={{ background: `var(--cat-${caso.categoria_codigo})` }}>
        <Icon />
      </div>
      <div>
        <div className="title">{caso.titulo}</div>
        <div className="meta">
          <span className="mono">{formatFolio(caso.slug)}</span>
          {caso.publicado_en && <> · publicado {formatRelative(caso.publicado_en)}</>}
        </div>
      </div>
      <span className={cls}>
        <span className="dot" />
        {txt}
      </span>
    </Link>
  );
}

function TestimonioRow({ testimonio }: { testimonio: TestimonioPublico }) {
  return (
    <div className="testimonio">
      <p>{testimonio.mensaje}</p>
      <div className="author">
        <div className="leader-av" style={{ background: 'var(--cat-social)' }}>
          {initials(testimonio.autor_visible)}
        </div>
        <span>
          <strong>{testimonio.autor_visible}</strong> · {testimonio.relacion} · {formatRelative(testimonio.creado_en)}
        </span>
      </div>
    </div>
  );
}
