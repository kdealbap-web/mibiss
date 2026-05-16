import { Link } from 'react-router-dom';
import { Filter, CheckCheck, Edit, X, Check } from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { useTestimoniosPendientes } from '../../hooks/useTestimonios';
import { formatRelative } from '../../lib/format';
import type { TestimonioPendiente } from '../../types/biss';

export function TestimoniosAdmin() {
  const { data: rows = [], isLoading, isError } = useTestimoniosPendientes();

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Operación</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Testimonios</span>
          </>
        }
        title={`Moderación de testimonios · ${rows.length} pendiente${rows.length === 1 ? '' : 's'}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Filter />Filtros
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={rows.length === 0}>
              <CheckCheck />Aprobar todos
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 8 }}>
          <button type="button" className="chip chip-active">
            Todos <span className="chip-count">{rows.length}</span>
          </button>
        </div>

        <div className="admin-card" style={{ padding: '18px 20px' }}>
          {isLoading && <p className="caption">Un segundo…</p>}
          {isError && <p className="caption">No pudimos leer la cola. Vuelve a intentarlo.</p>}
          {!isLoading && !isError && rows.length === 0 && (
            <p className="caption">
              Nada pendiente. Cuando llegue un testimonio nuevo, aparece aquí.
            </p>
          )}
          {rows.map((t) => (
            <ModCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function ModCard({ t }: { t: TestimonioPendiente }) {
  const autor = t.firmar_como ?? (t.ciudadano_nombre ?? 'Anónimo');
  return (
    <div className="mod-card">
      <div className="mod-card-head">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--ink-strong)', fontSize: 14.5 }}>
            {autor}
            {t.firmar_como === null && t.ciudadano_telefono && (
              <>
                {' '}
                <span style={{ color: 'var(--ink-faint)', fontWeight: 500, fontSize: 12 }}>
                  · cel. {t.ciudadano_telefono}
                </span>
              </>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
            {t.caso_id ? 'Sobre un caso · ' : t.capitulo_id ? 'Sobre un capítulo · ' : ''}
            relación: <strong>{t.relacion}</strong> · {formatRelative(t.creado_en)}
          </div>
        </div>
      </div>
      <div className="mod-card-body">{t.mensaje}</div>
      <div className="mod-card-actions">
        <button type="button" className="btn btn-ghost btn-sm">
          <Edit />Editar
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{
            ['--btn-ink' as never]: 'var(--state-critical)',
            ['--btn-border' as never]: 'var(--state-critical)',
            ['--btn-bg-hover' as never]: 'var(--state-critical-bg)',
          }}
        >
          <X />Rechazar
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{
            ['--btn-bg' as never]: 'var(--state-resolved)',
            ['--btn-border' as never]: 'var(--state-resolved)',
            ['--btn-bg-hover' as never]: '#0E8A50',
          }}
        >
          <Check />Aprobar y publicar
        </button>
      </div>
    </div>
  );
}
