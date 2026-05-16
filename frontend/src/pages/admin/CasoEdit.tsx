import { Link, useParams } from 'react-router-dom';
import {
  Eye,
  Save,
  Plus,
  Edit,
  Archive,
  Trash2,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { useCaso } from '../../hooks/useCaso';
import { useActualizaciones } from '../../hooks/useActualizaciones';
import { useBarrios } from '../../hooks/useBarrios';
import { useCategorias } from '../../hooks/useCategorias';
import { formatFolio } from '../../lib/format';
import type { EstadoCaso } from '../../types/biss';

import '../../styles/page-admin-caso-edit.css';

const ESTADO_LABEL: Record<EstadoCaso, string> = {
  pendiente: 'Pendiente',
  critico: 'Crítico',
  progreso: 'En gestión',
  resuelto: 'Resuelto',
  archivado: 'Archivado',
};

const ESTADO_COLOR: Record<EstadoCaso, string> = {
  pendiente: 'var(--ink-faint)',
  critico: 'var(--state-critical)',
  progreso: 'var(--state-progress)',
  resuelto: 'var(--state-resolved)',
  archivado: 'var(--ink-soft)',
};

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function CasoEdit() {
  const { folio = '' } = useParams<{ folio: string }>();
  const slug = folio.toLowerCase();
  const { data: caso, isLoading } = useCaso(slug);
  const { data: actualizaciones = [] } = useActualizaciones(caso?.id ?? null);
  const { data: categorias = [] } = useCategorias();
  const { data: barrios = [] } = useBarrios();

  const folioVisible = caso ? formatFolio(caso.slug) : formatFolio(slug);

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Operación</Link> /{' '}
            <Link to="/admin">Casos</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>{folioVisible}</span>
          </>
        }
        title={caso?.titulo ?? 'Editor de caso'}
        actions={
          <>
            <span className="badge badge-folio">{folioVisible}</span>
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
        {isLoading && <p className="caption">Un segundo…</p>}
        {!isLoading && !caso && (
          <div className="admin-card">
            <p className="caption">
              No encontramos un caso con folio <strong>{folioVisible}</strong>. Verifica el slug en la URL.
            </p>
          </div>
        )}

        {caso && (
          <div className="editor-grid">
            <div>
              <div className="admin-card">
                <h2>Información básica</h2>
                <div className="card-sub">Lo que ve el ciudadano cuando abre el caso.</div>
                <div className="stack stack-4">
                  <div className="field">
                    <label className="field-label" htmlFor="caso-titulo">Título</label>
                    <input id="caso-titulo" className="field-input" type="text" defaultValue={caso.titulo} />
                  </div>
                  <div className="row row-3" style={{ gap: 14 }}>
                    <div className="field grow">
                      <label className="field-label" htmlFor="caso-cat">Categoría</label>
                      <select id="caso-cat" className="field-select" defaultValue={caso.categoria_codigo}>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.codigo}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field grow">
                      <label className="field-label" htmlFor="caso-estado">Estado</label>
                      <select id="caso-estado" className="field-select" defaultValue={caso.estado}>
                        <option value="pendiente">Pendiente</option>
                        <option value="critico">Crítico</option>
                        <option value="progreso">En gestión</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="archivado">Archivado</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="caso-desc">Descripción</label>
                    <textarea
                      id="caso-desc"
                      className="field-textarea"
                      style={{ minHeight: 140 }}
                      defaultValue={caso.descripcion}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h2>Multimedia</h2>
                <div className="card-sub">Hasta 6 imágenes + 2 videos. Upload conectado a R2 en Sprint C.</div>
                <div className="media-grid">
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

                {actualizaciones.length === 0 ? (
                  <p className="caption">
                    Aún no hay movimientos. Cuando registres uno, queda inmutable en la bitácora.
                  </p>
                ) : (
                  actualizaciones.map((a) => (
                    <div key={a.id} className="timeline-editor-item">
                      <div
                        className="dot-pick"
                        style={{
                          background: ESTADO_COLOR[a.estado_nuevo ?? caso.estado],
                        }}
                      />
                      <div>
                        <div className="row row-3" style={{ marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--ink-strong)', fontSize: 13.5 }}>
                            {a.tipo === 'cambio_estado' && a.estado_anterior && a.estado_nuevo
                              ? `${ESTADO_LABEL[a.estado_anterior]} → ${ESTADO_LABEL[a.estado_nuevo]}`
                              : a.tipo === 'nota' ? 'Nota del equipo'
                              : a.tipo === 'hito' ? 'Hito'
                              : a.tipo === 'reunion' ? 'Reunión'
                              : a.tipo === 'correccion' ? 'Corrección'
                              : 'Foto agregada'}
                          </span>
                          <span className="caption mono" style={{ fontSize: 11 }}>{fechaCorta(a.ocurrido_en)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                          {a.texto}
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
                  ))
                )}
              </div>
            </div>

            <aside>
              <div className="admin-card">
                <h2>Ubicación</h2>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label className="field-label">Barrio</label>
                  <select className="field-select" defaultValue={caso.barrio_id}>
                    {barrios.map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="row row-3" style={{ gap: 10, marginBottom: 12 }}>
                  <div className="field grow">
                    <label className="field-label" style={{ fontSize: 11 }}>Latitud</label>
                    <input className="field-input mono" defaultValue={caso.lat ?? ''} />
                  </div>
                  <div className="field grow">
                    <label className="field-label" style={{ fontSize: 11 }}>Longitud</label>
                    <input className="field-input mono" defaultValue={caso.lng ?? ''} />
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h2>Visibilidad</h2>
                <label className="row row-3" style={{ justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>Caso publicado</span>
                  <input
                    type="checkbox"
                    defaultChecked={caso.publicado_en !== null}
                    style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }}
                  />
                </label>
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
        )}
      </div>
    </AdminLayout>
  );
}

