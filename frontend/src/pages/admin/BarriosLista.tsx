import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Plus, Edit, Upload } from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { SearchInput, Select } from '../../components/ui';
import { useBarrios } from '../../hooks/useBarrios';
import { useZonas } from '../../hooks/useZonas';
import { useCasosPublicos } from '../../hooks/useCasos';
import type { Barrio } from '../../types/biss';

const PAGE_SIZE = 12;

type EstadoFiltro = 'todos' | 'con-coords' | 'sin-coords' | 'con-casos';

export function BarriosLista() {
  const navigate = useNavigate();
  const { data: barrios = [], isLoading } = useBarrios();
  const { data: zonas = [] } = useZonas();
  const { data: casos = [] } = useCasosPublicos();

  const [q, setQ] = useState('');
  const [zonaFiltro, setZonaFiltro] = useState<string>('');
  const [estado, setEstado] = useState<EstadoFiltro>('todos');
  const [page, setPage] = useState(0);

  const casosPorBarrio = useMemo(() => {
    const m: Record<number, number> = {};
    casos.forEach((c) => { m[c.barrio_id] = (m[c.barrio_id] ?? 0) + 1; });
    return m;
  }, [casos]);

  const zonaById = useMemo(() => {
    const m: Record<number, typeof zonas[number]> = {};
    zonas.forEach((z) => { m[z.id] = z; });
    return m;
  }, [zonas]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();
    return barrios.filter((b) => {
      if (search && !`${b.nombre} ${b.slug}`.toLowerCase().includes(search)) return false;
      if (zonaFiltro && String(b.zona_id) !== zonaFiltro) return false;
      const hasCoords = b.coord_lat != null && b.coord_lng != null;
      const hasCasos = (casosPorBarrio[b.id] ?? 0) > 0;
      if (estado === 'con-coords' && !hasCoords) return false;
      if (estado === 'sin-coords' && hasCoords) return false;
      if (estado === 'con-casos' && !hasCasos) return false;
      return true;
    });
  }, [barrios, q, zonaFiltro, estado, casosPorBarrio]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = barrios.length;
    const con = barrios.filter((b) => b.coord_lat != null && b.coord_lng != null).length;
    return {
      total,
      con,
      sin: total - con,
      casos: barrios.filter((b) => (casosPorBarrio[b.id] ?? 0) > 0).length,
    };
  }, [barrios, casosPorBarrio]);

  const limpiar = () => {
    setQ('');
    setZonaFiltro('');
    setEstado('todos');
    setPage(0);
  };

  const exportarCsv = () => {
    if (filtered.length === 0) return;
    const headers = ['id', 'nombre', 'slug', 'zona', 'coord_lat', 'coord_lng', 'casos'];
    const rows = filtered.map((b) => [
      b.id,
      b.nombre,
      b.slug,
      zonaById[b.zona_id]?.codigo ?? '',
      b.coord_lat ?? '',
      b.coord_lng ?? '',
      casosPorBarrio[b.id] ?? 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barrios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Barrios</span>
          </>
        }
        title={`Barrios · ${barrios.length}`}
        actions={
          <>
            <button type="button" className="btn btn-ghost btn-sm" aria-disabled disabled title="v1.1">
              <Upload />Importar CSV
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportarCsv}>
              <Download />Exportar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/admin/barrios/nuevo')}
            >
              <Plus />Nuevo barrio
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 12 }}>
          <Stat label="Total" value={stats.total} />
          <Stat label="Con coordenadas" value={stats.con} highlight="resolved" />
          <Stat label="Sin coordenadas" value={stats.sin} highlight={stats.sin > 0 ? 'critical' : undefined} />
          <Stat label="Con casos" value={stats.casos} />
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
              style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
              placeholder="Buscar por nombre o slug…"
              aria-label="Buscar barrio"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(0); }}
            />
            <Select
              value={zonaFiltro}
              onChange={(e) => { setZonaFiltro(e.target.value); setPage(0); }}
              aria-label="Filtrar por zona"
              placeholder="Todas las zonas"
              options={[
                { value: '', label: 'Todas las zonas' },
                ...zonas.map((z) => ({ value: String(z.id), label: z.nombre })),
              ]}
            />
            <Select
              value={estado}
              onChange={(e) => { setEstado(e.target.value as EstadoFiltro); setPage(0); }}
              aria-label="Filtrar por estado"
              options={[
                { value: 'todos', label: 'Todos los estados' },
                { value: 'con-coords', label: 'Con coordenadas' },
                { value: 'sin-coords', label: 'Sin coordenadas' },
                { value: 'con-casos', label: 'Con casos vivos' },
              ]}
            />
            {(q || zonaFiltro || estado !== 'todos') && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={limpiar}>
                Limpiar filtros
              </button>
            )}
          </div>

          {isLoading && <p className="caption" style={{ padding: 20 }}>Cargando barrios…</p>}
          {!isLoading && slice.length === 0 && (
            <p className="caption" style={{ padding: 20 }}>Sin resultados.</p>
          )}
          {slice.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Barrio</th>
                  <th>Zona</th>
                  <th>Coords</th>
                  <th>Casos</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((b) => (
                  <Row
                    key={b.id}
                    b={b}
                    zonaNombre={zonaById[b.zona_id]?.nombre ?? '—'}
                    zonaColor={zonaById[b.zona_id]?.color_hex ?? '#9AA3B2'}
                    casos={casosPorBarrio[b.id] ?? 0}
                  />
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
              <span>
                Página {page + 1} de {totalPages} · {filtered.length} barrios
              </span>
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

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: 'resolved' | 'critical';
}) {
  const color =
    highlight === 'resolved' ? 'var(--state-resolved)' :
    highlight === 'critical' ? 'var(--state-critical)' :
    'var(--ink-strong)';
  return (
    <div
      className="admin-card"
      style={{ padding: '14px 18px', flex: '1 1 180px', minWidth: 180 }}
    >
      <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 28,
          color,
          marginTop: 4,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Row({
  b,
  zonaNombre,
  zonaColor,
  casos,
}: {
  b: Barrio;
  zonaNombre: string;
  zonaColor: string;
  casos: number;
}) {
  const navigate = useNavigate();
  const hasCoords = b.coord_lat != null && b.coord_lng != null;
  return (
    <tr
      onClick={() => navigate(`/admin/barrios/${b.slug}/editar`)}
      style={{ cursor: 'pointer' }}
    >
      <td>
        <div className="row-title">
          <div className="ic-mini" style={{ background: zonaColor }} aria-hidden />
          <div>
            <div style={{ fontWeight: 700 }}>{b.nombre}</div>
            <div className="row-meta mono" style={{ fontSize: 11 }}>{b.slug}</div>
          </div>
        </div>
      </td>
      <td>
        <span
          className="badge"
          style={{ background: `${zonaColor}22`, color: zonaColor, borderColor: `${zonaColor}55` }}
        >
          {zonaNombre}
        </span>
      </td>
      <td>
        {hasCoords ? (
          <span className="mono" style={{ fontSize: 12 }}>
            {b.coord_lat!.toFixed(4)}, {b.coord_lng!.toFixed(4)}
          </span>
        ) : (
          <span className="mono" style={{ fontSize: 12, color: 'var(--state-critical)' }}>
            sin coords
          </span>
        )}
      </td>
      <td>
        {casos > 0 ? (
          <span className="badge" style={{ background: 'var(--biss-teal-50)', color: 'var(--biss-teal-900)' }}>
            {casos}
          </span>
        ) : (
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>—</span>
        )}
      </td>
      <td className="action-cell" onClick={(e) => e.stopPropagation()}>
        <Link to={`/admin/barrios/${b.slug}/editar`} aria-label={`Editar ${b.nombre}`}>
          <Edit style={{ width: 14, height: 14 }} />
        </Link>
      </td>
    </tr>
  );
}
