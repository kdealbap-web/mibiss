import { Link } from 'react-router-dom';
import {
  Download,
  Inbox,
  AlertTriangle,
  TrendingUp,
  Minus,
  AlertCircle,
  MessageSquareQuote,
  CheckCircle2,
  HandHeart,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';

const CAT_BARS = [
  { codigo: 'infraestructura', nombre: 'Infraestructura', count: 36, pct: 100 },
  { codigo: 'agua', nombre: 'Agua', count: 28, pct: 78 },
  { codigo: 'luz', nombre: 'Luz', count: 19, pct: 53 },
  { codigo: 'social', nombre: 'Social', count: 18, pct: 50 },
  { codigo: 'medio-ambiente', nombre: 'Medio ambiente', count: 14, pct: 39 },
];

const TOP_BARRIOS = [
  { pos: 1, nombre: 'Soledad 2000', acciones: 31 },
  { pos: 2, nombre: 'Don Bosco', acciones: 24 },
  { pos: 3, nombre: 'La Candelaria', acciones: 19 },
  { pos: 4, nombre: 'El Hipódromo', acciones: 14 },
  { pos: 5, nombre: 'Salamanca', acciones: 11 },
];

export function Dashboard() {
  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            Operación / <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Dashboard</span>
          </>
        }
        title="Buenos días, Kevin"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Download />Exportar
            </button>
            <Link className="btn btn-primary btn-sm" to="/admin/solicitudes">
              <Inbox />Revisar cola (18)
            </Link>
          </>
        }
      />

      <div className="admin-page">
        <div className="alert alert-warning">
          <AlertTriangle className="alert-icon" />
          <div className="alert-body">
            <div className="alert-title">18 solicitudes esperando moderación</div>
            <div className="alert-text">
              La cola creció 32% esta semana.{' '}
              <Link to="/admin/solicitudes" style={{ fontWeight: 700, color: '#92400E' }}>
                Revisarlas →
              </Link>
            </div>
          </div>
        </div>

        <div className="admin-stats">
          <div className="stat-mini accent-critical">
            <div className="l">Críticos abiertos</div>
            <div className="n">23</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+4 esta semana</div>
          </div>
          <div className="stat-mini accent-progress">
            <div className="l">En gestión</div>
            <div className="n">64</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />sin cambios</div>
          </div>
          <div className="stat-mini accent-resolved">
            <div className="l">Resueltos / mes</div>
            <div className="n">12</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+3 vs mayo</div>
          </div>
          <div className="stat-mini accent-teal">
            <div className="l">Ciudadanos activos</div>
            <div className="n">847</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+62 nuevos</div>
          </div>
          <div className="stat-mini accent-social">
            <div className="l">Testimonios</div>
            <div className="n">312</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+28 esta semana</div>
          </div>
          <div className="stat-mini accent-resolved">
            <div className="l">Padrinos vivos</div>
            <div className="n">19</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+2 nuevos</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>Actividad reciente</h2>
                <div className="card-sub">Últimas 24 horas</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm">
                Ver toda <ArrowRight />
              </button>
            </div>
            <div className="feed">
              <div className="feed-item">
                <div className="ic critical"><AlertCircle /></div>
                <div className="what">
                  <strong>Marlén J.</strong> reportó <strong>Sin agua los lunes en toda la manzana</strong> · Soledad 2000 · marcado como crítico
                </div>
                <div className="when">hace 2h</div>
              </div>
              <div className="feed-item">
                <div className="ic social"><MessageSquareQuote /></div>
                <div className="what">
                  <strong>Diana Pérez</strong> sumó testimonio al caso <strong>CS-2026-0142</strong> · Cráter en calle 30 · esperando moderación
                </div>
                <div className="when">hace 3h</div>
              </div>
              <div className="feed-item">
                <div className="ic resolved"><CheckCircle2 /></div>
                <div className="what">
                  <strong>CS-2025-0287</strong> · Alumbrado restablecido en Don Bosco · cerrado por cuadrilla
                </div>
                <div className="when">hace 5h</div>
              </div>
              <div className="feed-item">
                <div className="ic"><HandHeart /></div>
                <div className="what">
                  <strong>Ferretería Don Iván</strong> apadrinó <strong>Cráter en calle 30</strong> · aporta asfalto en frío + herramienta
                </div>
                <div className="when">hace 7h</div>
              </div>
              <div className="feed-item">
                <div className="ic critical"><AlertCircle /></div>
                <div className="what">
                  <strong>José L.</strong> reportó <strong>Hundimiento de la calle 17</strong> · Salamanca · marcado como crítico
                </div>
                <div className="when">hace 9h</div>
              </div>
              <div className="feed-item">
                <div className="ic"><UserPlus /></div>
                <div className="what">12 nuevos ciudadanos registrados · todos de la zona occidental</div>
                <div className="when">hace 14h</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            <div className="admin-card">
              <h2>Por categoría · este mes</h2>
              <div className="card-sub">Casos abiertos por tipo</div>
              <div className="stack stack-3" style={{ marginTop: 6 }}>
                {CAT_BARS.map((c) => (
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
              <h2>Top barrios con más actividad</h2>
              <div className="card-sub">Última semana · por casos + testimonios</div>
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                {TOP_BARRIOS.map((b, i) => (
                  <li
                    key={b.pos}
                    className="row row-3"
                    style={{
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: i < TOP_BARRIOS.length - 1 ? '1px solid var(--border)' : 0,
                    }}
                  >
                    <span><strong>{b.pos}.</strong> {b.nombre}</span>
                    <span className="mono" style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}>
                      {b.acciones} acciones
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
