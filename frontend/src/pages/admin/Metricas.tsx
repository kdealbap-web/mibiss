import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Eye,
  Users,
  CheckCircle2,
  ExternalLink,
  BarChart3,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { useStatsGlobales } from '../../hooks/useStats';
import { useStatsPorCategoria } from '../../hooks/useCategorias';
import {
  useVisitasKpis,
  useTopPaths,
  useVisitasSemanal,
  useTopBarrios,
  useCasosMensuales,
} from '../../hooks/useMetricasAdmin';
import { formatNumber, formatRelative } from '../../lib/format';

import '../../styles/page-admin-metricas.css';

export function Metricas() {
  const { data: stats } = useStatsGlobales();
  const { data: categorias = [] } = useStatsPorCategoria();
  const { data: visitas } = useVisitasKpis();
  const { data: topPaths = [] } = useTopPaths();
  const { data: visitasSemanal = [] } = useVisitasSemanal();
  const { data: topBarrios = [] } = useTopBarrios();
  const { data: casosMensuales = [] } = useCasosMensuales();

  const maxCat = useMemo(
    () => categorias.reduce((m, c) => (c.casos > m ? c.casos : m), 1),
    [categorias],
  );

  const maxMensual = useMemo(
    () => casosMensuales.reduce((m, c) => (c.total > m ? c.total : m), 1),
    [casosMensuales],
  );

  const maxSemana = useMemo(
    () => visitasSemanal.reduce((m, v) => (v.visitas > m ? v.visitas : m), 1),
    [visitasSemanal],
  );

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Sistema</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Métricas</span>
          </>
        }
        title="Métricas"
        actions={
          <a
            href="https://dash.cloudflare.com/?to=/:account/analytics/web-analytics"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
          >
            <ExternalLink size={14} />
            Cloudflare Analytics
          </a>
        }
      />

      <div className="admin-page">
        <section style={{ display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 14, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Visitas web · tracking interno
          </h2>
          <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <Kpi label="Hoy" value={visitas?.visitas_hoy ?? 0} icon={<Eye size={14} />} tone="teal" />
            <Kpi label="Últimos 7 días" value={visitas?.visitas_semana ?? 0} icon={<TrendingUp size={14} />} tone="teal" />
            <Kpi label="Últimos 30 días" value={visitas?.visitas_mes ?? 0} icon={<TrendingUp size={14} />} tone="resolved" />
            <Kpi label="Total" value={visitas?.visitas_total ?? 0} icon={<BarChart3 size={14} />} tone="navy" />
          </div>

          <div className="admin-card" style={{ padding: '18px 20px' }}>
            <h3 style={{ marginBottom: 12 }}>Visitas por semana · últimas 12</h3>
            {visitasSemanal.length === 0 ? (
              <p className="caption">Aún no hay visitas registradas. Tan pronto alguien navegue, aparecen aquí.</p>
            ) : (
              <ChartBars data={visitasSemanal.map((v) => ({ label: shortWeek(v.semana_inicio), value: v.visitas }))} max={maxSemana} />
            )}
          </div>

          <div className="admin-card" style={{ padding: '18px 20px' }}>
            <h3 style={{ marginBottom: 12 }}>Páginas más vistas · últimos 30 días</h3>
            {topPaths.length === 0 ? (
              <p className="caption">Sin datos todavía.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ruta</th>
                    <th style={{ textAlign: 'right' }}>Visitas</th>
                    <th style={{ textAlign: 'right' }}>Última</th>
                  </tr>
                </thead>
                <tbody>
                  {topPaths.slice(0, 10).map((p) => (
                    <tr key={p.path}>
                      <td><span className="mono" style={{ fontSize: 12.5 }}>{p.path}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatNumber(p.visitas)}</td>
                      <td style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--ink-soft)' }}>
                        {formatRelative(p.ultima_visita)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 12, marginTop: 32 }}>
          <h2 style={{ fontSize: 14, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Operación BISS · contenido
          </h2>
          <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <Kpi label="Casos públicos" value={stats?.casos_publicos ?? 0} icon={<CheckCircle2 size={14} />} tone="teal" />
            <Kpi label="Críticos" value={stats?.casos_criticos ?? 0} tone="critical" />
            <Kpi label="En gestión" value={stats?.casos_progreso ?? 0} tone="progress" />
            <Kpi label="Resueltos" value={stats?.casos_resueltos ?? 0} tone="resolved" />
          </div>
          <div className="admin-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <Kpi label="Barrios" value={stats?.barrios_total ?? 0} tone="navy" />
            <Kpi label="Capítulos activos" value={stats?.capitulos_activos ?? 0} tone="navy" />
            <Kpi
              label="Ciudadanos verificados"
              value={stats?.ciudadanos_verificados ?? 0}
              icon={<Users size={14} />}
              tone="navy"
            />
          </div>

          <div className="admin-card" style={{ padding: '18px 20px' }}>
            <h3 style={{ marginBottom: 12 }}>Casos abiertos vs resueltos · últimos 12 meses</h3>
            {casosMensuales.length === 0 ? (
              <p className="caption">Sin datos suficientes todavía.</p>
            ) : (
              <ChartDouble
                data={casosMensuales.map((c) => ({
                  label: shortMonth(c.mes),
                  primary: c.total,
                  secondary: c.resueltos,
                }))}
                max={Math.max(maxMensual, 1)}
                primaryLabel="Abiertos"
                secondaryLabel="Resueltos"
                primaryColor="var(--state-critical)"
                secondaryColor="var(--state-resolved)"
              />
            )}
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="admin-stats-2col"
          >
            <div className="admin-card" style={{ padding: '18px 20px' }}>
              <h3 style={{ marginBottom: 12 }}>Top categorías</h3>
              {categorias.length === 0 ? (
                <p className="caption">Sin datos.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {categorias.slice(0, 8).map((c) => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 48px', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-strong)' }}>{c.nombre}</span>
                      <div style={{ background: 'var(--surface-sunken)', borderRadius: 4, height: 18, overflow: 'hidden' }}>
                        <div
                          style={{
                            background: c.color_hex,
                            height: '100%',
                            width: `${Math.max(2, (c.casos / maxCat) * 100)}%`,
                            transition: 'width 300ms ease',
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: 12, textAlign: 'right', fontWeight: 700 }}>
                        {formatNumber(c.casos)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-card" style={{ padding: '18px 20px' }}>
              <h3 style={{ marginBottom: 12 }}>Top barrios por casos</h3>
              {topBarrios.length === 0 ? (
                <p className="caption">Sin datos.</p>
              ) : (
                <table className="admin-table" style={{ marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th>Barrio</th>
                      <th style={{ textAlign: 'right' }}>Casos</th>
                      <th style={{ textAlign: 'right' }}>Resueltos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBarrios.map((b) => (
                      <tr key={b.capitulo_id}>
                        <td>
                          <Link
                            to={`/capitulo/${b.barrio_slug}`}
                            target="_blank"
                            style={{ color: 'var(--biss-teal-900)', fontWeight: 600 }}
                          >
                            {b.barrio_nombre}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{b.zona_nombre}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{b.casos_total}</td>
                        <td style={{ textAlign: 'right', color: 'var(--state-resolved)', fontWeight: 700 }}>
                          {b.casos_resueltos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

function Kpi({
  label,
  value,
  icon,
  tone = 'teal',
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: 'teal' | 'navy' | 'critical' | 'progress' | 'resolved';
}) {
  const color =
    tone === 'critical' ? 'var(--state-critical)' :
    tone === 'progress' ? 'var(--state-progress-ink)' :
    tone === 'resolved' ? 'var(--state-resolved)' :
    tone === 'navy' ? 'var(--ink-strong)' :
    'var(--biss-teal-900)';
  return (
    <div className={`stat-mini accent-${tone}`} style={{ padding: '14px 18px' }}>
      <div className="l" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {icon}{label}
      </div>
      <div className="n" style={{ color, fontSize: 28 }}>{formatNumber(value)}</div>
    </div>
  );
}

function ChartBars({ data, max }: { data: Array<{ label: string; value: number }>; max: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 6, alignItems: 'flex-end', height: 160 }}>
      {data.map((d, i) => {
        const h = max > 0 ? Math.max(4, (d.value / max) * 140) : 4;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: '100%',
                height: h,
                background: 'var(--biss-teal)',
                borderRadius: '4px 4px 0 0',
                transition: 'height 300ms ease',
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span style={{ fontSize: 10.5, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ChartDouble({
  data,
  max,
  primaryLabel,
  secondaryLabel,
  primaryColor,
  secondaryColor,
}: {
  data: Array<{ label: string; primary: number; secondary: number }>;
  max: number;
  primaryLabel: string;
  secondaryLabel: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: 14, fontSize: 12, marginBottom: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: primaryColor }} />
          {primaryLabel}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: secondaryColor }} />
          {secondaryLabel}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.length}, 1fr)`, gap: 6, alignItems: 'flex-end', height: 160 }}>
        {data.map((d, i) => {
          const h1 = max > 0 ? Math.max(2, (d.primary / max) * 140) : 2;
          const h2 = max > 0 ? Math.max(2, (d.secondary / max) * 140) : 2;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%', height: 140 }}>
                <div
                  style={{
                    flex: 1,
                    height: h1,
                    background: primaryColor,
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 300ms ease',
                  }}
                  title={`${d.label} · ${primaryLabel}: ${d.primary}`}
                />
                <div
                  style={{
                    flex: 1,
                    height: h2,
                    background: secondaryColor,
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 300ms ease',
                  }}
                  title={`${d.label} · ${secondaryLabel}: ${d.secondary}`}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

function shortMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${months[Number(m) - 1] ?? '?'} ${y.slice(2)}`;
}

function shortWeek(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${day} ${months[d.getMonth()] ?? '?'}`;
}
