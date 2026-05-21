import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Inbox,
  AlertTriangle,
  Minus,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { useStatsGlobales } from '../../hooks/useStats';
import { useStatsPorCategoria } from '../../hooks/useCategorias';
import { useCapitulosPublicos } from '../../hooks/useCapitulos';
import { useSolicitudes } from '../../hooks/useSolicitudes';
import { useMiPerfil } from '../../hooks/useMiCuenta';
import { formatNumber, formatRelative } from '../../lib/format';

function getSaludo(h: number): string {
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Dashboard() {
  const { data: stats } = useStatsGlobales();
  const { data: catStats = [] } = useStatsPorCategoria();
  const { data: capitulos = [] } = useCapitulosPublicos();
  const { data: solicitudes = [] } = useSolicitudes();
  const { data: perfil } = useMiPerfil();

  const colaCount = solicitudes.length;
  const saludo = getSaludo(new Date().getHours());
  const primerNombre = perfil?.nombres?.split(' ')[0] ?? '';
  const tituloSaludo = primerNombre ? `${saludo}, ${primerNombre}` : saludo;

  const catBars = useMemo(() => {
    const sorted = [...catStats].sort((a, b) => b.casos - a.casos).slice(0, 5);
    const max = sorted[0]?.casos ?? 1;
    return sorted.map((c) => ({
      codigo: c.codigo,
      nombre: c.nombre,
      count: c.casos,
      pct: max > 0 ? Math.round((c.casos / max) * 100) : 0,
    }));
  }, [catStats]);

  const topBarrios = useMemo(() => {
    return [...capitulos]
      .sort((a, b) => b.casos_total - a.casos_total)
      .slice(0, 5)
      .map((c, i) => ({ pos: i + 1, nombre: c.barrio_nombre, acciones: c.casos_total }));
  }, [capitulos]);

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            Operación / <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Dashboard</span>
          </>
        }
        title={tituloSaludo}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Download />Exportar
            </button>
            <Link className="btn btn-primary btn-sm" to="/admin/solicitudes">
              <Inbox />Revisar cola ({colaCount})
            </Link>
          </>
        }
      />

      <div className="admin-page">
        {colaCount > 0 && (
          <div className="alert alert-warning">
            <AlertTriangle className="alert-icon" />
            <div className="alert-body">
              <div className="alert-title">
                {colaCount} solicitud{colaCount === 1 ? '' : 'es'} esperando moderación
              </div>
              <div className="alert-text">
                <Link to="/admin/solicitudes" style={{ fontWeight: 700, color: '#92400E' }}>
                  Revisarlas →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="admin-stats">
          <div className="stat-mini accent-critical">
            <div className="l">Críticos abiertos</div>
            <div className="n">{formatNumber(stats?.casos_criticos ?? 0)}</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />casos en estado crítico</div>
          </div>
          <div className="stat-mini accent-progress">
            <div className="l">En gestión</div>
            <div className="n">{formatNumber(stats?.casos_progreso ?? 0)}</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />en proceso</div>
          </div>
          <div className="stat-mini accent-resolved">
            <div className="l">Resueltos</div>
            <div className="n">{formatNumber(stats?.casos_resueltos ?? 0)}</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />acumulados</div>
          </div>
          <div className="stat-mini accent-teal">
            <div className="l">Ciudadanos verificados</div>
            <div className="n">{formatNumber(stats?.ciudadanos_verificados ?? 0)}</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />total</div>
          </div>
          <div className="stat-mini accent-social">
            <div className="l">Capítulos activos</div>
            <div className="n">{formatNumber(stats?.capitulos_activos ?? 0)}</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />barrios con bitácora</div>
          </div>
          <div className="stat-mini accent-resolved">
            <div className="l">Solicitudes pendientes</div>
            <div className="n">{formatNumber(stats?.solicitudes_pendientes ?? colaCount)}</div>
            <div className="d flat"><Inbox style={{ width: 12, height: 12 }} />esperan revisión</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>Solicitudes recientes</h2>
                <div className="card-sub">Cola actual</div>
              </div>
              <Link to="/admin/solicitudes" className="btn btn-ghost btn-sm">
                Ver toda <Inbox />
              </Link>
            </div>
            <div className="feed">
              {solicitudes.length === 0 ? (
                <p className="caption" style={{ padding: '12px 4px' }}>
                  Nada pendiente. Cuando llegue una solicitud nueva, aparece aquí.
                </p>
              ) : (
                solicitudes.slice(0, 8).map((s) => (
                  <div key={s.id} className="feed-item">
                    <div className="ic critical">
                      <AlertCircle />
                    </div>
                    <div className="what">
                      <strong>{s.ciudadano}</strong> reportó <strong>{s.titulo}</strong> · {s.barrio} · {s.categoria}
                    </div>
                    <div className="when">{formatRelative(s.creado_en)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <div className="admin-card">
              <h2>Por categoría</h2>
              <div className="card-sub">Casos abiertos por tipo</div>
              <div className="stack stack-3" style={{ marginTop: 6 }}>
                {catBars.length === 0 && (
                  <p className="caption">Sin casos publicados todavía.</p>
                )}
                {catBars.map((c) => (
                  <div key={c.codigo}>
                    <div className="row row-3" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="row row-2">
                        <span style={{ width: 10, height: 10, borderRadius: 99, background: `var(--cat-${c.codigo})` }} />
                        {c.nombre}
                      </span>
                      <strong>{c.count}</strong>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-sunken)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${c.pct}%`, height: '100%', background: `var(--cat-${c.codigo})` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card">
              <h2>Top barrios con más casos</h2>
              <div className="card-sub">Capítulos activos · por total de casos publicados</div>
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                {topBarrios.length === 0 && (
                  <p className="caption">Aún no hay barrios con casos publicados.</p>
                )}
                {topBarrios.map((b, i) => (
                  <li
                    key={b.pos}
                    className="row row-3"
                    style={{
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: i < topBarrios.length - 1 ? '1px solid var(--border)' : 0,
                    }}
                  >
                    <span><strong>{b.pos}.</strong> {b.nombre}</span>
                    <span className="mono" style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}>
                      {b.acciones} casos
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
