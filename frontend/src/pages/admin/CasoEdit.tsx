import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Eye,
  Save,
  Plus,
  Edit,
  Archive,
  Trash2,
  Lock,
  RotateCcw,
  X,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { useCaso, useMultimediaCaso } from '../../hooks/useCaso';
import { useActualizaciones } from '../../hooks/useActualizaciones';
import { useBarrios } from '../../hooks/useBarrios';
import { useCategorias } from '../../hooks/useCategorias';
import {
  useCambiarEstadoCaso,
  useEditarCaso,
  useAgregarActualizacion,
} from '../../hooks/mutations/useCasoMutations';
import {
  useNotasInternas,
  useAgregarNota,
  useEliminarNota,
  useReabrirCaso,
} from '../../hooks/useNotasInternas';
import { useSession } from '../../hooks/useMiCuenta';
import { formatRelative } from '../../lib/format';
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
  const { data: media = [] } = useMultimediaCaso(caso?.id ?? null);
  const { data: categorias = [] } = useCategorias();
  const { data: barrios = [] } = useBarrios();
  const session = useSession();

  const editar = useEditarCaso(slug);
  const cambiarEstado = useCambiarEstadoCaso(slug);
  const agregarActualizacion = useAgregarActualizacion(slug);
  const { data: notas = [] } = useNotasInternas(caso?.id ?? null);
  const agregarNotaInterna = useAgregarNota();
  const eliminarNotaInterna = useEliminarNota();
  const reabrirCaso = useReabrirCaso();
  const [notaDraft, setNotaDraft] = useState('');

  const folioVisible = caso ? formatFolio(caso.slug) : formatFolio(slug);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaCodigo, setCategoriaCodigo] = useState('');
  const [estadoNuevo, setEstadoNuevo] = useState<EstadoCaso>('pendiente');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  useEffect(() => {
    if (!caso) return;
    setTitulo(caso.titulo);
    setDescripcion(caso.descripcion);
    setCategoriaCodigo(caso.categoria_codigo);
    setEstadoNuevo(caso.estado);
    setLat(caso.lat?.toString() ?? '');
    setLng(caso.lng?.toString() ?? '');
  }, [caso]);

  const guardar = async () => {
    if (!caso) return;
    setFeedback(null);
    try {
      const catId = categorias.find((c) => c.codigo === categoriaCodigo)?.id;
      const latN = lat.trim() ? Number(lat) : null;
      const lngN = lng.trim() ? Number(lng) : null;
      await editar.mutateAsync({
        casoId: caso.id,
        patch: {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          ...(catId ? { categoria_id: catId } : {}),
          lat: Number.isFinite(latN as number) ? latN : null,
          lng: Number.isFinite(lngN as number) ? lngN : null,
        },
      });

      if (estadoNuevo !== caso.estado) {
        await cambiarEstado.mutateAsync({
          casoId: caso.id,
          nuevo: estadoNuevo,
        });
      }

      setFeedback({ kind: 'ok', msg: 'Cambios guardados.' });
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      setFeedback({
        kind: 'err',
        msg: /row-level security|permission/i.test(msg)
          ? 'No tienes permisos para editar este caso.'
          : 'Algo salió raro al guardar. Vuelve a intentarlo.',
      });
    }
  };

  const agregarNota = async () => {
    if (!caso || !session?.user) return;
    const texto = window.prompt('Texto de la nota (10–500 caracteres):');
    if (!texto || texto.trim().length < 10) return;
    setFeedback(null);
    try {
      await agregarActualizacion.mutateAsync({
        caso_id: caso.id,
        tipo: 'nota',
        texto: texto.trim(),
        autor_cms_id: session.user.id,
      });
      setFeedback({ kind: 'ok', msg: 'Nota agregada.' });
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      setFeedback({
        kind: 'err',
        msg: /row-level security|permission/i.test(msg)
          ? 'No tienes permisos para anotar este caso.'
          : 'No pudimos agregar la nota.',
      });
    }
  };

  const busy = editar.isPending || cambiarEstado.isPending;

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
            <Link to={`/caso/${slug}`} className="btn btn-secondary btn-sm">
              <Eye />Vista previa
            </Link>
            <button type="button" className="btn btn-primary btn-sm" onClick={guardar} disabled={busy || !caso}>
              <Save />{busy ? 'Guardando…' : 'Guardar cambios'}
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

        {feedback && (
          <div
            className={feedback.kind === 'ok' ? 'alert alert-info' : 'alert alert-critical'}
            style={{ padding: '10px 12px' }}
            role="alert"
          >
            <div className="alert-body">
              <div className="alert-text" style={{ fontSize: 12 }}>{feedback.msg}</div>
            </div>
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
                    <input
                      id="caso-titulo"
                      className="field-input"
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                    />
                  </div>
                  <div className="row row-3" style={{ gap: 14 }}>
                    <div className="field grow">
                      <label className="field-label" htmlFor="caso-cat">Categoría</label>
                      <select
                        id="caso-cat"
                        className="field-select"
                        value={categoriaCodigo}
                        onChange={(e) => setCategoriaCodigo(e.target.value)}
                      >
                        {categorias.map((c) => (
                          <option key={c.id} value={c.codigo}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field grow">
                      <label className="field-label" htmlFor="caso-estado">Estado</label>
                      <select
                        id="caso-estado"
                        className="field-select"
                        value={estadoNuevo}
                        onChange={(e) => setEstadoNuevo(e.target.value as EstadoCaso)}
                      >
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
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h2>Multimedia</h2>
                <div className="card-sub">
                  Archivos subidos al reportar el caso. {media.length} de 8 (fotos + videos).
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {media.length === 0 && (
                    <p className="caption" style={{ gridColumn: '1 / -1' }}>
                      Sin fotos ni videos todavía.
                    </p>
                  )}
                  {media.map((m) => {
                    const isVideo =
                      m.tipo === 'video' || /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(m.url);
                    return isVideo ? (
                      <video
                        key={m.id}
                        src={m.url}
                        poster={m.thumb_url ?? undefined}
                        controls
                        playsInline
                        preload="metadata"
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          background: '#0B0B0B',
                        }}
                      />
                    ) : (
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          aspectRatio: '1',
                          backgroundImage: `url(${m.thumb_url ?? m.url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                        }}
                        aria-label="Abrir archivo"
                      />
                    );
                  })}
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-head">
                  <div>
                    <h2>Línea de tiempo</h2>
                    <div className="card-sub">Cada cambio se notifica al ciudadano por email.</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={agregarNota}
                    disabled={agregarActualizacion.isPending || !session?.user}
                  >
                    <Plus />{agregarActualizacion.isPending ? 'Agregando…' : 'Agregar nota'}
                  </button>
                </div>

                {/* Línea de tiempo es contenido público — no confundir con notas internas */}
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

              <div className="admin-card">
                <div className="admin-card-head">
                  <div>
                    <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Lock size={16} style={{ color: 'var(--ink-soft)' }} />
                      Notas internas
                    </h2>
                    <div className="card-sub">
                      Privadas del equipo CMS. Nunca visibles al ciudadano ni en la página pública.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                  <textarea
                    value={notaDraft}
                    onChange={(e) => setNotaDraft(e.target.value)}
                    placeholder="Ej. Hablé con el JAC, dice que ya hay un oficio radicado…"
                    style={{
                      flex: 1,
                      minHeight: 64,
                      padding: '10px 12px',
                      border: '1.5px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: 'var(--font-display)',
                      resize: 'vertical',
                    }}
                    aria-label="Nueva nota interna"
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ alignSelf: 'flex-end' }}
                    disabled={
                      agregarNotaInterna.isPending ||
                      !session?.user ||
                      notaDraft.trim().length < 1
                    }
                    onClick={async () => {
                      if (!caso) return;
                      try {
                        await agregarNotaInterna.mutateAsync({
                          caso_id: caso.id,
                          texto: notaDraft,
                        });
                        setNotaDraft('');
                      } catch {
                        // error queda en mutation state; UX simple por ahora
                      }
                    }}
                  >
                    <Plus size={14} />
                    {agregarNotaInterna.isPending ? 'Agregando…' : 'Agregar'}
                  </button>
                </div>

                {notas.length === 0 ? (
                  <p className="caption" style={{ fontSize: 12 }}>
                    Sin notas todavía. Las que agregues aquí son privadas.
                  </p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
                    {notas.map((n) => (
                      <li
                        key={n.id}
                        style={{
                          padding: '10px 12px',
                          background: 'var(--surface-sunken)',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                            <strong style={{ color: 'var(--ink-strong)' }}>{n.autor_nombre}</strong>{' '}
                            · <span className="mono">{formatRelative(n.creado_en)}</span>
                          </div>
                          {n.autor_cms_id === session?.user?.id && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('¿Eliminar esta nota?')) {
                                  eliminarNotaInterna.mutate({ id: n.id, caso_id: n.caso_id });
                                }
                              }}
                              aria-label="Eliminar nota"
                              style={{
                                background: 'transparent',
                                border: 0,
                                color: 'var(--ink-soft)',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: 'var(--ink-strong)',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                          }}
                        >
                          {n.texto}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <aside>
              <div className="admin-card">
                <h2>Ubicación</h2>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label className="field-label">Barrio</label>
                  <select className="field-select" defaultValue={caso.barrio_id} disabled>
                    {barrios.map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                  <span className="field-helper">
                    Cambiar de barrio requiere mover el capítulo. Por ahora se edita desde DB.
                  </span>
                </div>
                <div className="row row-3" style={{ gap: 10, marginBottom: 12 }}>
                  <div className="field grow">
                    <label className="field-label" style={{ fontSize: 11 }}>Latitud</label>
                    <input className="field-input mono" value={lat} onChange={(e) => setLat(e.target.value)} />
                  </div>
                  <div className="field grow">
                    <label className="field-label" style={{ fontSize: 11 }}>Longitud</label>
                    <input className="field-input mono" value={lng} onChange={(e) => setLng(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h2>Visibilidad</h2>
                <label className="row row-3" style={{ justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>Caso publicado</span>
                  <input
                    type="checkbox"
                    checked={caso.publicado_en !== null}
                    readOnly
                    style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }}
                  />
                </label>
                <p className="caption" style={{ fontSize: 11 }}>
                  La publicación se controla con el estado del caso (los estados visibles son
                  crítico, progreso y resuelto).
                </p>
              </div>

              {caso.estado === 'archivado' ? (
                <div
                  className="admin-card"
                  style={{ background: 'var(--state-info-bg)', borderColor: 'var(--state-info-border)' }}
                >
                  <h2 style={{ color: 'var(--biss-teal-900)' }}>Caso archivado</h2>
                  <p style={{ fontSize: 13, color: 'var(--biss-teal-900)', lineHeight: 1.5, marginBottom: 12 }}>
                    Este caso está archivado. Si necesitas re-evaluarlo, reábrelo y volverá a estado pendiente.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={async () => {
                      if (!caso) return;
                      if (!window.confirm('¿Reabrir el caso? Volverá a estado pendiente.')) return;
                      try {
                        await reabrirCaso.mutateAsync(caso.id);
                      } catch {
                        // mutation state tiene el error
                      }
                    }}
                    disabled={reabrirCaso.isPending}
                  >
                    <RotateCcw size={14} />
                    {reabrirCaso.isPending ? 'Reabriendo…' : 'Reabrir caso'}
                  </button>
                </div>
              ) : (
                <div
                  className="admin-card"
                  style={{ background: 'var(--state-critical-bg)', borderColor: 'var(--state-critical-border)' }}
                >
                  <h2 style={{ color: '#991B1B' }}>Zona peligrosa</h2>
                  <p style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5, marginBottom: 12 }}>
                    Archivar o eliminar el caso es definitivo. Notifica al ciudadano por email.
                  </p>
                  <div className="row row-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{
                        ['--btn-ink' as never]: '#991B1B',
                        ['--btn-bg-hover' as never]: 'rgba(228,4,44,0.08)',
                      }}
                      onClick={() => {
                        if (!caso) return;
                        cambiarEstado.mutate({ casoId: caso.id, nuevo: 'archivado' });
                      }}
                      disabled={cambiarEstado.isPending}
                    >
                      <Archive />Archivar
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" disabled>
                      <Trash2 />Eliminar
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
