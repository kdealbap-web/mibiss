import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Edit,
  Eye,
  Download,
  Plus,
  AlertCircle,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { SearchInput, Select } from '../../components/ui';
import { useCasosAdmin, type CasoAdmin } from '../../hooks/useCasosAdmin';
import { useZonas } from '../../hooks/useZonas';
import { useCategorias } from '../../hooks/useCategorias';
import type { EstadoCaso } from '../../types/biss';

const PAGE_SIZE = 20;

const ESTADO_OPTIONS: Array<{ value: EstadoCaso | ''; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'critico', label: 'Crítico' },
  { value: 'progreso', label: 'En gestión' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'archivado', label: 'Archivado' },
];

const ESTADO_LABEL: Record<EstadoCaso, string> = {
  pendiente: 'Pendiente',
  critico: 'Crítico',
  progreso: 'En gestión',
  resuelto: 'Resuelto',
  archivado: 'Archivado',
};

const ESTADO_CLASS: Record<EstadoCaso, string> = {
  pendiente: 'badge',
  critico: 'badge badge-critical',
  progreso: 'badge badge-progress',
  resuelto: 'badge badge-resolved',
  archivado: 'badge',
};

function edadColor(dias: number, estado: EstadoCaso): string {
  if (estado === 'resuelto' || estado === 'archivado') return 'var(--ink-soft)';
  if (dias <= 7) return 'var(--state-resolved)';
  if (dias <= 30) return 'var(--state-progress-ink)';
  if (dias <= 90) return 'var(--state-critical)';
  return 'var(--state-critical)';
}

