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
  Ban,
  Undo2,
  Mail,
  AlertTriangle,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { SearchInput, FilterChip, Modal, Select } from '../../components/ui';
import { useUsuariosCms, useCiudadanos } from '../../hooks/useUsuarios';
import {
  useInvitarEditor,
  useSuspenderCiudadano,
  useReactivarCiudadano,
} from '../../hooks/mutations/useUsuariosCrud';
import { useBarrios } from '../../hooks/useBarrios';
import { useMiRol } from '../../hooks/useMiCuenta';
import { formatRelative, initials } from '../../lib/format';
import type { Ciudadano, UsuarioCms } from '../../types/biss';

type Tab = 'cms' | 'ciudadanos';

export function Usuarios() {
  const [tab, setTab] = useState<Tab>('cms');
  const [q, setQ] = useState('');
  const { data: cmsUsers = [], isLoading: cmsLoading } = useUsuariosCms();
  const { data: ciudadanos = [], isLoading: cLoading } = useCiudadanos();
  const { data: barrios = [] } = useBarrios();
  const { data: miRol } = useMiRol();
  const isAdmin = miRol === 'admin' || miRol === 'superadmin';
  const [invitarOpen, setInvitarOpen] = useState(false);
  const [suspendCtx, setSuspendCtx] = useState<Ciudadano | null>(null);
  const [reactivarCtx, setReactivarCtx] = useState<Ciudadano | null>(null);
  const invitarMut = useInvitarEditor();
  const suspenderMut = useSuspenderCiudadano();
  const reactivarMut = useReactivarCiudadano();
  const [invitarForm, setInvitarForm] = useState({ email: '', nombre: '', rol: 'editor' as 'editor' | 'admin' });
  const [invitarErr, setInvitarErr] = useState<string | null>(null);
  const [invitarOk, setInvitarOk] = useState<string | null>(null);
  const [suspendMotivo, setSuspendMotivo] = useState('');

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
      `${c.nombres} ${c.apellidos} ${c.telefono_celular ?? ''} ${c.email}`.toLowerCase().includes(t),
    );
  }, [ciudadanos, q]);

  const submitInvitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvitarErr(null);
    setInvitarOk(null);
    try {
      const res = await invitarMut.mutateAsync(invitarForm);
      setInvitarOk(`Invitación enviada a ${res.email}. Recibirá un magic link por correo.`);
      setInvitarForm({ email: '', nombre: '', rol: 'editor' });
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err);
      if (/usuario_existe|already.*registered/i.test(msg)) {
        setInvitarErr('Ese email ya tiene cuenta. No se invitó.');
      } else if (/no_autorizado/i.test(msg)) {
        setInvitarErr('Solo admin/superadmin pueden invitar editores.');
      } else {
        setInvitarErr('No pudimos invitar. ' + msg);
      }
    }
  };

  const confirmSuspender = async () => {
    if (!suspendCtx) return;
    try {
      await suspenderMut.mutateAsync({ id: suspendCtx.id, motivo: suspendMotivo });
      setSuspendCtx(null);
      setSuspendMotivo('');
    } catch {
      // mantener modal abierto, mutation guarda error
    }
  };

  const confirmReactivar = async () => {
    if (!reactivarCtx) return;
    try {
      await reactivarMut.mutateAsync(reactivarCtx.id);
      setReactivarCtx(null);
    } catch {
      // idem
    }
  };

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
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setInvitarErr(null);
                setInvitarOk(null);
                setInvitarOpen(true);
              }}
              disabled={!isAdmin}
              title={isAdmin ? 'Invitar editor por email' : 'Solo admin/superadmin'}
            >
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
                      <th>Estado</th>
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
                      {isAdmin && <th style={{ textAlign: 'right' }}>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {ciudFiltered.map((c) => (
                      <CiudadanoRow
                        key={c.id}
                        c={c}
                        barrioNombre={barrioById[c.barrio_id] ?? '—'}
                        canModerate={isAdmin}
                        onSuspender={() => setSuspendCtx(c)}
                        onReactivar={() => setReactivarCtx(c)}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {/* === Modal: Invitar editor === */}
      <Modal
        open={invitarOpen}
        onClose={() => setInvitarOpen(false)}
        title="Invitar editor"
        description="Recibirá un magic link por email. Setea su contraseña al abrirlo."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setInvitarOpen(false)}>
              Cancelar
            </button>
            <button
              type="submit"
              form="form-invitar"
              className="btn btn-primary btn-sm"
              disabled={invitarMut.isPending}
            >
              <Mail size={14} />
              {invitarMut.isPending ? 'Enviando…' : 'Enviar invitación'}
            </button>
          </>
        }
      >
        <form id="form-invitar" onSubmit={submitInvitar} style={{ display: 'grid', gap: 12 }}>
          <div className="mini-field">
            <label htmlFor="inv-email">Email del nuevo editor</label>
            <input
              id="inv-email"
              type="email"
              autoComplete="off"
              value={invitarForm.email}
              onChange={(e) => setInvitarForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="nuevo@biss.gov.co"
              required
            />
          </div>
          <div className="mini-field">
            <label htmlFor="inv-nombre">Nombre completo</label>
            <input
              id="inv-nombre"
              type="text"
              value={invitarForm.nombre}
              onChange={(e) => setInvitarForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej. María Pérez"
              required
              minLength={2}
            />
          </div>
          <div className="mini-field">
            <label htmlFor="inv-rol">Rol</label>
            <Select
              id="inv-rol"
              value={invitarForm.rol}
              onChange={(e) =>
                setInvitarForm((f) => ({ ...f, rol: e.target.value as 'editor' | 'admin' }))
              }
              options={[
                { value: 'editor', label: 'Editor (modera contenido)' },
                { value: 'admin', label: 'Admin (modera + configura)' },
              ]}
            />
          </div>
          {invitarErr && (
            <div className="alert alert-critical" style={{ padding: '8px 10px' }} role="alert">
              <AlertTriangle className="alert-icon" style={{ width: 14, height: 14 }} />
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12 }}>{invitarErr}</div>
              </div>
            </div>
          )}
          {invitarOk && (
            <div
              className="alert"
              style={{
                background: 'var(--state-resolved-bg)',
                border: '1px solid var(--state-resolved-border)',
                padding: '8px 10px',
              }}
              role="status"
            >
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12, color: '#065F46' }}>{invitarOk}</div>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* === Modal: Suspender ciudadano === */}
      <Modal
        open={suspendCtx !== null}
        onClose={() => { setSuspendCtx(null); setSuspendMotivo(''); }}
        title={`Suspender a ${suspendCtx?.nombres ?? ''} ${suspendCtx?.apellidos ?? ''}`}
        description="El ciudadano deja de poder reportar casos, sumar testimonios o apadrinar. Su perfil queda en lectura."
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setSuspendCtx(null); setSuspendMotivo(''); }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={confirmSuspender}
              disabled={suspenderMut.isPending || suspendMotivo.trim().length < 3}
            >
              <Ban size={14} />
              {suspenderMut.isPending ? 'Suspendiendo…' : 'Suspender'}
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="mini-field">
            <label htmlFor="susp-motivo">Motivo (interno, no se envía al ciudadano)</label>
            <textarea
              id="susp-motivo"
              value={suspendMotivo}
              onChange={(e) => setSuspendMotivo(e.target.value)}
              placeholder="Ej. spam reiterado, lenguaje irrespetuoso, reportes falsos."
              style={{ minHeight: 80 }}
              required
              minLength={3}
            />
          </div>
          {suspenderMut.error && (
            <div className="alert alert-critical" style={{ padding: '8px 10px' }} role="alert">
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12 }}>
                  {String(suspenderMut.error.message)}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* === Modal: Reactivar ciudadano === */}
      <Modal
        open={reactivarCtx !== null}
        onClose={() => setReactivarCtx(null)}
        title={`Reactivar a ${reactivarCtx?.nombres ?? ''} ${reactivarCtx?.apellidos ?? ''}`}
        description="Vuelve a poder reportar, comentar y apadrinar como antes."
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setReactivarCtx(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={confirmReactivar}
              disabled={reactivarMut.isPending}
            >
              <Undo2 size={14} />
              {reactivarMut.isPending ? 'Reactivando…' : 'Reactivar'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--ink-strong)' }}>
          ¿Confirmas que vuelves a darle acceso a este ciudadano?
        </p>
        {reactivarMut.error && (
          <div className="alert alert-critical" style={{ padding: '8px 10px', marginTop: 10 }} role="alert">
            <div className="alert-body">
              <div className="alert-text" style={{ fontSize: 12 }}>
                {String(reactivarMut.error.message)}
              </div>
            </div>
          </div>
        )}
      </Modal>
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
      <td>
        {u.activo ? (
          <span className="badge badge-resolved"><span className="dot" />Activo</span>
        ) : (
          <span className="badge"><span className="dot" />Inactivo</span>
        )}
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

function CiudadanoRow({
  c,
  barrioNombre,
  canModerate,
  onSuspender,
  onReactivar,
}: {
  c: Ciudadano;
  barrioNombre: string;
  canModerate: boolean;
  onSuspender: () => void;
  onReactivar: () => void;
}) {
  const nombre = `${c.nombres} ${c.apellidos}`.trim();
  const suspendido = c.eliminado_en !== null;
  return (
    <tr style={suspendido ? { opacity: 0.55 } : undefined}>
      <td>
        <div className="row-title">
          <div className="ic-mini" style={{ background: 'var(--cat-agua)' }}>
            {initials(nombre)}
          </div>
          <div>
            <div style={{ textDecoration: suspendido ? 'line-through' : 'none' }}>{nombre}</div>
            <div className="row-meta">{c.email}</div>
          </div>
        </div>
      </td>
      <td>{barrioNombre}</td>
      <td>
        {suspendido ? (
          <span className="badge" style={{ background: 'var(--state-critical-bg)', color: 'var(--state-critical)' }}>
            <Ban size={12} />Suspendido
          </span>
        ) : c.verificado_email ? (
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
      {canModerate && (
        <td className="action-cell">
          {suspendido ? (
            <button type="button" aria-label="Reactivar ciudadano" onClick={onReactivar}>
              <Undo2 style={{ width: 14, height: 14 }} />
            </button>
          ) : (
            <button
              type="button"
              className="danger"
              aria-label="Suspender ciudadano"
              onClick={onSuspender}
            >
              <Ban style={{ width: 14, height: 14 }} />
            </button>
          )}
        </td>
      )}
    </tr>
  );
}

