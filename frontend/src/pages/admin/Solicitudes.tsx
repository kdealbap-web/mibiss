import { Link } from 'react-router-dom';
import {
  Filter,
  CheckCheck,
  Check,
  Edit,
  X,
  Construction,
  Droplets,
  Lightbulb,
  Heart,
  Users,
  TreePine,
  GraduationCap,
  MoreHorizontal,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { useSolicitudes } from '../../hooks/useSolicitudes';
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
            <button type="button" className="btn btn-secondary btn-sm">
              <Filter />Filtros
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={rows.length === 0}>
              <CheckCheck />Aprobar visibles
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 8 }}>
          <button type="button" className="chip chip-active">
            Todas <span className="chip-count">{rows.length}</span>
          </button>
        </div>

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
                  <th style={{ width: 36 }}>
                    <input type="checkbox" style={{ accentColor: 'var(--biss-teal)' }} />
                  </th>
                  <th>Caso reportado</th>
                  <th>Reportado por</th>
                  <th>Barrio</th>
                  <th>Recibido</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <SolicitudRow key={r.id} sol={r} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function SolicitudRow({ sol }: { sol: SolicitudPendiente }) {
  const Icon = CAT_ICON[sol.categoria_codigo] ?? MoreHorizontal;
  return (
    <tr>
      <td>
        <input type="checkbox" style={{ accentColor: 'var(--biss-teal)' }} />
      </td>
      <td>
        <div className="row-title">
          <div className="ic-mini" style={{ background: `var(--cat-${sol.categoria_codigo})` }}>
            <Icon />
          </div>
          <div>
            <div>{sol.titulo}</div>
            <div className="row-meta">{sol.categoria}</div>
          </div>
        </div>
      </td>
      <td>
        <strong>{sol.ciudadano}</strong>
        <br />
        <span className="row-meta">{sol.telefono_celular}</span>
      </td>
      <td>{sol.barrio}</td>
      <td>
        <span className="mono" style={{ fontSize: 12 }}>{formatRelative(sol.creado_en)}</span>
      </td>
      <td className="action-cell">
        <button type="button" className="approve" aria-label="Aprobar">
          <Check style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" aria-label="Editar">
          <Edit style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" className="danger" aria-label="Rechazar">
          <X style={{ width: 14, height: 14 }} />
        </button>
      </td>
    </tr>
  );
}
