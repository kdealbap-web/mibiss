import { Link } from 'react-router-dom';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Share2,
  MessageCircle,
  Search,
  Link as LinkIcon,
  Facebook,
  Newspaper,
  Minus,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';

import '../../styles/page-admin-metricas.css';

// Heatmap: filas L,M,M,J,V,S,D · franjas 9-12, 12-15, 15-18, 18-21
const HEATMAP: Array<{ label: string; cells: Array<{ h: 1 | 2 | 3 | 4 | 5; n: number }> }> = [
  {
    label: '9-12h',
    cells: [
      { h: 2, n: 3 }, { h: 3, n: 5 }, { h: 3, n: 6 },
      { h: 4, n: 8 }, { h: 5, n: 11 }, { h: 2, n: 3 }, { h: 1, n: 1 },
    ],
  },
  {
    label: '12-15h',
    cells: [
      { h: 4, n: 9 }, { h: 3, n: 5 }, { h: 4, n: 7 },
      { h: 5, n: 12 }, { h: 4, n: 9 }, { h: 3, n: 5 }, { h: 2, n: 2 },
    ],
  },
  {
    label: '15-18h',
    cells: [
      { h: 5, n: 10 }, { h: 5, n: 11 }, { h: 4, n: 8 },
      { h: 4, n: 7 }, { h: 5, n: 13 }, { h: 3, n: 4 }, { h: 1, n: 1 },
    ],
  },
  {
    label: '18-21h',
    cells: [
      { h: 3, n: 6 }, { h: 4, n: 8 }, { h: 4, n: 9 },
      { h: 3, n: 5 }, { h: 4, n: 8 }, { h: 2, n: 3 }, { h: 1, n: 2 },
    ],
  },
];

const TOP_BARRIOS = [
  { pos: 1, nombre: 'Soledad 2000', casos: 23, voces: 31, padrinos: 5, resol: 26, badge: 'resolved' as const, tend: '+12%', tendIcon: TrendingUp, tendColor: 'var(--state-resolved)' },
  { pos: 2, nombre: 'Don Bosco', casos: 19, voces: 24, padrinos: 3, resol: 42, badge: 'resolved' as const, tend: '+8%', tendIcon: TrendingUp, tendColor: 'var(--state-resolved)' },
  { pos: 3, nombre: 'La Candelaria', casos: 14, voces: 19, padrinos: 2, resol: 14, badge: 'progress' as const, tend: '0%', tendIcon: Minus, tendColor: 'var(--ink-soft)' },
  { pos: 4, nombre: 'El Hipódromo', casos: 11, voces: 14, padrinos: 4, resol: 27, badge: 'resolved' as const, tend: '+6%', tendIcon: TrendingUp, tendColor: 'var(--state-resolved)' },
  { pos: 5, nombre: 'Salamanca', casos: 8, voces: 11, padrinos: 1, resol: 37, badge: 'progress' as const, tend: '-3%', tendIcon: TrendingDown, tendColor: 'var(--state-critical)' },
];

