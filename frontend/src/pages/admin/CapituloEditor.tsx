import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Save, ArrowLeft, AlertTriangle, ImagePlus, Eye } from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { Toggle } from '../../components/ui';
import { useCapituloAdmin, useUpdateCapitulo } from '../../hooks/useCapitulosAdmin';
import { useR2Upload } from '../../hooks/useR2Upload';

interface GeoJsonLike {
  type?: string;
  coordinates?: unknown;
}

function isValidGeocerca(raw: string): { ok: true; value: GeoJsonLike } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: 'Vacío.' };
  try {
    const parsed = JSON.parse(trimmed) as GeoJsonLike;
    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'Debe ser un objeto JSON.' };
    }
    if (parsed.type !== 'Polygon' && parsed.type !== 'MultiPolygon') {
      return { ok: false, error: 'type debe ser "Polygon" o "MultiPolygon".' };
    }
    if (!Array.isArray(parsed.coordinates)) {
      return { ok: false, error: 'coordinates debe ser un array.' };
    }
    return { ok: true, value: parsed };
  } catch (e) {
    return { ok: false, error: `JSON inválido: ${(e as Error).message}` };
  }
}

export function CapituloEditor() {
  const { id } = useParams<{ id: string }>();
  const { data: capitulo, isLoading } = useCapituloAdmin(id);
  const update = useUpdateCapitulo();
  const { upload: uploadImagen, uploading: uploadingImg, progress: imgProgress } =
    useR2Upload('barrios-portadas');
  const fileRef = useRef<HTMLInputElement>(null);

  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [geocercaRaw, setGeocercaRaw] = useState('');
  const [activo, setActivo] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!capitulo) return;
    setDescripcion(capitulo.descripcion ?? '');
    setImagenUrl(capitulo.imagen_portada_url);
    setGeocercaRaw(capitulo.geocerca ? JSON.stringify(capitulo.geocerca, null, 2) : '');
    setActivo(capitulo.activo);
  }, [capitulo]);

  const geocercaCheck = useMemo(() => {
    if (!geocercaRaw.trim()) return { ok: false as const, error: '' };
    return isValidGeocerca(geocercaRaw);
  }, [geocercaRaw]);

  const canActivate =
    descripcion.trim().length > 0 &&
    Boolean(imagenUrl) &&
    geocercaCheck.ok;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitErr(null);
    try {
      const [result] = await uploadImagen([file]);
      setImagenUrl(result.url);
      setToast('Imagen subida.');
      setTimeout(() => setToast(null), 1800);
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err);
      setSubmitErr(msg);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!capitulo) return;
    if (geocercaRaw.trim() && !geocercaCheck.ok) {
      setSubmitErr(`Geocerca inválida: ${geocercaCheck.error}`);
      return;
    }
    if (activo && !canActivate) {
      setSubmitErr('Para activar, completa descripción, imagen y geocerca.');
      return;
    }
    try {
      await update.mutateAsync({
        id: capitulo.id,
        patch: {
          descripcion: descripcion.trim() || null,
          imagen_portada_url: imagenUrl,
          geocerca: geocercaRaw.trim() ? geocercaCheck.ok ? geocercaCheck.value : null : null,
          activo,
        },
      });
      setToast('Cambios guardados.');
      setTimeout(() => setToast(null), 1800);
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err);
      if (/chk_capitulos_activo_completo/i.test(msg)) {
        setSubmitErr('No se puede activar sin imagen + geocerca. Completa o desactiva.');
      } else if (/row-level|policy/i.test(msg)) {
        setSubmitErr('No tienes permiso para editar capítulos.');
      } else {
        setSubmitErr('No pudimos guardar. Vuelve a intentarlo.');
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <AdminTopbar title="Cargando capítulo…" crumbs={<Link to="/admin/capitulos">Capítulos</Link>} />
        <div className="admin-page"><p className="caption">Un segundo…</p></div>
      </AdminLayout>
    );
  }

  if (!capitulo) {
    return (
      <AdminLayout>
        <AdminTopbar title="Capítulo no encontrado" crumbs={<Link to="/admin/capitulos">Capítulos</Link>} />
        <div className="admin-page">
          <p className="caption">No existe ese capítulo o no tienes permiso para verlo.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <Link to="/admin/capitulos">Capítulos</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>{capitulo.barrio_nombre}</span>
          </>
        }
        title={`Editar capítulo · ${capitulo.barrio_nombre}`}
        actions={
          <>
            <Link to="/admin/capitulos" className="btn btn-ghost btn-sm">
              <ArrowLeft />Volver
            </Link>
            {capitulo.activo && (
              <Link to={`/capitulo/${capitulo.barrio_slug}`} className="btn btn-secondary btn-sm" target="_blank">
                <Eye />Ver público
              </Link>
            )}
          </>
        }
      />

      <div
        className="admin-page"
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }}
      >
        <form className="admin-card" onSubmit={onSave}>
          <h2>Contenido editorial</h2>
          <div className="card-sub" style={{ marginBottom: 16 }}>
            Lo que cambies aquí afecta lo que vecinos del barrio ven en{' '}
            <code className="mono">/capitulo/{capitulo.barrio_slug}</code>.
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            <div className="mini-field">
              <label htmlFor="cap-desc">Descripción</label>
              <textarea
                id="cap-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Cuenta qué pasa en este barrio. Líderes, problemas recurrentes, historia."
                style={{ minHeight: 140 }}
              />
              <span className="hint">
                {descripcion.length} caracteres · usa párrafos para legibilidad.
              </span>
            </div>

            <div className="mini-field">
              <label>Imagen de portada</label>
              {imagenUrl ? (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    backgroundImage: `url(${imagenUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: 'var(--surface-sunken)',
                    borderRadius: 8,
                    border: '1px dashed var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--ink-soft)',
                    fontSize: 13,
                  }}
                >
                  Sin imagen
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingImg}
                >
                  <ImagePlus size={14} />
                  {uploadingImg
                    ? `Subiendo ${imgProgress.done}/${imgProgress.total}…`
                    : imagenUrl ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                {imagenUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setImagenUrl(null)}
                  >
                    Quitar
                  </button>
                )}
              </div>
              <span className="hint">JPG/PNG/WebP · máx 5 MB · recomendado 16:9.</span>
            </div>

            <div className="mini-field">
              <label htmlFor="cap-geo">Geocerca (GeoJSON Polygon)</label>
              <textarea
                id="cap-geo"
                value={geocercaRaw}
                onChange={(e) => setGeocercaRaw(e.target.value)}
                placeholder={'{\n  "type": "Polygon",\n  "coordinates": [[[-74.78, 10.91], ...]]\n}'}
                style={{ minHeight: 140, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                aria-invalid={geocercaRaw.trim() && !geocercaCheck.ok ? true : undefined}
              />
              {geocercaRaw.trim() && !geocercaCheck.ok && (
                <span className="hint" style={{ color: 'var(--state-critical)' }}>
                  {geocercaCheck.error}
                </span>
              )}
              {geocercaCheck.ok && (
                <span className="hint" style={{ color: 'var(--state-resolved)' }}>
                  Polígono válido.
                </span>
              )}
            </div>

            <Toggle
              checked={activo}
              onChange={(v) => {
                if (v && !canActivate) {
                  setSubmitErr('Para activar, completa descripción, imagen y geocerca.');
                  return;
                }
                setSubmitErr(null);
                setActivo(v);
              }}
              label="Capítulo activo"
              description={
                activo
                  ? 'El capítulo es visible en el Home y mapa públicos.'
                  : 'Borrador. Solo visible para editores.'
              }
            />

            {submitErr && (
              <div className="alert alert-critical" style={{ padding: '10px 12px' }} role="alert">
                <AlertTriangle className="alert-icon" style={{ width: 16, height: 16 }} />
                <div className="alert-body">
                  <div className="alert-text" style={{ fontSize: 12 }}>{submitErr}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={update.isPending || uploadingImg}
              >
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
                <Save size={16} />
              </button>
            </div>
          </div>
        </form>

        <aside className="admin-card" style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ marginBottom: 4 }}>Estado del capítulo</h3>
          <div className="card-sub" style={{ marginBottom: 12 }}>
            Para activar, los 3 campos deben estar completos.
          </div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            <Checklist ok={descripcion.trim().length > 0} label="Descripción" />
            <Checklist ok={Boolean(imagenUrl)} label="Imagen de portada" />
            <Checklist ok={geocercaCheck.ok} label="Geocerca válida" />
          </ul>
          <hr style={{ margin: '14px 0', border: 0, borderTop: '1px solid var(--border)' }} />
          <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--ink-soft)' }}>Casos públicos</span>
            <span style={{ fontWeight: 700 }}>{capitulo.casos_total}</span>
          </div>
          {capitulo.activado_en && (
            <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Activado</span>
              <span className="mono" style={{ fontSize: 11 }}>
                {new Date(capitulo.activado_en).toLocaleDateString('es-CO')}
              </span>
            </div>
          )}
        </aside>

        {toast && (
          <div
            role="status"
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              padding: '10px 16px',
              background: 'var(--state-resolved-bg)',
              border: '1px solid var(--state-resolved-border)',
              color: '#065F46',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: 'var(--shadow-card)',
              zIndex: 100,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Checklist({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          background: ok ? 'var(--state-resolved-bg)' : 'var(--surface-sunken)',
          color: ok ? '#065F46' : 'var(--ink-soft)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {ok ? '✓' : '·'}
      </span>
      {label}
    </li>
  );
}
