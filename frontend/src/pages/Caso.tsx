import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Construction,
  Droplets,
  Lightbulb,
  Heart,
  GraduationCap,
  TreePine,
  Users,
  MoreHorizontal,
  MapPin,
  Building2,
  HandHeart,
  MessageSquareQuote,
  Share2,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useFlowDrawer } from '../context/FlowDrawer';
import { useCaso, useMultimediaCaso } from '../hooks/useCaso';
import { useActualizaciones } from '../hooks/useActualizaciones';
import { useTestimoniosPorCaso } from '../hooks/useTestimonios';
import { usePadrinosPorCaso } from '../hooks/usePadrinos';
import { formatFolio, formatRelative } from '../lib/format';
import type { CasoPublico, EstadoCaso, TipoApoyo } from '../types/biss';

import '../styles/page-caso.css';

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

const ESTADO_LABEL: Record<EstadoCaso, string> = {
  pendiente: 'Pendiente',
  critico: 'Crítico',
  progreso: 'En gestión',
  resuelto: 'Resuelto',
  archivado: 'Archivado',
};

const ESTADO_BADGE: Record<EstadoCaso, string> = {
  pendiente: 'badge',
  critico: 'badge badge-critical',
  progreso: 'badge badge-progress',
  resuelto: 'badge badge-resolved',
  archivado: 'badge',
};

const TIMELINE_COLOR: Record<EstadoCaso, string> = {
  pendiente: 'var(--ink-faint)',
  critico: 'var(--state-critical)',
  progreso: 'var(--state-progress)',
  resuelto: 'var(--state-resolved)',
  archivado: 'var(--ink-soft)',
};

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const APORTE_LABEL: Record<TipoApoyo, string> = {
  financiero: 'Financiero',
  material: 'Materiales',
  voluntario: 'Voluntario',
  politico: 'Político',
  otro: 'Otro',
};