export function Metricas() {
  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Sistema</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Métricas</span>
          </>
        }
        title="Métricas y reportes"
        actions={
          <>
            <select
              className="field-select"
              style={{ minHeight: 36, padding: '6px 14px', fontSize: 13 }}
              defaultValue="Últimos 30 días"
            >
              <option>Últimos 30 días</option>
              <option>Últimos 90 días</option>
              <option>Este año</option>
            </select>
            <button type="button" className="btn btn-primary btn-sm">
              <Download />Exportar CSV
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="admin-stats">
          <div className="stat-mini accent-teal">
            <div className="l">Visitas únicas · 30d</div>
            <div className="n">12.8K</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+18% vs mes anterior</div>
          </div>
          <div className="stat-mini accent-social">
            <div className="l">Páginas vistas</div>
            <div className="n">43.1K</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />3.4 vistas/sesión</div>
          </div>
          <div className="stat-mini accent-resolved">
            <div className="l">Tiempo en sitio · prom.</div>
            <div className="n">4:32</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+48s vs Q1</div>
          </div>
          <div className="stat-mini accent-progress">
            <div className="l">Tasa de rebote</div>
            <div className="n">34%</div>
            <div className="d up"><TrendingDown style={{ width: 12, height: 12 }} />-6% vs Q1</div>
          </div>
          <div className="stat-mini accent-teal">
            <div className="l">Visitantes mobile</div>
            <div className="n">87%</div>
            <div className="d flat"><Smartphone style={{ width: 12, height: 12 }} />iOS 42% · Android 45%</div>
          </div>
          <div className="stat-mini accent-critical">
            <div className="l">Origen WhatsApp</div>
            <div className="n">62%</div>
            <div className="d up"><Share2 style={{ width: 12, height: 12 }} />compartidos virales</div>
          </div>
        </div>

        <div className="admin-card chart-card">
          <div className="admin-card-head">
            <div>
              <h2>Visitas al sitio público · últimos 30 días</h2>
              <div className="card-sub">Cada barra = un día · pico el día que Kevin publicó el caso del cráter</div>
            </div>
            <div className="row row-2">
              <span className="badge badge-folio">12.823 visitas únicas</span>
              <span className="badge badge-resolved">+18% vs mes anterior</span>
            </div>
          </div>
          <svg className="chart-svg" viewBox="0 0 800 240" preserveAspectRatio="none">
            <g stroke="#E5E7EB" strokeWidth="1">
              <line x1="40" y1="40" x2="780" y2="40" />
              <line x1="40" y1="90" x2="780" y2="90" />
              <line x1="40" y1="140" x2="780" y2="140" />
              <line x1="40" y1="190" x2="780" y2="190" />
            </g>
            <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#5B6678">
              <text x="6" y="44">800</text>
              <text x="6" y="94">600</text>
              <text x="6" y="144">400</text>
              <text x="6" y="194">200</text>
              <text x="60" y="220">15 ABR</text>
              <text x="220" y="220">22 ABR</text>
              <text x="380" y="220">29 ABR</text>
              <text x="540" y="220">6 MAY</text>
              <text x="700" y="220">14 MAY</text>
            </g>
            <g fill="#0CB9C1">
              {[
                [50, 160, 40], [74, 150, 50], [98, 155, 45], [122, 140, 60],
                [146, 135, 65], [170, 120, 80], [194, 125, 75], [218, 115, 85],
                [242, 105, 95], [266, 98, 102], [290, 105, 95], [314, 92, 108],
                [338, 80, 120], [362, 85, 115], [386, 70, 130], [410, 60, 140],
                [434, 50, 150],
              ].map(([x, y, h], i) => (
                <rect key={i} x={x} y={y} width={18} height={h} rx={2} />
              ))}
              <rect x={458} y={35} width={18} height={165} rx={2} fill="#D20B62" />
              {[
                [482, 65, 135], [506, 75, 125], [530, 80, 120], [554, 68, 132],
                [578, 62, 138], [602, 55, 145], [626, 48, 152], [650, 58, 142],
                [674, 52, 148], [698, 45, 155], [722, 38, 162], [746, 42, 158],
              ].map(([x, y, h], i) => (
                <rect key={`b2-${i}`} x={x} y={y} width={18} height={h} rx={2} />
              ))}
            </g>
            <text x="468" y="28" textAnchor="middle" fontFamily="VAG Rounded Next, sans-serif" fontSize="11" fontWeight="700" fill="#D20B62">
              ↓ pico: 612 visitas
            </text>
          </svg>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr' }}>
          <div className="admin-card">
            <h2>Páginas más visitadas</h2>
            <div className="card-sub" style={{ marginBottom: 14 }}>Últimos 30 días</div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Vistas</th>
                  <th>Visitantes únicos</th>
                  <th>Tiempo prom.</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Home / Mapa', '/', '18.420', '10.812', '3:42'],
                  ['Cráter en calle 30', '/caso/CS-2026-0142', '4.128', '3.890', '6:18'],
                  ['Capítulo Soledad 2000', '/capitulo/soledad-2000', '3.567', '2.704', '5:02'],
                  ['Sin agua los lunes', '/caso/CS-2026-0128', '2.891', '2.451', '5:48'],
                  ['Capítulo La Candelaria', '/capitulo/la-candelaria', '1.984', '1.622', '4:11'],
                  ['Cómo funciona', '/#como-funciona', '1.450', '1.205', '1:34'],
                ].map(([titulo, path, vistas, uniq, tiempo]) => (
                  <tr key={path}>
                    <td>
                      <strong>{titulo}</strong>
                      <br />
                      <span className="row-meta mono">{path}</span>
                    </td>
                    <td>{vistas}</td>
                    <td>{uniq}</td>
                    <td>{tiempo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-card">
            <h2>De dónde vienen los visitantes</h2>
            <div className="card-sub" style={{ marginBottom: 14 }}>Canales de adquisición · últimos 30 días</div>
            <div className="stack stack-3">
              {[
                { Icon: MessageCircle, color: 'var(--state-resolved)', label: 'WhatsApp · enlaces compartidos', count: '7.944', pct: 62 },
                { Icon: Search, color: 'var(--cat-agua)', label: 'Google · búsqueda orgánica', count: '2.180', pct: 17 },
                { Icon: LinkIcon, color: 'var(--biss-teal)', label: 'Directo · digitan mibiss.com.co', count: '1.665', pct: 13 },
                { Icon: Facebook, color: 'var(--cat-educacion)', label: 'Facebook · publicaciones de Kevin', count: '770', pct: 6 },
                { Icon: Newspaper, color: 'var(--cat-luz)', label: 'Prensa local · El Heraldo, La Libertad', count: '264', pct: 2 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="row row-3" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="row row-2">
                      <s.Icon style={{ width: 16, height: 16, color: s.color }} />
                      <strong>{s.label.split(' · ')[0]}</strong>
                      {s.label.includes(' · ') && ' · ' + s.label.split(' · ').slice(1).join(' · ')}
                    </span>
                    <strong style={{ color: s.color }}>{s.count}</strong>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-sunken)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-stats">
          <div className="stat-mini accent-teal">
            <div className="l">Tiempo promedio · resolución</div>
            <div className="n">42d</div>
            <div className="d up"><TrendingDown style={{ width: 12, height: 12 }} />-8 días vs Q1</div>
          </div>
          <div className="stat-mini accent-resolved">
            <div className="l">Tasa de resolución</div>
            <div className="n">38%</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+5% mes anterior</div>
          </div>
          <div className="stat-mini accent-social">
            <div className="l">Engagement vecinal</div>
            <div className="n">2.4</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />voces/caso</div>
          </div>
          <div className="stat-mini accent-critical">
            <div className="l">Casos sin atender +30d</div>
            <div className="n">11</div>
            <div className="d down"><TrendingUp style={{ width: 12, height: 12 }} />+3 esta semana</div>
          </div>
          <div className="stat-mini accent-progress">
            <div className="l">Padrinazgo total</div>
            <div className="n">$24M</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+$4.2M Q1</div>
          </div>
          <div className="stat-mini accent-teal">
            <div className="l">Nuevos ciudadanos</div>
            <div className="n">847</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+62 este mes</div>
          </div>
        </div>

        <div className="admin-card chart-card">
          <div className="admin-card-head">
            <div>
              <h2>Casos abiertos vs resueltos · últimos 6 meses</h2>
              <div className="card-sub">Línea teal = abiertos · línea verde = resueltos</div>
            </div>
          </div>
          <svg className="chart-svg" viewBox="0 0 800 240" preserveAspectRatio="none">
            <g stroke="#E5E7EB" strokeWidth="1">
              <line x1="40" y1="40" x2="780" y2="40" />
              <line x1="40" y1="90" x2="780" y2="90" />
              <line x1="40" y1="140" x2="780" y2="140" />
              <line x1="40" y1="190" x2="780" y2="190" />
            </g>
            <g fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#5B6678">
              <text x="6" y="44">160</text>
              <text x="6" y="94">120</text>
              <text x="6" y="144">80</text>
              <text x="6" y="194">40</text>
              <text x="60" y="220">DIC</text>
              <text x="180" y="220">ENE</text>
              <text x="300" y="220">FEB</text>
              <text x="420" y="220">MAR</text>
              <text x="540" y="220">ABR</text>
              <text x="660" y="220">MAY</text>
            </g>
            <path d="M 60 110 L 180 95 L 300 80 L 420 65 L 540 55 L 660 50" fill="none" stroke="#0CB9C1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 60 110 L 180 95 L 300 80 L 420 65 L 540 55 L 660 50 L 660 200 L 60 200 Z" fill="#0CB9C1" opacity="0.08" />
            <path d="M 60 175 L 180 160 L 300 150 L 420 140 L 540 130 L 660 118" fill="none" stroke="#3DAF6C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <g fill="#0CB9C1">
              <circle cx="60" cy="110" r="5" />
              <circle cx="180" cy="95" r="5" />
              <circle cx="300" cy="80" r="5" />
              <circle cx="420" cy="65" r="5" />
              <circle cx="540" cy="55" r="5" />
              <circle cx="660" cy="50" r="6" stroke="#FFFFFF" strokeWidth="2" />
            </g>
            <g fill="#3DAF6C">
              <circle cx="60" cy="175" r="5" />
              <circle cx="180" cy="160" r="5" />
              <circle cx="300" cy="150" r="5" />
              <circle cx="420" cy="140" r="5" />
              <circle cx="540" cy="130" r="5" />
              <circle cx="660" cy="118" r="6" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          </svg>
          <div className="legend-row">
            <div className="item">
              <div className="swatch" style={{ background: '#0CB9C1' }} />Casos abiertos · 142 en mayo
            </div>
            <div className="item">
              <div className="swatch" style={{ background: '#3DAF6C' }} />Casos resueltos · 55 en mayo
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr' }}>
          <div className="admin-card chart-card">
            <h2>Casos por categoría</h2>
            <div className="card-sub" style={{ marginBottom: 16 }}>Acumulado del año</div>
            <svg className="chart-svg" viewBox="0 0 400 240">
              <g fontFamily="Inter, sans-serif" fontSize="12" fill="#1F2937" fontWeight="600">
                <text x="115" y="36">Infraestructura</text>
                <rect x="115" y="44" width="270" height="22" rx="4" fill="#92400E" />
                <text x="382" y="60" textAnchor="end" fill="#FFFFFF" fontFamily="JetBrains Mono" fontSize="11">36</text>
                <text x="115" y="80">Agua</text>
                <rect x="115" y="88" width="210" height="22" rx="4" fill="#3773B9" />
                <text x="322" y="104" textAnchor="end" fill="#FFFFFF" fontFamily="JetBrains Mono" fontSize="11">28</text>
                <text x="115" y="124">Luz</text>
                <rect x="115" y="132" width="142" height="22" rx="4" fill="#F59E0B" />
                <text x="254" y="148" textAnchor="end" fill="#FFFFFF" fontFamily="JetBrains Mono" fontSize="11">19</text>
                <text x="115" y="168">Social</text>
                <rect x="115" y="176" width="135" height="22" rx="4" fill="#D20B62" />
                <text x="247" y="192" textAnchor="end" fill="#FFFFFF" fontFamily="JetBrains Mono" fontSize="11">18</text>
                <text x="115" y="212">Ambiente</text>
                <rect x="115" y="220" width="105" height="14" rx="4" fill="#15803D" />
                <text x="218" y="231" textAnchor="end" fill="#FFFFFF" fontFamily="JetBrains Mono" fontSize="11">14</text>
              </g>
            </svg>
          </div>

          <div className="admin-card chart-card">
            <h2>Mapa de calor · actividad por hora</h2>
            <div className="card-sub" style={{ marginBottom: 14 }}>Casos nuevos por día/hora · última semana</div>
            <div className="heatmap">
              {HEATMAP.map((row, i) => (
                <span key={`row-${i}`} style={{ display: 'contents' }}>
                  <div className="lbl">{row.label}</div>
                  {row.cells.map((c, j) => (
                    <div key={`${i}-${j}`} className="cell" data-h={String(c.h)}>
                      {c.n}
                    </div>
                  ))}
                </span>
              ))}
              <div className="lbl" />
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={`d-${i}`} className="lbl" style={{ textAlign: 'center', justifyContent: 'center' }}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Top barrios por engagement</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Barrio</th>
                <th>Casos</th>
                <th>Voces</th>
                <th>Padrinos</th>
                <th>Resolución</th>
                <th>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {TOP_BARRIOS.map((b) => (
                <tr key={b.pos}>
                  <td><strong>{b.pos}</strong></td>
                  <td><strong>{b.nombre}</strong></td>
                  <td>{b.casos}</td>
                  <td>{b.voces}</td>
                  <td>{b.padrinos}</td>
                  <td>
                    <span className={`badge badge-${b.badge}`}>{b.resol}%</span>
                  </td>
                  <td>
                    <b.tendIcon style={{ width: 14, height: 14, color: b.tendColor }} /> {b.tend}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
