import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Filter,
  Check,
  Edit,
  X,
  Copy,
  Construction,
  Droplets,
  Lightbulb,
  Heart,
  Users,
  TreePine,
  GraduationCap,
  MoreHorizontal,
  Camera,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { useSolicitudes } from '../../hooks/useSolicitudes';
import {
  useAprobarSolicitud,
  useRechazarSolicitud,
  useDuplicarSolicitud,
} from '../../hooks/mutations/useModerarSolicitud';
import { formatRelative } from '../../lib/format';
import type { SolicitudPendiente } from '../../types/biss';

const CAT_ICON: Record<string, typeof Construction> = {
  agua: Droplets,
  luz: Lightbulb,
  infraestructura: Construction,
  salud: Heart,
  educacion: GraduationCap,
  'medio-ambiente': TreePine,
  social: Users,
  otros: MoreHorizontal,
};

export function Solicitudes() {
  const { data: rows = [], isLoading, isError } = useSolicitudes();
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Operación</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Solicitudes</span>
          </>
        }
        title={`Solicitudes en cola · ${rows.length} pendiente${rows.length === 1 ? '' : 's'}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" aria-disabled disabled>
              <Filter />Filtros
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading && (
            <p className="caption" style={{ padding: '24px 20px' }}>Un segundo…</p>
          )}
          {isError && (
            <p className="caption" style={{ padding: '24px 20px' }}>
              No pudimos leer la cola. Vuelve a intentarlo.
            </p>
          )}
          {!isLoading && !isError && rows.length === 0 && (
            <p className="caption" style={{ padding: '24px 20px' }}>
              Nada pendiente. Cuando llegue una solicitud nueva, aparece aquí.
            </p>
          )}
          {rows.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Caso reportado</th>
                  <th>Reportado por</th>
                  <th>Barrio</th>
                  <th>Fotos</th>
                  <th>Recibido</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <SolicitudRow key={r.id} sol={r} onResult={showToast} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {toast && (
          <div
            role="status"
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              padding: '10px 16px',
              background: toast.kind === 'ok' ? 'var(--state-resolved-bg)' : 'var(--state-critical-bg)',
              border: `1px solid ${toast.kind === 'ok' ? 'var(--state-resolved-border)' : 'var(--state-critical-border)'}`,
              color: toast.kind === 'ok' ? '#065F46' : 'var(--state-critical)',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: 'var(--shadow-card)',
              zIndex: 100,
            }}
          >
            {toast.text}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function SolicitudRow({
  sol,
  onResult,
}: {
  sol: SolicitudPendiente;
  onResult: (kind: 'ok' | 'err', text: string) => void;
}) {
  const navigate = useNavigate();
  const Icon = CAT_ICON[sol.categoria_codigo] ?? MoreHorizontal;
  const aprobar = useAprobarSolicitud();
  const rechazar = useRechazarSolicitud();
  const duplicar = useDuplicarSolicitud();
  const [expanded, setExpanded] = useState(false);

  const handleAprobar = async () => {
    try {
      const casoId = await aprobar.mutateAsync(sol.id);
      onResult('ok', 'Aprobada. Caso creado.');
      navigate(`/admin/caso/${casoId}`);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      onResult('err', /no autorizado/i.test(msg) ? 'No tienes permiso para aprobar.' : 'Error al aprobar.');
    }
  };

  const handleRechazar = async () => {
    const motivo = window.prompt('Motivo del rechazo:');
    if (!motivo || motivo.trim().length < 3) return;
    try {
      await rechazar.mutateAsync({ id: sol.id, motivo: motivo.trim() });
      onResult('ok', 'Rechazada.');
    } catch {
      onResult('err', 'Error al rechazar.');
    }
  };

  const handleDuplicar = async () => {
    const motivo = window.prompt('Nota para el ciudadano (folio o caso duplicado):');
    if (!motivo || motivo.trim().length < 3) return;
    try {
      await duplicar.mutateAsync({ id: sol.id, motivo: motivo.trim() });
      onResult('ok', 'Marcada como duplicada.');
    } catch {
      onResult('err', 'Error al marcar.');
    }
  };

  const busy = aprobar.isPending || rechazar.isPending || duplicar.isPending;
  const fotos = sol.fotos_urls ?? [];

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded((v) => !v)}>
        <td>
          <div className="row-title">
            <div className="ic-mini" style={{ background: `var(--cat-${sol.categoria_codigo})` }}>
              <Icon />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{sol.titulo}</div>
              <div className="row-meta">{sol.categoria}</div>
            </div>
          </div>
        </td>
        <td>
          <strong>{sol.ciudadano}</strong>
          <br />
          <span className="row-meta">
            {sol.ciudadano_email ?? sol.telefono_celular ?? '—'}
          </span>
        </td>
        <td>{sol.barrio}</td>
        <td>
          {fotos.length === 0 ? (
            <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>—</span>
          ) : (
            <span
              className="badge"
              style={{
                background: 'var(--biss-teal-50)',
                color: 'var(--biss-teal-900)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Camera size={12} />
              {fotos.length}
            </span>
          )}
        </td>
        <td>
          <span className="mono" style={{ fontSize: 12 }}>{formatRelative(sol.creado_en)}</span>
        </td>
        <td className="action-cell" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="approve" aria-label="Aprobar y crear caso" onClick={handleAprobar} disabled={busy}>
            <Check style={{ width: 14, height: 14 }} />
          </button>
          <button type="button" aria-label="Marcar como duplicada" onClick={handleDuplicar} disabled={busy}>
            <Copy style={{ width: 14, height: 14 }} />
          </button>
          <button type="button" aria-label="Editar antes de aprobar" disabled title="Editor inline pendiente · Sprint F">
            <Edit style={{ width: 14, height: 14 }} />
          </button>
          <button type="button" className="danger" aria-label="Rechazar" onClick={handleRechazar} disabled={busy}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={6} style={{ background: 'var(--surface-sunken)', padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Descripción</strong>
                <p style={{ marginTop: 4, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {sol.descripcion}
                </p>
              </div>
              {(sol.lat != null && sol.lng != null) && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  📍 {sol.lat}, {sol.lng}
                </div>
              )}
              {fotos.length > 0 && (
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    Multimedia ({fotos.length})
                  </strong>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    {fotos.map((url) => {
                      const isVideo = /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);
                      return isVideo ? (
                        <video
                          key={url}
                          src={url}
                          controls
                          playsInline
                          preload="metadata"
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: '#0B0B0B',
                          }}
                          aria-label="Reproducir video"
                        />
                      ) : (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'block',
                            aspectRatio: '1',
                            backgroundImage: `url(${url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                          }}
                          aria-label="Abrir archivo en tamaño completo"
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
