import { Link } from 'react-router-dom';
import {
  Download,
  Plus,
  Building2,
  User,
  Package,
  CircleDollarSign,
  HardHat,
  Megaphone,
  GraduationCap,
  Droplets,
  Link as LinkIcon,
  Calendar,
  Clock,
  TrendingUp,
  Minus,
  Edit,
  Check,
  X,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';

import '../../styles/page-admin-padrinos.css';

interface PadrinoFull {
  Icon: typeof Building2;
  variant?: 'luz' | 'educ' | 'agua' | 'social';
  nombre: string;
  meta: string;
  casos?: number;
  aporteIcon?: typeof Package;
  aporteIconColor?: string;
  aporte?: string;
  desde?: string;
  pendiente?: boolean;
}

const ACTIVOS: PadrinoFull[] = [
  {
    Icon: Building2,
    nombre: 'Ferretería Don Iván S.A.S.',
    meta: 'Iván Mejía · Gerente · +57 301 245 8890 · ivan@ferreteriadi.co',
    casos: 3,
    aporteIcon: Package,
    aporteIconColor: 'var(--cat-infraestructura)',
    aporte: 'Materiales',
    desde: 'mar 2026',
  },
  {
    Icon: Megaphone,
    variant: 'luz',
    nombre: 'Panadería Atlántico',
    meta: 'María Estela Romero · Propietaria · +57 312 808 1991',
    casos: 2,
    aporteIcon: Megaphone,
    aporteIconColor: 'var(--cat-luz)',
    aporte: 'Difusión + refrigerios',
    desde: 'feb 2026',
  },
  {
    Icon: GraduationCap,
    variant: 'educ',
    nombre: 'Universidad del Atlántico · ext. Soledad',
    meta: 'Dr. Carlos Pacheco · Decanato · +57 318 555 0021',
    casos: 4,
    aporteIcon: CircleDollarSign,
    aporteIconColor: 'var(--cat-luz)',
    aporte: '$2.5M',
    desde: 'ene 2026',
  },
  {
    Icon: Droplets,
    variant: 'agua',
    nombre: 'Olímpica S.A · Sede Hipódromo',
    meta: 'Marcela Bermúdez · RSE · marcela@olimpica.co',
    casos: 2,
    aporteIcon: CircleDollarSign,
    aporteIconColor: 'var(--cat-luz)',
    aporte: '$8M',
    desde: 'dic 2025',
  },
];

const CASOS_SIN_PADRINO = [
  { titulo: 'Sin ambulancia nocturna', folio: 'CS-2026-0156', barrio: 'San Vicente', dias: 62, necesita: 'Mano de obra · coordinación' },
  { titulo: 'Hundimiento de la calle 17', folio: 'CS-2026-0193', barrio: 'La Candelaria', dias: 38, necesita: 'Materiales · cemento + asfalto' },
  { titulo: 'Manada de perros agresiva', folio: 'CS-2026-0181', barrio: 'El Hipódromo', dias: 31, necesita: 'Coordinar con Bienestar Animal' },
];

export function PadrinosAdmin() {
  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Padrinos</span>
          </>
        }
        title="Padrinos · 19 activos · $24M comprometidos"
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
            <div className="n">19</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+2 nuevos este mes</div>
          </div>
          <div className="stat-mini accent-teal">
            <div className="l">Aporte total comprometido</div>
            <div className="n">$24.2M</div>
            <div className="d up"><TrendingUp style={{ width: 12, height: 12 }} />+$4.2M Q1</div>
          </div>
          <div className="stat-mini accent-progress">
            <div className="l">Casos apadrinados</div>
            <div className="n">31</div>
            <div className="d flat"><LinkIcon style={{ width: 12, height: 12 }} />1.6 por padrino · prom.</div>
          </div>
          <div className="stat-mini accent-social">
            <div className="l">Solicitudes pendientes</div>
            <div className="n">4</div>
            <div className="d flat"><Minus style={{ width: 12, height: 12 }} />esperando coordinar</div>
          </div>
        </div>

        <div className="row row-3 wrap" style={{ gap: 8 }}>
          <button type="button" className="chip chip-active">Todos <span className="chip-count">19</span></button>
          <button type="button" className="chip">
            <Building2 style={{ color: 'var(--state-resolved)' }} />Empresas <span className="chip-count">12</span>
          </button>
          <button type="button" className="chip">
            <User style={{ color: 'var(--biss-teal)' }} />Personas <span className="chip-count">7</span>
          </button>
          <button type="button" className="chip">
            <Package style={{ color: 'var(--cat-infraestructura)' }} />Materiales
          </button>
          <button type="button" className="chip">
            <CircleDollarSign style={{ color: 'var(--cat-luz)' }} />Dinero
          </button>
          <button type="button" className="chip">
            <HardHat style={{ color: 'var(--state-progress-ink)' }} />Mano de obra
          </button>
        </div>

        <div className="admin-card" style={{ padding: '18px 20px' }}>
          <h2 style={{ marginBottom: 14 }}>Padrinos activos</h2>

          {ACTIVOS.map((p) => {
            const AporteIcon = p.aporteIcon;
            return (
              <div key={p.nombre} className="padrino-card-full">
                <div className={`av${p.variant ? ` ${p.variant}` : ''}`}>
                  <p.Icon />
                </div>
                <div>
                  <div className="name">{p.nombre}</div>
                  <div className="meta">{p.meta}</div>
                  <div className="stats">
                    {p.casos !== undefined && (
                      <span>
                        <LinkIcon style={{ width: 13, height: 13, color: 'var(--biss-teal)' }} />
                        <strong>{p.casos}</strong> casos
                      </span>
                    )}
                    {AporteIcon && p.aporte && (
                      <span>
                        <AporteIcon style={{ width: 13, height: 13, color: p.aporteIconColor }} />
                        {p.aporte}
                      </span>
                    )}
                    {p.desde && (
                      <span>
                        <Calendar style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />
                        Desde {p.desde}
                      </span>
                    )}
                  </div>
                </div>
                <div className="row row-2">
                  <span className="badge badge-resolved"><span className="dot" />Activo</span>
                  <button type="button" className="btn btn-ghost btn-sm" aria-label="Editar">
                    <Edit style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pendiente */}
          <div
            className="padrino-card-full"
            style={{ borderColor: 'var(--state-progress-border)', background: 'var(--state-progress-bg)' }}
          >
            <div
              className="av"
              style={{ background: 'var(--state-progress)', color: 'var(--state-progress-ink)' }}
            >
              <User />
            </div>
            <div>
              <div className="name">Roberto Martínez · persona</div>
              <div className="meta">+57 313 444 0099 · Solicita coordinar para aportar mano de obra fin de semana</div>
              <div className="stats">
                <span>
                  <Clock style={{ width: 13, height: 13, color: 'var(--state-progress-ink)' }} />
                  Esperando coordinar
                </span>
                <span>
                  <Calendar style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />
                  Solicitud hace 3 días
                </span>
              </div>
            </div>
            <div className="row row-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  ['--btn-bg' as never]: 'var(--state-resolved)',
                  ['--btn-border' as never]: 'var(--state-resolved)',
                  ['--btn-bg-hover' as never]: '#0E8A50',
                }}
              >
                <Check />Coordinar
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ ['--btn-ink' as never]: 'var(--state-critical)' }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <h2>Casos sin padrino · alta prioridad</h2>
          <div className="card-sub" style={{ marginBottom: 14 }}>
            Críticos abiertos hace +30 días sin padrinazgo asignado.
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Caso</th>
                <th>Barrio</th>
                <th>Días abierto</th>
                <th>Necesita</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {CASOS_SIN_PADRINO.map((c) => (
                <tr key={c.folio}>
                  <td>
                    <strong>{c.titulo}</strong>
                    <br />
                    <span className="row-meta mono">{c.folio}</span>
                  </td>
                  <td>{c.barrio}</td>
                  <td>
                    <span className="badge badge-critical">{c.dias} días</span>
                  </td>
                  <td>{c.necesita}</td>
                  <td>
                    <button type="button" className="btn btn-primary btn-sm">
                      Buscar padrino
                    </button>
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