export function Caso() {
  const { folio = '' } = useParams<{ folio: string }>();
  const { openFlow } = useFlowDrawer();
  const slug = folio.toLowerCase();

  const { data: caso, isLoading, isError } = useCaso(slug);
  const { data: media = [] } = useMultimediaCaso(caso?.id ?? null);
  const { data: actualizaciones = [] } = useActualizaciones(caso?.id ?? null);
  const { data: testimonios = [] } = useTestimoniosPorCaso(caso?.id ?? null);
  const { data: padrinos = [] } = usePadrinosPorCaso(caso?.id ?? null);

  useEffect(() => {
    document.body.classList.add('caso-body');
    return () => document.body.classList.remove('caso-body');
  }, []);

  if (isLoading) {
    return (
      <>
        <Navbar active="casos" />
        <section className="caso-hero">
          <div className="caso-hero-inner">
            <p className="caption">Un segundo…</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (isError || !caso) {
    return (
      <>
        <Navbar active="casos" />
        <section className="caso-hero">
          <div className="caso-hero-inner">
            <h1>No encontramos ese caso</h1>
            <p className="lead" style={{ color: 'var(--ink-soft)' }}>
              Puede que el folio esté mal escrito o que el caso aún no esté publicado.{' '}
              <Link to="/home" style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}>
                Vuelve al mapa
              </Link>
              .
            </p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <CasoContent
      caso={caso}
      media={media}
      actualizaciones={actualizaciones}
      testimonios={testimonios}
      padrinos={padrinos}
      openFlow={openFlow}
    />
  );
}

interface CasoContentProps {
  caso: CasoPublico;
  media: import('../types/biss').MultimediaCaso[];
  actualizaciones: import('../types/biss').ActualizacionCaso[];
  testimonios: import('../types/biss').TestimonioPublico[];
  padrinos: import('../hooks/usePadrinos').PadrinoConAporte[];
  openFlow: ReturnType<typeof useFlowDrawer>['openFlow'];
}

function CasoContent({ caso, media, actualizaciones, testimonios, padrinos, openFlow }: CasoContentProps) {
  const Icon = ICON_CAT[caso.categoria_codigo] ?? MoreHorizontal;
  const folioVisible = formatFolio(caso.slug);

  return (
    <>
      <Navbar active="casos" />

      <section className="caso-hero">
        <div className="caso-hero-inner">
          <div className="caso-breadcrumb">
            <Link to="/home">Soledad</Link> <span>/</span>
            <Link to={`/capitulo/${caso.barrio_slug}`}>{caso.barrio_nombre}</Link> <span>/</span>
            <span>{caso.titulo}</span>
          </div>
          <h1>{caso.titulo}</h1>
          <div className="meta-row">
            <span className={`badge badge-cat-${caso.categoria_codigo}`}>
              <Icon />{caso.categoria_nombre}
            </span>
            <span className={ESTADO_BADGE[caso.estado]}>
              <span className="dot" />{ESTADO_LABEL[caso.estado]}
            </span>
            <span className="badge badge-folio">{folioVisible}</span>
            <span className="caption row row-2">
              <MapPin style={{ width: 14, height: 14, color: 'var(--biss-teal-900)' }} />
              {caso.barrio_nombre}
            </span>
            {caso.publicado_en && (
              <span className="caption row row-2">
                Publicado {formatRelative(caso.publicado_en)}
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="caso-main">
        <div>
          <div className="caso-card">
            <h2>Lo que pasa</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{caso.descripcion}</p>
          </div>

          <div className="caso-card">
            <h2>Multimedia</h2>
            {media.length === 0 ? (
              <p className="caption">Todavía no hay fotos o videos. Cuando los suban, aparecen aquí.</p>
            ) : (
              <div className="gallery">
                {media.map((m, i) => {
                  const big = i === 0;
                  const isVideo =
                    m.tipo === 'video' || /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(m.url);
                  if (isVideo) {
                    return (
                      <div
                        key={m.id}
                        className={`ph${big ? ' big' : ''}`}
                        style={{ background: '#0B0B0B', overflow: 'hidden' }}
                      >
                        <video
                          src={m.url}
                          poster={m.thumb_url ?? undefined}
                          controls
                          playsInline
                          preload="metadata"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                    );
                  }
                  if (m.tipo === 'foto') {
                    return (
                      <div
                        key={m.id}
                        className={`ph${big ? ' big' : ''}`}
                        style={{
                          backgroundImage: `url(${m.thumb_url ?? m.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          color: 'transparent',
                        }}
                      >
                        FOTO {String(i + 1).padStart(2, '0')}
                      </div>
                    );
                  }
                  return (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`ph${big ? ' big' : ''}`}
                    >
                      {m.tipo.toUpperCase()}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="caso-card">
            <h2>Línea de tiempo</h2>
            {actualizaciones.length === 0 ? (
              <p className="caption">Todavía no hay movimientos. Te avisamos cuando algo pase.</p>
            ) : (
              <div className="timeline">
                {actualizaciones.map((a) => (
                  <div key={a.id} className="timeline-item">
                    <div
                      className="timeline-dot"
                      style={{
                        background: TIMELINE_COLOR[a.estado_nuevo ?? caso.estado],
                      }}
                    />
                    <div className="timeline-content">
                      <div className="timeline-date">{fechaCorta(a.ocurrido_en)}</div>
                      <div className="timeline-title">
                        {a.tipo === 'cambio_estado' && a.estado_anterior && a.estado_nuevo
                          ? `${ESTADO_LABEL[a.estado_anterior]} → ${ESTADO_LABEL[a.estado_nuevo]}`
                          : a.tipo === 'nota'
                          ? 'Nota del equipo'
                          : a.tipo === 'hito'
                          ? 'Hito'
                          : a.tipo === 'reunion'
                          ? 'Reunión'
                          : a.tipo === 'correccion'
                          ? 'Corrección'
                          : 'Foto agregada'}
                      </div>
                      <div className="timeline-text">{a.texto}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="caso-card">
            <h2>Voces sobre este caso</h2>
            {testimonios.length === 0 ? (
              <p className="caption">Aquí no hay voces todavía. Si vives esto, cuéntalo.</p>
            ) : (
              testimonios.map((t) => (
                <div key={t.id} className="caso-testimonio">
                  <p>{t.mensaje}</p>
                  <div className="author">
                    <strong>{t.autor_visible}</strong> · {t.relacion} · {formatRelative(t.creado_en)}
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
              onClick={() =>
                openFlow('testimonio', {
                  casoId: caso.id,
                  casoFolio: folioVisible,
                  casoTitulo: caso.titulo,
                })
              }
            >
              <MessageSquareQuote />Sumar tu voz
            </button>
          </div>
        </div>

        <aside>
          <div className="caso-side-card">
            <h3>Datos del caso</h3>
            <div className="data-row"><span className="k">Folio</span><span className="v mono">{folioVisible}</span></div>
            <div className="data-row"><span className="k">Reportado</span><span className="v">{fechaCorta(caso.publicado_en ?? caso.actualizado_en)}</span></div>
            <div className="data-row"><span className="k">Última actualización</span><span className="v">{fechaCorta(caso.actualizado_en)}</span></div>
            <div className="data-row"><span className="k">Barrio</span><span className="v">{caso.barrio_nombre}</span></div>
            {caso.lat != null && caso.lng != null && (
              <div className="data-row"><span className="k">Coordenadas</span><span className="v mono">{caso.lat.toFixed(5)},<br />{caso.lng.toFixed(5)}</span></div>
            )}
          </div>

          <div className="caso-side-card">
            <h3>Padrinos del caso</h3>
            {padrinos.length === 0 ? (
              <p className="caption">Aún nadie ha apadrinado este caso. ¿Quieres ser el primero?</p>
            ) : (
              padrinos.map((p) => (
                <div key={p.id} className="padrino-card">
                  <div className="av">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt={p.nombre} style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <Building2 style={{ width: 18, height: 18 }} />
                    )}
                  </div>
                  <div>
                    <div className="name">{p.nombre}</div>
                    <div className="aporte">
                      {APORTE_LABEL[p.tipo_apoyo]}
                      {p.aporte_descripcion ? ` · ${p.aporte_descripcion}` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 10, width: '100%' }}
              onClick={() =>
                openFlow('apadrinar', {
                  casoId: caso.id,
                  casoFolio: folioVisible,
                  casoTitulo: caso.titulo,
                })
              }
            >
              <HandHeart />Apadrinar este caso
            </button>
          </div>
        </aside>
      </main>

      <div className="action-bar">
        <div className="row row-2">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              const url = `${window.location.origin}/caso/${caso.slug}`;
              const text = `${caso.titulo} · BISS`;
              if (typeof navigator !== 'undefined' && navigator.share) {
                try {
                  await navigator.share({ title: text, text, url });
                  return;
                } catch {
                  /* user cancelled or unsupported */
                }
              }
              try {
                await navigator.clipboard.writeText(url);
                window.alert('Enlace copiado al portapapeles.');
              } catch {
                window.prompt('Copia este enlace:', url);
              }
            }}
          >
            <Share2 />Compartir
          </button>
          <Link to="/home#mapa" className="btn btn-secondary btn-sm">
            <MapPin />Ver en mapa
          </Link>
        </div>
        <div className="row row-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ ['--btn-ink' as never]: 'var(--cat-social)' }}
            onClick={() =>
              openFlow('testimonio', {
                casoId: caso.id,
                casoFolio: folioVisible,
                casoTitulo: caso.titulo,
              })
            }
          >
            <MessageSquareQuote />Sumar voz
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() =>
              openFlow('apadrinar', {
                casoId: caso.id,
                casoFolio: folioVisible,
                casoTitulo: caso.titulo,
              })
            }
          >
            <HandHeart />Apadrinar
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}

