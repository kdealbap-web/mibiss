import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, X, Check, MessageSquareQuote, Eye, AlertTriangle } from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { SearchInput, FilterChip } from '../../components/ui';
import {
  useTestimoniosAdmin,
  type EstadoTestimonioFiltro,
  type TestimonioAdmin,
} from '../../hooks/useTestimonios';
import {
  useAprobarTestimonio,
  useRechazarTestimonio,
  useAprobarLote,
} from '../../hooks/mutations/useModerarTestimonio';
import { formatRelative } from '../../lib/format';

const FILTROS: Array<{ value: EstadoTestimonioFiltro; label: string }> = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'rechazado', label: 'Rechazados' },
  { value: 'oculto', label: 'Ocultos' },
  { value: 'todos', label: 'Todos' },
];

export function TestimoniosAdmin() {
  const [filtro, setFiltro] = useState<EstadoTestimonioFiltro>('pendiente');
  const [q, setQ] = useState('');
  const { data: rows = [], isLoading, isError } = useTestimoniosAdmin(filtro);
  const aprobarLote = useAprobarLote();
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const counts = useMemo(() => {
    // Conteo del filtro actual; para los demás chips se queda en '·'.
    return { current: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      `${r.mensaje} ${r.firmar_como ?? ''} ${r.ciudadano_nombre} ${r.relacion}`
        .toLowerCase()
        .includes(t),
    );
  }, [rows, q]);

  const aprobarTodosVisibles = async () => {
    if (filtro !== 'pendiente' || filtered.length === 0) return;
    if (!window.confirm(`¿Aprobar los ${filtered.length} testimonios visibles?`)) return;
    try {
      const { approved } = await aprobarLote.mutateAsync(filtered.map((r) => r.id));
      setToast({ kind: 'ok', text: `Aprobados ${approved} testimonios.` });
    } catch {
      setToast({ kind: 'err', text: 'Error al aprobar el lote.' });
    } finally {
      setTimeout(() => setToast(null), 2400);
    }
  };

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Operación</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Testimonios</span>
          </>
        }
        title={`Moderación de testimonios · ${counts.current} ${filtro === 'todos' ? '' : filtro + (counts.current === 1 ? '' : 's')}`}
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={filtro !== 'pendiente' || filtered.length === 0 || aprobarLote.isPending}
              onClick={aprobarTodosVisibles}
              title="Aprobar todos los pendientes filtrados"
            >
              <CheckCheck />
              {aprobarLote.isPending ? 'Aprobando…' : 'Aprobar visibles'}
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 8 }}>
          {FILTROS.map((f) => (
            <FilterChip
              key={f.value}
              active={filtro === f.value}
              label={f.label}
              count={filtro === f.value ? counts.current : undefined}
              onClick={() => { setFiltro(f.value); setQ(''); }}
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            margin: '12px 0',
          }}
        >
          <SearchInput
            className="grow"
            style={{ maxWidth: 420 }}
            placeholder="Buscar por texto, autor o relación…"
            aria-label="Buscar testimonios"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="admin-card" style={{ padding: '18px 20px' }}>
          {isLoading && (
            <div style={{ display: 'grid', gap: 8 }} aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 96,
                    borderRadius: 12,
                    background: 'var(--surface-sunken)',
                    opacity: 0.7 - i * 0.15,
                  }}
                />
              ))}
            </div>
          )}
          {isError && <p className="caption">No pudimos leer la cola. Vuelve a intentarlo.</p>}
          {!isLoading && !isError && filtered.length === 0 && (
            <p className="caption">
              {q.trim()
                ? 'Sin resultados con ese texto.'
                : filtro === 'pendiente'
                  ? 'Nada pendiente. Cuando llegue un testimonio nuevo, aparece aquí.'
                  : `Sin testimonios ${filtro}.`}
            </p>
          )}
          {filtered.map((t) => (
            <ModCard key={t.id} t={t} />
          ))}
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

function ModCard({ t }: { t: TestimonioAdmin }) {
  const autor = t.firmar_como ?? t.ciudadano_nombre ?? 'Anónimo';
  const aprobar = useAprobarTestimonio();
  const rechazar = useRechazarTestimonio();
  const busy = aprobar.isPending || rechazar.isPending;

  const handleAprobar = () => aprobar.mutate(t.id);
  const handleRechazar = () => {
    const motivo = window.prompt('Motivo del rechazo (interno):');
    if (!motivo || motivo.trim().length < 3) return;
    rechazar.mutate({ id: t.id, motivo: motivo.trim() });
  };

  return (
    <div className="mod-card">
      <div className="mod-card-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <MessageSquareQuote
              size={14}
              style={{ color: 'var(--cat-social)' }}
            />
            <strong style={{ color: 'var(--ink-strong)', fontSize: 14 }}>
              {autor}
            </strong>
            {t.firmar_como && (
              <span className="caption" style={{ fontSize: 11 }}>
                (firmado como)
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
            {t.caso_id ? 'Sobre un caso' : t.capitulo_id ? 'Sobre un capítulo' : 'Sin contexto'}
            {' · '}
            relación: <strong>{t.relacion}</strong>
            {' · '}
            {formatRelative(t.creado_en)}
          </div>
        </div>
        <span
          className={
            t.estado === 'aprobado' ? 'badge badge-resolved' :
            t.estado === 'rechazado' ? 'badge badge-critical' :
            t.estado === 'oculto' ? 'badge' :
            'badge badge-progress'
          }
        >
          <span className="dot" />
          {t.estado}
        </span>
      </div>
      <div className="mod-card-body" style={{ whiteSpace: 'pre-wrap' }}>{t.mensaje}</div>

      {t.motivo_rechazo && (
        <div
          className="alert alert-warning"
          style={{ padding: '8px 10px', marginTop: 8 }}
          role="status"
        >
          <AlertTriangle className="alert-icon" style={{ width: 14, height: 14 }} />
          <div className="alert-body">
            <div className="alert-text" style={{ fontSize: 12 }}>
              Motivo: {t.motivo_rechazo}
            </div>
          </div>
        </div>
      )}

      <div className="mod-card-actions">
        {t.caso_id && (
          <Link
            to={`/admin/caso/${t.caso_id}`}
            className="btn btn-ghost btn-sm"
            aria-label="Ver caso"
          >
            <Eye size={14} />
            Ver caso
          </Link>
        )}
        {t.estado === 'pendiente' && (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                ['--btn-ink' as never]: 'var(--state-critical)',
                ['--btn-border' as never]: 'var(--state-critical)',
                ['--btn-bg-hover' as never]: 'var(--state-critical-bg)',
              }}
              onClick={handleRechazar}
              disabled={busy}
            >
              <X size={14} />Rechazar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{
                ['--btn-bg' as never]: 'var(--state-resolved)',
                ['--btn-border' as never]: 'var(--state-resolved)',
                ['--btn-bg-hover' as never]: '#0E8A50',
              }}
              onClick={handleAprobar}
              disabled={busy}
            >
              <Check size={14} />
              {aprobar.isPending ? 'Aprobando…' : 'Aprobar y publicar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
