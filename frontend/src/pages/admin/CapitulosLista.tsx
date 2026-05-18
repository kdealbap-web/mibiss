import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, BookOpen, AlertTriangle, Check } from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { SearchInput, Select } from '../../components/ui';
import { useCapitulosAdmin, type CapituloAdmin } from '../../hooks/useCapitulosAdmin';
import { useZonas } from '../../hooks/useZonas';

type Filtro = 'todos' | 'activos' | 'borradores' | 'incompletos';

export function CapitulosLista() {
  const navigate = useNavigate();
  const { data: capitulos = [], isLoading } = useCapitulosAdmin();
  const { data: zonas = [] } = useZonas();

  const [q, setQ] = useState('');
  const [zonaFiltro, setZonaFiltro] = useState<string>('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return capitulos.filter((c) => {
      if (t && !`${c.barrio_nombre} ${c.barrio_slug}`.toLowerCase().includes(t)) return false;
      if (zonaFiltro && String(c.zona_id) !== zonaFiltro) return false;
      const completo = c.descripcion && c.imagen_portada_url && c.geocerca;
      if (filtro === 'activos' && !c.activo) return false;
      if (filtro === 'borradores' && c.activo) return false;
      if (filtro === 'incompletos' && completo) return false;
      return true;
    });
  }, [capitulos, q, zonaFiltro, filtro]);

  const stats = useMemo(() => {
    const total = capitulos.length;
    const activos = capitulos.filter((c) => c.activo).length;
    const incompletos = capitulos.filter(
      (c) => !c.descripcion || !c.imagen_portada_url || !c.geocerca,
    ).length;
    return { total, activos, borradores: total - activos, incompletos };
  }, [capitulos]);

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Capítulos</span>
          </>
        }
        title={`Capítulos · ${capitulos.length}`}
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 12 }}>
          <Stat label="Total" value={stats.total} />
          <Stat label="Activos" value={stats.activos} highlight="resolved" />
          <Stat label="Borradores" value={stats.borradores} />
          <Stat
            label="Incompletos"
            value={stats.incompletos}
            highlight={stats.incompletos > 0 ? 'critical' : undefined}
          />
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
              style={{ maxWidth: 360 }}
              placeholder="Buscar por barrio o slug…"
              aria-label="Buscar capítulo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Select
              value={zonaFiltro}
              onChange={(e) => setZonaFiltro(e.target.value)}
              aria-label="Filtrar por zona"
              options={[
                { value: '', label: 'Todas las zonas' },
                ...zonas.map((z) => ({ value: String(z.id), label: z.nombre })),
              ]}
            />
            <Select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as Filtro)}
              aria-label="Filtrar por estado"
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'activos', label: 'Activos' },
                { value: 'borradores', label: 'Borradores' },
                { value: 'incompletos', label: 'Incompletos' },
              ]}
            />
          </div>

          {isLoading && <p className="caption" style={{ padding: 20 }}>Un segundo…</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="caption" style={{ padding: 20 }}>Sin capítulos en este filtro.</p>
          )}
          {filtered.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Capítulo · barrio</th>
                  <th>Zona</th>
                  <th>Estado</th>
                  <th>Contenido</th>
                  <th>Casos</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <Row
                    key={c.id}
                    c={c}
                    onOpen={() => navigate(`/admin/capitulos/${c.id}/editar`)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Row({ c, onOpen }: { c: CapituloAdmin; onOpen: () => void }) {
  const hasDescripcion = Boolean(c.descripcion);
  const hasImagen = Boolean(c.imagen_portada_url);
  const hasGeocerca = Boolean(c.geocerca);
  const completo = hasDescripcion && hasImagen && hasGeocerca;

  return (
    <tr onClick={onOpen} style={{ cursor: 'pointer' }}>
      <td>
        <div className="row-title">
          <div className="ic-mini" style={{ background: c.zona_color }} aria-hidden>
            <BookOpen size={14} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{c.barrio_nombre}</div>
            <div className="row-meta mono" style={{ fontSize: 11 }}>{c.barrio_slug}</div>
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
          {c.zona_nombre}
        </span>
      </td>
      <td>
        {c.activo ? (
          <span className="badge badge-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} />Activo
          </span>
        ) : (
          <span className="badge" style={{ color: 'var(--ink-soft)' }}>Borrador</span>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <Chip ok={hasDescripcion} label="desc" />
          <Chip ok={hasImagen} label="img" />
          <Chip ok={hasGeocerca} label="geo" />
        </div>
      </td>
      <td>
        {c.casos_total > 0 ? (
          <span
            className="badge"
            style={{ background: 'var(--biss-teal-50)', color: 'var(--biss-teal-900)' }}
          >
            {c.casos_total}
          </span>
        ) : (
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>—</span>
        )}
      </td>
      <td className="action-cell" onClick={(e) => e.stopPropagation()}>
        {!completo && c.activo && (
          <AlertTriangle
            size={14}
            style={{ color: 'var(--state-critical)' }}
            aria-label="Activo con datos faltantes"
          />
        )}
        <Link to={`/admin/capitulos/${c.id}/editar`} aria-label={`Editar capítulo ${c.barrio_nombre}`}>
          <Edit style={{ width: 14, height: 14 }} />
        </Link>
      </td>
    </tr>
  );
}

function Chip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="badge"
      style={{
        background: ok ? 'var(--state-resolved-bg)' : 'var(--surface-sunken)',
        color: ok ? '#065F46' : 'var(--ink-soft)',
        fontSize: 10,
        padding: '2px 6px',
      }}
      aria-label={ok ? `${label} listo` : `${label} pendiente`}
    >
      {ok ? '✓' : '·'} {label}
    </span>
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
    <div className="admin-card" style={{ padding: '14px 18px', flex: '1 1 180px', minWidth: 180 }}>
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
