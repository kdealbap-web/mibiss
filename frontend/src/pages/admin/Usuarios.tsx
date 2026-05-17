import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  UserPlus,
  Users,
  Shield,
  Crown,
  Eye,
  Edit,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { SearchInput, FilterChip } from '../../components/ui';
import { useUsuariosCms, useCiudadanos } from '../../hooks/useUsuarios';
import { useBarrios } from '../../hooks/useBarrios';
import { formatRelative, initials } from '../../lib/format';
import type { Ciudadano, UsuarioCms } from '../../types/biss';

type Tab = 'cms' | 'ciudadanos';

export function Usuarios() {
  const [tab, setTab] = useState<Tab>('cms');
  const [q, setQ] = useState('');
  const { data: cmsUsers = [], isLoading: cmsLoading } = useUsuariosCms();
  const { data: ciudadanos = [], isLoading: cLoading } = useCiudadanos();
  const { data: barrios = [] } = useBarrios();

  const barrioById = useMemo(() => {
    const m: Record<number, string> = {};
    barrios.forEach((b) => (m[b.id] = b.nombre));
    return m;
  }, [barrios]);

  const cmsFiltered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cmsUsers;
    return cmsUsers.filter(
      (u) => u.nombre.toLowerCase().includes(t) || u.email.toLowerCase().includes(t),
    );
  }, [cmsUsers, q]);

  const ciudFiltered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return ciudadanos;
    return ciudadanos.filter((c) =>
      `${c.nombres} ${c.apellidos} ${c.telefono_celular} ${c.email}`.toLowerCase().includes(t),
    );
  }, [ciudadanos, q]);

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Sistema</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Usuarios</span>
          </>
        }
        title={`Usuarios · ${ciudadanos.length} ciudadanos · ${cmsUsers.length} CMS`}
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
          <FilterChip
            active={tab === 'cms'}
            count={cmsUsers.length}
            icon={<Shield style={{ color: 'var(--cat-social)' }} />}
            label="Equipo CMS"
            onClick={() => setTab('cms')}
          />
          <FilterChip
            active={tab === 'ciudadanos'}
            count={ciudadanos.length}
            icon={<Users style={{ color: 'var(--biss-teal)' }} />}
            label="Ciudadanos"
            onClick={() => setTab('ciudadanos')}
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
              placeholder="Buscar por nombre, email o teléfono…"
              aria-label="Buscar usuarios"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {tab === 'cms' && (
            <>
              {cmsLoading && <p className="caption" style={{ padding: 20 }}>Un segundo…</p>}
              {!cmsLoading && cmsFiltered.length === 0 && (
                <p className="caption" style={{ padding: 20 }}>
                  Sin editores registrados.
                </p>
              )}
              {cmsFiltered.length > 0 && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Última actividad</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmsFiltered.map((u) => (
                      <CmsRow key={u.id} u={u} />
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'ciudadanos' && (
            <>
              {cLoading && <p className="caption" style={{ padding: 20 }}>Un segundo…</p>}
              {!cLoading && ciudFiltered.length === 0 && (
                <p className="caption" style={{ padding: 20 }}>
                  Sin ciudadanos registrados.
                </p>
              )}
              {ciudFiltered.length > 0 && (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ciudadano</th>
                      <th>Barrio</th>
                      <th>Verificado</th>
                      <th>Registrado</th>
                      <th>Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ciudFiltered.map((c) => (
                      <CiudadanoRow key={c.id} c={c} barrioNombre={barrioById[c.barrio_id] ?? '—'} />
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function CmsRow({ u }: { u: UsuarioCms }) {
  return (
    <tr>
      <td>
        <div className="row-title">
          <div className="ic-mini" style={{ background: 'var(--biss-teal)' }}>
            {initials(u.nombre)}
          </div>
          <div>
            <div>{u.nombre}</div>
            <div className="row-meta">{u.email}</div>
          </div>
        </div>
      </td>
      <td>
        {u.rol === 'superadmin' || u.rol === 'admin' ? (
          <span className="badge" style={{ background: 'var(--cat-social-bg)', color: 'var(--cat-social)' }}>
            <Crown />
            {u.rol === 'superadmin' ? 'Superadmin' : 'Admin'}
          </span>
        ) : (
          <span className="badge" style={{ background: 'var(--biss-teal-50)', color: 'var(--biss-teal-900)' }}>
            <Shield />Editor
          </span>
        )}
      </td>
      <td>
        <span className="mono" style={{ fontSize: 12 }}>{formatRelative(u.creado_en)}</span>
      </td>
      <td className="action-cell">
        <button type="button" aria-label="Ver perfil">
          <Eye style={{ width: 14, height: 14 }} />
        </button>
        <button type="button" aria-label="Editar">
          <Edit style={{ width: 14, height: 14 }} />
        </button>
      </td>
    </tr>
  );
}

function CiudadanoRow({ c, barrioNombre }: { c: Ciudadano; barrioNombre: string }) {
  const nombre = `${c.nombres} ${c.apellidos}`.trim();
  return (
    <tr>
      <td>
        <div className="row-title">
          <div className="ic-mini" style={{ background: 'var(--cat-agua)' }}>
            {initials(nombre)}
          </div>
          <div>
            <div>{nombre}</div>
            <div className="row-meta">{c.email}</div>
          </div>
        </div>
      </td>
      <td>{barrioNombre}</td>
      <td>
        {c.verificado_email ? (
          <span className="badge badge-resolved"><span className="dot" />Sí</span>
        ) : (
          <span className="badge"><span className="dot" />Pendiente</span>
        )}
      </td>
      <td>
        <span className="mono" style={{ fontSize: 12 }}>{formatRelative(c.creado_en)}</span>
      </td>
      <td className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
        {c.telefono_celular ?? '—'}
      </td>
    </tr>
  );
}

