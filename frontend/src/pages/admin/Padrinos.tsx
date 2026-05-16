import { useMemo, useState } from 'react';
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
  Calendar,
  TrendingUp,
  Minus,
  Check,
  X,
  Eye,
  Mail,
  Phone,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { usePadrinos } from '../../hooks/usePadrinos';
import {
  usePublicarPadrino,
  useRechazarPadrino,
} from '../../hooks/mutations/useModerarPadrinos';
import { formatNumber, formatRelative } from '../../lib/format';
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
  const [detalleId, setDetalleId] = useState<string | null>(null);

  const { pendientes, publicados, stats } = useMemo(() => {
    const pend = padrinos.filter((p) => !p.publicado);
    const pub = padrinos.filter((p) => p.publicado);
    return {
      pendientes: pend,
      publicados: pub,
      stats: { total: padrinos.length, activos: pub.length, pendientes: pend.length },
    };
  }, [padrinos]);

  const detalle = detalleId ? padrinos.find((p) => p.id === detalleId) ?? null : null;

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Padrinos</span>
          </>
        }
        title={`Padrinos · ${stats.pendientes} pendiente${stats.pendientes === 1 ? '' : 's'}`}
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
        <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-mini accent-critical">
            <div className="l">Pendientes</div>
            <div className="n">{formatNumber(stats.pendientes)}</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />por moderar</div>
          </div>
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

        {/* Pendientes primero */}
        {pendientes.length > 0 && (
          <div className="admin-card" style={{ padding: '18px 20px' }}>
            <h2 style={{ marginBottom: 14 }}>Pendientes de moderación</h2>
            {pendientes.map((p) => (
              <PadrinoRow
                key={p.id}
                padrino={p}
                onVerDatos={() => setDetalleId(p.id)}
              />
            ))}
          </div>
        )}

        <div className="admin-card" style={{ padding: '18px 20px' }}>
          <h2 style={{ marginBottom: 14 }}>
            {pendientes.length > 0 ? 'Publicados' : 'Padrinos registrados'}
          </h2>
          {isLoading && <p className="caption">Un segundo…</p>}
          {!isLoading && padrinos.length === 0 && (
            <p className="caption">
              Aún no hay padrinos. Cuando llegue una inscripción por el flow Apadrinar, aparece aquí.
            </p>
          )}
          {publicados.map((p) => (
            <PadrinoRow
              key={p.id}
              padrino={p}
              onVerDatos={() => setDetalleId(p.id)}
            />
          ))}
        </div>
      </div>

      {detalle && (
        <PadrinoDetalleModal padrino={detalle} onClose={() => setDetalleId(null)} />
      )}
    </AdminLayout>
  );
}

function PadrinoRow({
  padrino,
  onVerDatos,
}: {
  padrino: Padrino;
  onVerDatos: () => void;
}) {
  const AporteIcon = APORTE_ICON[padrino.tipo_apoyo];
  const initialsAv = padrino.nombre
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const publicar = usePublicarPadrino();
  const rechazar = useRechazarPadrino();
  const busy = publicar.isPending || rechazar.isPending;

  const handleRechazar = () => {
    if (!window.confirm(`Rechazar la inscripción de ${padrino.nombre}? Esto la elimina.`)) return;
    rechazar.mutate(padrino.id);
  };

  return (
    <div className="padrino-card-full">
      <div className="av">{initialsAv}</div>
      <div>
        <div className="name">{padrino.nombre}</div>
        <div className="meta">
          {padrino.contacto_privado_email} · {padrino.contacto_privado_tel ?? 'sin tel'}
        </div>
        <div className="stats">
          <span>
            <AporteIcon style={{ width: 13, height: 13, color: 'var(--biss-teal)' }} />
            {APORTE_LABEL[padrino.tipo_apoyo]}
          </span>
          <span>
            <Calendar style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />
            {formatRelative(padrino.creado_en)}
          </span>
          {padrino.descripcion && (
            <span style={{ color: 'var(--ink)' }}>
              <Building2 style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />
              {padrino.descripcion.length > 80
                ? padrino.descripcion.slice(0, 80) + '…'
                : padrino.descripcion}
            </span>
          )}
        </div>
      </div>
      <div className="row row-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 }}>
        {padrino.publicado ? (
          <span className="badge badge-resolved"><span className="dot" />Publicado</span>
        ) : (
          <span className="badge"><span className="dot" />Pendiente</span>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onVerDatos}
          disabled={busy}
        >
          <Eye style={{ width: 14, height: 14 }} />Ver datos
        </button>
        {!padrino.publicado && (
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
              <X style={{ width: 14, height: 14 }} />
              {rechazar.isPending ? 'Rechazando…' : 'Rechazar'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{
                ['--btn-bg' as never]: 'var(--state-resolved)',
                ['--btn-border' as never]: 'var(--state-resolved)',
                ['--btn-bg-hover' as never]: '#0E8A50',
              }}
              onClick={() => publicar.mutate(padrino.id)}
              disabled={busy}
            >
              <Check style={{ width: 14, height: 14 }} />
              {publicar.isPending ? 'Publicando…' : 'Aprobar y publicar'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PadrinoDetalleModal({
  padrino,
  onClose,
}: {
  padrino: Padrino;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: 480,
          width: '100%',
          padding: '24px 26px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="row row-3" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{padrino.nombre}</h3>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            style={{
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--ink-soft)',
            }}
          >
            <X />
          </button>
        </div>
        <div className="stack stack-3" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <div className="data-row">
            <span className="k">Tipo de apoyo</span>
            <span className="v">{APORTE_LABEL[padrino.tipo_apoyo]}</span>
          </div>
          <div className="data-row">
            <span className="k">Email</span>
            <span className="v">
              <Mail style={{ width: 13, height: 13, verticalAlign: -2 }} /> {padrino.contacto_privado_email}
            </span>
          </div>
          {padrino.contacto_privado_tel && (
            <div className="data-row">
              <span className="k">Teléfono</span>
              <span className="v">
                <Phone style={{ width: 13, height: 13, verticalAlign: -2 }} /> {padrino.contacto_privado_tel}
              </span>
            </div>
          )}
          <div className="data-row">
            <span className="k">Inscrito</span>
            <span className="v">{formatRelative(padrino.creado_en)}</span>
          </div>
          <div className="data-row">
            <span className="k">Estado</span>
            <span className="v">
              {padrino.publicado ? (
                <span className="badge badge-resolved"><span className="dot" />Publicado</span>
              ) : (
                <span className="badge"><span className="dot" />Pendiente</span>
              )}
            </span>
          </div>
          <div>
            <div className="k" style={{ marginBottom: 6 }}>Descripción del aporte</div>
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {padrino.descripcion}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
