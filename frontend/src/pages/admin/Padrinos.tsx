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
import { SearchInput, FilterChip, Modal } from '../../components/ui';
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

type Filtro = 'pendientes' | 'publicados' | 'todos';
type FiltroTipo = 'todos' | TipoApoyo;

export function PadrinosAdmin() {
  const { data: padrinos = [], isLoading } = usePadrinos();
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('pendientes');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [q, setQ] = useState('');

  const stats = useMemo(() => {
    const pend = padrinos.filter((p) => !p.publicado).length;
    const pub = padrinos.filter((p) => p.publicado).length;
    return { total: padrinos.length, activos: pub, pendientes: pend };
  }, [padrinos]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return padrinos.filter((p) => {
      if (filtro === 'pendientes' && p.publicado) return false;
      if (filtro === 'publicados' && !p.publicado) return false;
      if (filtroTipo !== 'todos' && p.tipo_apoyo !== filtroTipo) return false;
      if (t && !`${p.nombre} ${p.contacto_privado_email} ${p.descripcion}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [padrinos, filtro, filtroTipo, q]);

  const detalle = detalleId ? padrinos.find((p) => p.id === detalleId) ?? null : null;

  const exportarCsv = () => {
    if (filtered.length === 0) return;
    const headers = ['id', 'nombre', 'tipo_apoyo', 'email', 'tel', 'publicado', 'creado_en'];
    const rows = filtered.map((p) => [
      p.id,
      p.nombre,
      p.tipo_apoyo,
      p.contacto_privado_email,
      p.contacto_privado_tel ?? '',
      p.publicado ? 'sí' : 'no',
      p.creado_en,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padrinos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={exportarCsv}
              disabled={filtered.length === 0}
            >
              <Download />Exportar
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled title="Disponible en Sprint I">
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

        <div className="row row-3 wrap" style={{ gap: 8 }}>
          <FilterChip
            active={filtro === 'pendientes'}
            label="Pendientes"
            count={stats.pendientes}
            onClick={() => setFiltro('pendientes')}
          />
          <FilterChip
            active={filtro === 'publicados'}
            label="Publicados"
            count={stats.activos}
            onClick={() => setFiltro('publicados')}
          />
          <FilterChip
            active={filtro === 'todos'}
            label="Todos"
            count={stats.total}
            onClick={() => setFiltro('todos')}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            margin: '12px 0',
            flexWrap: 'wrap',
          }}
        >
          <SearchInput
            className="grow"
            style={{ minWidth: 240, maxWidth: 360 }}
            placeholder="Buscar por nombre, email o descripción…"
            aria-label="Buscar padrinos"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="field-select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
            aria-label="Filtrar por tipo de apoyo"
          >
            <option value="todos">Todos los tipos</option>
            {Object.entries(APORTE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="admin-card" style={{ padding: '18px 20px' }}>
          {isLoading && (
            <div style={{ display: 'grid', gap: 8 }} aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 88,
                    borderRadius: 12,
                    background: 'var(--surface-sunken)',
                    opacity: 0.7 - i * 0.15,
                  }}
                />
              ))}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="caption">
              {q.trim() || filtroTipo !== 'todos'
                ? 'Sin resultados con esos filtros.'
                : filtro === 'pendientes'
                  ? 'Nada pendiente. Cuando llegue una inscripción nueva, aparece aquí.'
                  : 'Aún no hay padrinos en este filtro.'}
            </p>
          )}
          {filtered.map((p) => (
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
    <Modal
      open
      onClose={onClose}
      title={padrino.nombre}
      description={`${APORTE_LABEL[padrino.tipo_apoyo]} · inscrito ${formatRelative(padrino.creado_en)}`}
      size="md"
      footer={
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
          Cerrar
        </button>
      }
    >
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
    </Modal>
  );
}
