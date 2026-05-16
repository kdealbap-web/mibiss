import { Link, useParams } from 'react-router-dom';
import {
  Eye,
  Save,
  Plus,
  Edit,
  X,
  Archive,
  Trash2,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';

import '../../styles/page-admin-caso-edit.css';

interface TimelineItem {
  titulo: string;
  fecha: string;
  texto: string;
  color: string;
}

const TIMELINE: TimelineItem[] = [
  {
    titulo: 'Aprobado para intervención',
    fecha: '2 may 2026 · 09:10',
    texto:
      'Secretaría de Obras confirmó cuadrilla para la semana del 6 al 10 de mayo. Kevin radicó memorando CON-2026-088.',
    color: 'var(--state-progress)',
  },
  {
    titulo: 'Radicado por el concejal',
    fecha: '15 abr 2026 · 15:22',
    texto:
      'Kevin radicó oficio formal a la Secretaría de Obras con fotos y firma de 14 vecinos.',
    color: 'var(--biss-teal)',
  },
  {
    titulo: 'Caso reportado por Édgar Polo',
    fecha: '10 sep 2025 · 18:50',
    texto: 'Caso abierto desde la app. 3 fotos del cráter después de la lluvia.',
    color: 'var(--state-critical)',
  },
];

export function CasoEdit() {
  const { folio = 'CS-2026-0142' } = useParams<{ folio: string }>();
  const folioUp = folio.toUpperCase();

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Operación</Link> /{' '}
            <Link to="/admin">Casos</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>{folioUp}</span>
          </>
        }
        title="Cráter en la calle 30"
        actions={
          <>
            <span className="badge badge-folio">{folioUp}</span>
            <button type="button" className="btn btn-secondary btn-sm">
              <Eye />Vista previa
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <Save />Guardar cambios
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="editor-grid">
          <div>
            <div className="admin-card">
              <h2>Información básica</h2>
              <div className="card-sub">Lo que ve el ciudadano cuando abre el caso.</div>
              <div className="stack stack-4">
                <div className="field">
                  <label className="field-label" htmlFor="caso-titulo">Título</label>
                  <input
                    id="caso-titulo"
                    className="field-input"
                    type="text"
                    defaultValue="Cráter en la calle 30"
                  />
                </div>
                <div className="row row-3" style={{ gap: 14 }}>
                  <div className="field grow">
                    <label className="field-label" htmlFor="caso-cat">Categoría</label>
                    <select id="caso-cat" className="field-select" defaultValue="Infraestructura">
                      <option>Infraestructura</option>
                      <option>Agua</option>
                      <option>Luz</option>
                      <option>Salud</option>
                      <option>Educación</option>
                      <option>Medio ambiente</option>
                      <option>Social</option>
                      <option>Otros</option>
                    </select>
                  </div>
                  <div className="field grow">
                    <label className="field-label" htmlFor="caso-estado">Estado</label>
                    <select id="caso-estado" className="field-select" defaultValue="En gestión">
                      <option>Pendiente</option>
                      <option>Crítico</option>
                      <option>En gestión</option>
                      <option>Resuelto</option>
                      <option>Archivado</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="caso-desc">Descripción</label>
                  <textarea
                    id="caso-desc"
                    className="field-textarea"
                    style={{ minHeight: 140 }}
                    defaultValue="El cráter de la calle 30 lleva ocho meses sin tapar. La moto de Don Édgar se cayó dos veces. Los carros lo esquivan invadiendo el carril contrario, lo que ha causado al menos dos choques este año. Cuando llueve, el agua tapa el hueco."
                  />
                </div>
              </div>
            </div>

            <div className="admin-card">
              <h2>Multimedia</h2>
              <div className="card-sub">Hasta 6 imágenes + 2 videos. Reordena con drag.</div>
              <div className="media-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="media-tile">
                    <span className="label">FOTO 0{i}</span>
                    <button type="button" aria-label="Quitar">
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
                <div className="media-tile">
                  <span className="label">VIDEO 01</span>
                  <button type="button" aria-label="Quitar">
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </div>
                <button type="button" className="media-add">
                  <Plus />Subir
                </button>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Línea de tiempo</h2>
                  <div className="card-sub">Cada cambio se notifica al ciudadano por SMS.</div>
                </div>
                <button type="button" className="btn btn-primary btn-sm">
                  <Plus />Agregar evento
                </button>
              </div>

              {TIMELINE.map((t, i) => (
                <div key={i} className="timeline-editor-item">
                  <div className="dot-pick" style={{ background: t.color }} />
                  <div>
                    <div className="row row-3" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--ink-strong)', fontSize: 13.5 }}>
                        {t.titulo}
                      </span>
                      <span className="caption mono" style={{ fontSize: 11 }}>{t.fecha}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                      {t.texto}
                    </p>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: 'var(--surface-sunken)',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-soft)',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="admin-card">
              <h2>Ubicación</h2>
              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field-label">Barrio</label>
                <select className="field-select" defaultValue="Soledad 2000">
                  <option>Soledad 2000</option>
                  <option>Don Bosco</option>
                  <option>La Candelaria</option>
                </select>
              </div>
              <div className="row row-3" style={{ gap: 10, marginBottom: 12 }}>
                <div className="field grow">
                  <label className="field-label" style={{ fontSize: 11 }}>Latitud</label>
                  <input className="field-input mono" defaultValue="10.91315" />
                </div>
                <div className="field grow">
                  <label className="field-label" style={{ fontSize: 11 }}>Longitud</label>
                  <input className="field-input mono" defaultValue="-74.76341" />
                </div>
              </div>
              <div
                style={{
                  aspectRatio: '4 / 3',
                  borderRadius: 'var(--radius)',
                  background: 'linear-gradient(180deg, #EEF3F0, #E3EBE6)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'linear-gradient(0deg, rgba(6,119,124,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,119,124,0.06) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '48%',
                    left: '50%',
                    transform: 'translate(-50%,-100%) rotate(-45deg)',
                    width: 28,
                    height: 28,
                    borderRadius: '50% 50% 50% 0',
                    background: 'var(--cat-infraestructura)',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  }}
                />
              </div>
            </div>

            <div className="admin-card">
              <h2>Visibilidad</h2>
              {[
                { label: 'Publicar en mapa público', checked: true },
                { label: 'Permitir testimonios', checked: true },
                { label: 'Aceptar padrinos', checked: true },
                { label: 'Destacar en home', checked: false },
              ].map((opt, i) => (
                <label
                  key={opt.label}
                  className="row row-3"
                  style={{
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderTop: i === 0 ? 0 : '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{opt.label}</span>
                  <input
                    type="checkbox"
                    defaultChecked={opt.checked}
                    style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }}
                  />
                </label>
              ))}
            </div>

            <div className="admin-card">
              <h2>Padrinos vinculados (2)</h2>
              <div className="row row-3" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--state-resolved)',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  FD
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Ferretería Don Iván</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Asfalto · 4 sacos</div>
                </div>
                <button type="button" style={{ background: 'transparent', border: 0, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <div className="row row-3" style={{ padding: '8px 0' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--cat-luz)',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  PA
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Panadería Atlántico</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Difusión + refrigerios</div>
                </div>
                <button type="button" style={{ background: 'transparent', border: 0, color: 'var(--ink-soft)', cursor: 'pointer' }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 10, width: '100%' }}>
                <Plus />Vincular padrino
              </button>
            </div>

            <div
              className="admin-card"
              style={{ background: 'var(--state-critical-bg)', borderColor: 'var(--state-critical-border)' }}
            >
              <h2 style={{ color: '#991B1B' }}>Zona peligrosa</h2>
              <p style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5, marginBottom: 12 }}>
                Archivar o eliminar el caso es definitivo. Notifica al ciudadano por SMS.
              </p>
              <div className="row row-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    ['--btn-ink' as never]: '#991B1B',
                    ['--btn-bg-hover' as never]: 'rgba(228,4,44,0.08)',
                  }}
                >
                  <Archive />Archivar
                </button>
                <button type="button" className="btn btn-danger btn-sm">
                  <Trash2 />Eliminar
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