export function CasosLista() {
  const navigate = useNavigate();
  const { data: casos = [], isLoading } = useCasosAdmin();
  const { data: zonas = [] } = useZonas();
  const { data: categorias = [] } = useCategorias();

  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EstadoCaso | ''>('');
  const [categoria, setCategoria] = useState('');
  const [zona, setZona] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return casos.filter((c) => {
      if (t && !`${c.titulo} ${c.slug} ${c.barrio_nombre}`.toLowerCase().includes(t)) return false;
      if (estado && c.estado !== estado) return false;
      if (categoria && c.categoria_codigo !== categoria) return false;
      if (zona && c.zona_codigo !== zona) return false;
      return true;
    });
  }, [casos, q, estado, categoria, zona]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => {
    return {
      total: casos.length,
      pendiente: casos.filter((c) => c.estado === 'pendiente').length,
      critico: casos.filter((c) => c.estado === 'critico').length,
      progreso: casos.filter((c) => c.estado === 'progreso').length,
      resuelto: casos.filter((c) => c.estado === 'resuelto').length,
      archivado: casos.filter((c) => c.estado === 'archivado').length,
    };
  }, [casos]);

  const exportarCsv = () => {
    if (filtered.length === 0) return;
    const headers = ['id', 'titulo', 'slug', 'estado', 'categoria', 'barrio', 'zona', 'edad_dias', 'creado_en'];
    const rows = filtered.map((c) => [
      c.id,
      c.titulo,
      c.slug,
      c.estado,
      c.categoria_codigo,
      c.barrio_nombre,
      c.zona_codigo,
      c.edad_dias,
      c.creado_en,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `casos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const limpiar = () => {
    setQ('');
    setEstado('');
    setCategoria('');
    setZona('');
    setPage(0);
  };

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Casos</span>
          </>
        }
        title={`Casos · ${casos.length}`}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv}>
              <Download />Exportar
            </button>
            <Link to="/admin/solicitudes" className="btn btn-primary btn-sm">
              <Plus />Nuevo (desde solicitud)
            </Link>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 12 }}>
          <Stat label="Total" value={stats.total} />
          <Stat label="Pendientes" value={stats.pendiente} highlight={stats.pendiente > 0 ? 'progress' : undefined} />
          <Stat label="Críticos" value={stats.critico} highlight={stats.critico > 0 ? 'critical' : undefined} />
          <Stat label="En gestión" value={stats.progreso} highlight="progress" />
          <Stat label="Resueltos" value={stats.resuelto} highlight="resolved" />
          <Stat label="Archivados" value={stats.archivado} />
        </div>

        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <SearchInput
              className="grow"
              style={{ minWidth: 200, maxWidth: 320 }}
              placeholder="Buscar por título, slug o barrio…"
              aria-label="Buscar caso"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
            />
            <Select
              value={estado}
              onChange={(e) => { setEstado(e.target.value as EstadoCaso | ''); setPage(0); }}
              aria-label="Filtrar por estado"
              options={ESTADO_OPTIONS}
            />
            <Select
              value={categoria}
              onChange={(e) => { setCategoria(e.target.value); setPage(0); }}
              aria-label="Filtrar por categoría"
              options={[
                { value: '', label: 'Todas las categorías' },
                ...categorias.map((c) => ({ value: c.codigo, label: c.nombre })),
              ]}
            />
            <Select
              value={zona}
              onChange={(e) => { setZona(e.target.value); setPage(0); }}
              aria-label="Filtrar por zona"
              options={[
                { value: '', label: 'Todas las zonas' },
                ...zonas.map((z) => ({ value: z.codigo, label: z.nombre })),
              ]}
            />
            {(q || estado || categoria || zona) && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={limpiar}>
                Limpiar
              </button>
            )}
          </div>

          {isLoading && <p className="caption" style={{ padding: 20 }}>Cargando casos…</p>}
          {!isLoading && slice.length === 0 && (
            <p className="caption" style={{ padding: 20 }}>Sin resultados.</p>
          )}
          {slice.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Caso</th>
                  <th>Barrio</th>
                  <th>Estado</th>
                  <th>Edad</th>
                  <th>Creado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((c) => (
                  <Row key={c.id} c={c} onOpen={() => navigate(`/admin/caso/${c.slug || c.id}`)} />
                ))}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid var(--border)',
                fontSize: 12,
                color: 'var(--ink-soft)',
              }}
            >
              <span>Página {page + 1} de {totalPages} · {filtered.length} casos</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Row({ c, onOpen }: { c: CasoAdmin; onOpen: () => void }) {
  const isCritico = c.estado === 'critico' && c.edad_dias > 14;
  return (
    <tr onClick={onOpen} style={{ cursor: 'pointer' }}>
      <td>
        <div className="row-title">
          <div
            className="ic-mini"
            style={{ background: c.categoria_color }}
            aria-hidden
          />
          <div>
            <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {isCritico && (
                <AlertCircle
                  size={14}
                  style={{ color: 'var(--state-critical)' }}
                  aria-label="Crítico sin atender hace más de 2 semanas"
                />
              )}
              {c.titulo}
            </div>
            <div className="row-meta mono" style={{ fontSize: 11 }}>
              {c.slug ? c.slug.toUpperCase() : c.id.slice(0, 8)} · {c.categoria_nombre}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span
          className="badge"
          style={{
            background: `${c.zona_color}22`,
            color: c.zona_color,
            borderColor: `${c.zona_color}55`,
          }}
        >
          {c.barrio_nombre}
        </span>
      </td>
      <td>
        <span className={ESTADO_CLASS[c.estado]}>{ESTADO_LABEL[c.estado]}</span>
      </td>
      <td>
        <span
          className="mono"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: edadColor(c.edad_dias, c.estado),
          }}
        >
          {c.edad_dias === 0 ? 'hoy' : `${c.edad_dias}d`}
        </span>
      </td>
      <td>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          {new Date(c.creado_en).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
        </span>
      </td>
      <td className="action-cell" onClick={(e) => e.stopPropagation()}>
        {c.slug && (
          <Link to={`/caso/${c.slug}`} target="_blank" aria-label="Ver caso público">
            <Eye style={{ width: 14, height: 14 }} />
          </Link>
        )}
        <Link to={`/admin/caso/${c.slug || c.id}`} aria-label="Editar caso">
          <Edit style={{ width: 14, height: 14 }} />
        </Link>
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: 'resolved' | 'critical' | 'progress';
}) {
  const color =
    highlight === 'resolved' ? 'var(--state-resolved)' :
    highlight === 'critical' ? 'var(--state-critical)' :
    highlight === 'progress' ? 'var(--state-progress-ink)' :
    'var(--ink-strong)';
  return (
    <div className="admin-card" style={{ padding: '12px 16px', flex: '1 1 130px', minWidth: 130 }}>
      <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 24,
          color,
          marginTop: 2,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
    </div>
  );
}
