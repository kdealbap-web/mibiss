import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Plus,
  Building2,
  Package,
  CircleDollarSign,
  HardHat,
  Megaphone,
  HandHeart,
  Edit,
  Calendar,
  TrendingUp,
  Minus,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { usePadrinos } from '../../hooks/usePadrinos';
import { formatNumber } from '../../lib/format';
import type { Padrino, TipoApoyo } from '../../types/biss';

import '../../styles/page-admin-padrinos.css';

const APORTE_ICON: Record<TipoApoyo, typeof Package> = {
  financiero: CircleDollarSign,
  material: Package,
  voluntario: HardHat,
  politico: Megaphone,
  otro: HandHeart,
};
const APORTE_LABEL: Record<TipoApoyo, string> = {
  financiero: 'Financiero',
  material: 'Materiales',
  voluntario: 'Voluntario',
  politico: 'Político',
  otro: 'Otro',
};

export function PadrinosAdmin() {
  const { data: padrinos = [], isLoading } = usePadrinos();

  const stats = useMemo(() => {
    const activos = padrinos.filter((p) => p.publicado).length;
    return { total: padrinos.length, activos };
  }, [padrinos]);

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Padrinos</span>
          </>
        }
        title={`Padrinos · ${stats.activos} activo${stats.activos === 1 ? '' : 's'}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Download />Exportar
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <Plus />Registrar padrino
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="stat-mini accent-resolved">
            <div className="l">Padrinos activos</div>
            <div className="n">{formatNumber(stats.activos)}</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />publicados</div>
          </div>
          <div className="stat-mini accent-teal">
            <div className="l">Registrados total</div>
            <div className="n">{formatNumber(stats.total)}</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />incluye no publicados</div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '18px 20px' }}>
          <h2 style={{ marginBottom: 14 }}>Padrinos registrados</h2>
          {isLoading && <p className="caption">Un segundo…</p>}
          {!isLoading && padrinos.length === 0 && (
            <p className="caption">
              Aún no hay padrinos. Cuando llegue una solicitud por el flow Apadrinar, aparece aquí.
            </p>
          )}
          {padrinos.map((p) => (
            <PadrinoRow key={p.id} padrino={p} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function PadrinoRow({ padrino }: { padrino: Padrino }) {
  const AporteIcon = APORTE_ICON[padrino.tipo_apoyo];
  const initialsAv = padrino.nombre
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="padrino-card-full">
      <div className="av">{initialsAv}</div>
      <div>
        <div className="name">{padrino.nombre}</div>
        <div className="meta">
          {padrino.contacto_privado_email && <>{padrino.contacto_privado_email} · </>}
          {padrino.contacto_privado_tel ?? '—'}
        </div>
        <div className="stats">
          <span>
            <AporteIcon style={{ width: 13, height: 13, color: 'var(--biss-teal)' }} />
            {APORTE_LABEL[padrino.tipo_apoyo]}
          </span>
          <span>
            <Calendar style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />
            Desde {new Date(padrino.creado_en).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}
          </span>
          {padrino.descripcion && (
            <span style={{ color: 'var(--ink)' }}>
              <Building2 style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />
              {padrino.descripcion.length > 80 ? padrino.descripcion.slice(0, 80) + '…' : padrino.descripcion}
            </span>
          )}
        </div>
      </div>
      <div className="row row-2">
        {padrino.publicado ? (
          <span className="badge badge-resolved"><span className="dot" />Publicado</span>
        ) : (
          <span className="badge"><span className="dot" />Privado</span>
        )}
        <button type="button" className="btn btn-ghost btn-sm" aria-label="Editar">
          <Edit style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}

