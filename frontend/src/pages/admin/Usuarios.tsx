import { Link } from 'react-router-dom';
import {
  Download,
  UserPlus,
  Users,
  Shield,
  AlertCircle,
  Search,
  Crown,
  User,
  Eye,
  Edit,
  Ban,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';

type Estado = 'activo' | 'revisar';

interface UsuarioRow {
  iniciales: string;
  iconBg: string;
  nombre: string;
  contacto: string;
  rol: 'admin' | 'editor' | 'ciudadano';
  barrio: string;
  casos: string;
  ultima: string;
  estado: Estado;
  acciones: ('ver' | 'editar' | 'suspender' | 'promover')[];
}

const ROWS: UsuarioRow[] = [
  {
    iniciales: 'KB',
    iconBg: 'var(--cat-social)',
    nombre: 'Kevin Balvuena',
    contacto: 'kevin@biss.gov.co · +57 318 444 0001',
    rol: 'admin',
    barrio: '—',
    casos: '—',
    ultima: 'ahora',
    estado: 'activo',
    acciones: ['ver', 'editar'],
  },
  {
    iniciales: 'LM',
    iconBg: 'var(--biss-teal)',
    nombre: 'Lucía Mendoza',
    contacto: 'lucia@biss.gov.co · +57 301 222 1888',
    rol: 'editor',
    barrio: '—',
    casos: '—',
    ultima: 'hace 2h',
    estado: 'activo',
    acciones: ['ver', 'editar', 'suspender'],
  },
  {
    iniciales: 'EP',
    iconBg: 'var(--cat-agua)',
    nombre: 'Édgar Polo',
    contacto: '+57 301 245 8890',
    rol: 'ciudadano',
    barrio: 'Soledad 2000',
    casos: '3',
    ultima: 'hace 4h',
    estado: 'activo',
    acciones: ['ver', 'promover'],
  },
  {
    iniciales: 'DP',
    iconBg: 'var(--cat-luz)',
    nombre: 'Diana Pérez',
    contacto: '+57 312 778 4521',
    rol: 'ciudadano',
    barrio: 'Soledad 2000',
    casos: '1',
    ultima: 'hace 1d',
    estado: 'activo',
    acciones: ['ver', 'promover'],
  },
  {
    iniciales: 'JL',
    iconBg: 'var(--state-critical)',
    nombre: 'José L.',
    contacto: '+57 320 411 5577 · reportado 2 veces',
    rol: 'ciudadano',
    barrio: 'Salamanca',
    casos: '7',
    ultima: 'hace 12h',
    estado: 'revisar',
    acciones: ['ver', 'suspender'],
  },
  {
    iniciales: 'RC',
    iconBg: 'var(--cat-medio-ambiente)',
    nombre: 'Rosalba C.',
    contacto: '+57 300 871 1124 · líder JAC',
    rol: 'ciudadano',
    barrio: 'La Candelaria',
    casos: '5',
    ultima: 'hace 30m',
    estado: 'activo',
    acciones: ['ver', 'promover'],
  },
];

function badgeRol(r: UsuarioRow['rol']) {
  if (r === 'admin') {
    return (
      <span className="badge" style={{ background: 'var(--cat-social-bg)', color: 'var(--cat-social)' }}>
        <Crown />Admin
      </span>
    );
  }
  if (r === 'editor') {
    return (
      <span className="badge" style={{ background: 'var(--biss-teal-50)', color: 'var(--biss-teal-900)' }}>
        <Shield />Editor
      </span>
    );
  }
  return (
    <span className="badge">
      <User />Ciudadano
    </span>
  );
}

export function Usuarios() {
  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Sistema</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Usuarios</span>
          </>
        }
        title="Usuarios · 847 ciudadanos · 6 editores"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Download />Exportar
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <UserPlus />Invitar editor
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 8 }}>
          <button type="button" className="chip chip-active">Todos <span className="chip-count">853</span></button>
          <button type="button" className="chip">
            <Users style={{ color: 'var(--biss-teal)' }} />Ciudadanos <span className="chip-count">847</span>
          </button>
          <button type="button" className="chip">
            <Shield style={{ color: 'var(--cat-social)' }} />Editores <span className="chip-count">6</span>
          </button>
          <button type="button" className="chip">
            <AlertCircle style={{ color: 'var(--state-critical)' }} />Reportados <span className="chip-count">2</span>
          </button>
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
            <div className="map-search-wrap" style={{ flex: 1, maxWidth: 360 }}>
              <Search strokeWidth={2.2} />
              <input type="search" placeholder="Buscar por nombre, celular o barrio…" />
            </div>
            <select
              className="field-select"
              style={{ minHeight: 38, padding: '6px 14px', fontSize: 13, width: 'auto' }}
              defaultValue="Todos los barrios"
            >
              <option>Todos los barrios</option>
              <option>Soledad 2000</option>
              <option>Don Bosco</option>
            </select>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" style={{ accentColor: 'var(--biss-teal)' }} />
                </th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Barrio</th>
                <th>Casos</th>
                <th>Última actividad</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((u) => (
                <tr key={u.nombre}>
                  <td>
                    <input type="checkbox" style={{ accentColor: 'var(--biss-teal)' }} />
                  </td>
                  <td>
                    <div className="row-title">
                      <div className="ic-mini" style={{ background: u.iconBg }}>
                        {u.iniciales}
                      </div>
                      <div>
                        <div>{u.nombre}</div>
                        <div className="row-meta">{u.contacto}</div>
                      </div>
                    </div>
                  </td>
                  <td>{badgeRol(u.rol)}</td>
                  <td>{u.barrio}</td>
                  <td><strong>{u.casos}</strong></td>
                  <td>
                    <span className="mono" style={{ fontSize: 12 }}>{u.ultima}</span>
                  </td>
                  <td>
                    {u.estado === 'activo' ? (
                      <span className="badge badge-resolved"><span className="dot" />Activo</span>
                    ) : (
                      <span className="badge badge-critical"><span className="dot" />Revisar</span>
                    )}
                  </td>
                  <td className="action-cell">
                    {u.acciones.includes('ver') && (
                      <button type="button" aria-label="Ver perfil">
                        <Eye style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                    {u.acciones.includes('editar') && (
                      <button type="button" aria-label="Editar">
                        <Edit style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                    {u.acciones.includes('promover') && (
                      <button type="button" aria-label="Promover">
                        <ArrowUp style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                    {u.acciones.includes('suspender') && (
                      <button type="button" className="danger" aria-label="Suspender">
                        <Ban style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row row-3" style={{ justifyContent: 'space-between' }}>
          <span className="caption">Mostrando {ROWS.length} de 853 usuarios</span>
          <div className="row row-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled>
              <ChevronLeft />
            </button>
            <span className="caption" style={{ padding: '0 8px' }}>1 / 142</span>
            <button type="button" className="btn btn-ghost btn-sm">
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
