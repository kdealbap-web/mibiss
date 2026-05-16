import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Construction,
  MapPin,
  Users,
  Building2,
  Megaphone,
  HandHeart,
  MessageSquareQuote,
  Share2,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useFlowDrawer } from '../context/FlowDrawer';

import '../styles/page-caso.css';

const TIMELINE = [
  {
    fecha: '2 MAY 2026 · 09:10',
    titulo: 'Aprobado para intervención',
    texto:
      'Secretaría de Obras confirmó cuadrilla para la semana del 6 al 10 de mayo. Kevin radicó memorando CON-2026-088.',
    color: 'var(--state-progress)',
  },
  {
    fecha: '15 ABR 2026 · 15:22',
    titulo: 'Radicado por el concejal',
    texto:
      'Kevin radicó oficio formal a la Secretaría de Obras con fotos y firma de 14 vecinos.',
    color: 'var(--biss-teal)',
  },
  {
    fecha: '3 ABR 2026',
    titulo: '3 testimonios nuevos',
    texto: 'Diana, Don Rafael y Marlén sumaron sus voces al caso.',
    color: 'var(--cat-social)',
  },
  {
    fecha: '10 SEP 2025 · 18:50',
    titulo: 'Caso reportado',
    texto: 'Édgar Polo abrió el caso desde la app. Subió 3 fotos del cráter después de la lluvia.',
    color: 'var(--state-critical)',
  },
];

export function Caso() {
  const { folio = '' } = useParams<{ folio: string }>();
  const { openFlow } = useFlowDrawer();

  useEffect(() => {
    document.body.classList.add('caso-body');
    return () => document.body.classList.remove('caso-body');
  }, []);

  const folioVisible = folio.toUpperCase() || 'CS-2026-0142';

  return (
    <>
      <Navbar active="casos" />

      <section className="caso-hero">
        <div className="caso-hero-inner">
          <div className="caso-breadcrumb">
            <Link to="/home">Soledad</Link> <span>/</span>
            <Link to="/capitulo/soledad-2000">Soledad 2000</Link> <span>/</span>
            <span>Cráter en la calle 30</span>
          </div>
          <h1>Cráter en la calle 30</h1>
          <div className="meta-row">
            <span className="badge badge-cat-infraestructura">
              <Construction />Infraestructura
            </span>
            <span className="badge badge-progress">
              <span className="dot" />En gestión
            </span>
            <span className="badge badge-folio">{folioVisible}</span>
            <span className="caption row row-2">
              <MapPin style={{ width: 14, height: 14, color: 'var(--biss-teal-900)' }} />
              Soledad 2000 · calle 30 × carrera 18
            </span>
            <span className="caption row row-2">
              <Users style={{ width: 14, height: 14, color: 'var(--biss-teal-900)' }} />
              14 vecinos sumados
            </span>
          </div>
        </div>
      </section>

      <main className="caso-main">
        <div>
          <div className="caso-card">
            <h2>Lo que pasa</h2>
            <p>
              El cráter de la calle 30 lleva ocho meses sin tapar. La moto de Don Édgar se cayó
              dos veces. Los carros lo esquivan invadiendo el carril contrario, lo que ha causado
              al menos dos choques este año. Cuando llueve, el agua tapa el hueco y deja a vecinos
              cayendo sin verlo.
            </p>
            <p style={{ marginTop: 10 }}>
              El gobierno anterior pintó el lugar con cal blanca pero nunca trajo asfalto. Triple A
              radicó tres oficios. Hoy seguimos esperando cuadrilla.
            </p>
          </div>

          <div className="caso-card">
            <h2>Multimedia</h2>
            <div className="gallery">
              <div className="ph big">FOTO 01 · 12 SEP</div>
              <div className="ph">FOTO 02</div>
              <div className="ph">FOTO 03</div>
              <div className="ph">VIDEO · 18 OCT</div>
              <div className="ph">FOTO 05</div>
            </div>
          </div>

          <div className="caso-card">
            <h2>Línea de tiempo</h2>
            <div className="timeline">
              {TIMELINE.map((t, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" style={{ background: t.color }} />
                  <div className="timeline-content">
                    <div className="timeline-date">{t.fecha}</div>
                    <div className="timeline-title">{t.titulo}</div>
                    <div className="timeline-text">{t.texto}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="caso-card">
            <h2>Voces sobre este caso</h2>
            <div className="caso-testimonio">
              <p>
                Esa mañana iba al colegio con mi hija. Cuando vimos a Don Édgar tirado en la calle,
                ella se asustó tanto que no quiso volver a pasar por ahí. Llevo tres meses
                cargándola para evitarle el susto.
              </p>
              <div className="author">
                <strong>Diana Pérez</strong> · vecina · hace 3 semanas
              </div>
            </div>
            <div
              className="caso-testimonio"
              style={{ borderLeftColor: 'var(--biss-teal)' }}
            >
              <p>
                Como presidente de la JAC ya radicamos doce oficios. Triple A no responde
                formalmente. Esto no es un cráter, es un símbolo de cómo nos tratan.
              </p>
              <div className="author">
                <strong>Don Rafael Caicedo</strong> · líder comunal · hace 2 semanas
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
              onClick={() =>
                openFlow('testimonio', {
                  casoFolio: folioVisible,
                  casoTitulo: 'Cráter en la calle 30',
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
            <div className="data-row"><span className="k">Reportado</span><span className="v">10 sep 2025</span></div>
            <div className="data-row"><span className="k">Última actualización</span><span className="v">2 may 2026</span></div>
            <div className="data-row"><span className="k">Barrio</span><span className="v">Soledad 2000</span></div>
            <div className="data-row"><span className="k">Coordenadas</span><span className="v mono">10.9131,<br />-74.7634</span></div>
            <div className="data-row"><span className="k">Vecinos sumados</span><span className="v">14</span></div>
          </div>

          <div className="caso-side-card">
            <h3>Padrinos del caso</h3>
            <div className="padrino-card">
              <div className="av"><Building2 style={{ width: 18, height: 18 }} /></div>
              <div>
                <div className="name">Ferretería Don Iván</div>
                <div className="aporte">Asfalto en frío · 4 sacos + herramienta menor</div>
              </div>
            </div>
            <div className="padrino-card">
              <div className="av" style={{ background: 'var(--cat-luz)', borderRadius: 12 }}>
                <Megaphone style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <div className="name" style={{ color: '#92400E' }}>Panadería Atlántico</div>
                <div className="aporte" style={{ color: '#B45309' }}>Difusión y refrigerios para cuadrilla</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 10, width: '100%' }}
              onClick={() =>
                openFlow('apadrinar', {
                  casoFolio: folioVisible,
                  casoTitulo: 'Cráter en la calle 30',
                })
              }
            >
              <HandHeart />Apadrinar este caso
            </button>
          </div>

          <div className="caso-side-card">
            <h3>Reportado por</h3>
            <div className="row row-3">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 99,
                  background: 'var(--biss-teal)',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
              >
                EP
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ink-strong)' }}>Édgar Polo</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Vecino · Soledad 2000</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div className="action-bar">
        <div className="row row-2">
          <button type="button" className="btn btn-secondary btn-sm">
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
                casoFolio: folioVisible,
                casoTitulo: 'Cráter en la calle 30',
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
                casoFolio: folioVisible,
                casoTitulo: 'Cráter en la calle 30',
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
