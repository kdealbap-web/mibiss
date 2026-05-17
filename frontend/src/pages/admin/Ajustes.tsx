import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Bell,
  Sliders,
  Plug,
  Download,
  Save,
  LogOut,
  Mail,
  KeyRound,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { Toggle } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { APP_CONFIG } from '../../lib/config';
import { useSession, useMiRol } from '../../hooks/useMiCuenta';

interface ConfigRow {
  key: string;
  value: unknown;
}

const SECCIONES = [
  { id: 'perfil', label: 'Mi perfil', Icon: User },
  { id: 'seguridad', label: 'Seguridad', Icon: Lock },
  { id: 'notificaciones', label: 'Notificaciones', Icon: Bell },
  { id: 'flujos', label: 'Flujos & moderación', Icon: Sliders },
  { id: 'integraciones', label: 'Integraciones', Icon: Plug },
  { id: 'exportar', label: 'Exportar datos', Icon: Download },
] as const;

type SeccionId = (typeof SECCIONES)[number]['id'];

export function Ajustes() {
  const navigate = useNavigate();
  const session = useSession();
  const { data: rol } = useMiRol();
  const isAdmin = rol === 'admin' || rol === 'superadmin';
  const [activa, setActiva] = useState<SeccionId>('perfil');
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data, error } = await supabase
        .from('config_app')
        .select('key,value');
      if (!error && data) {
        const next: Record<string, unknown> = {};
        (data as ConfigRow[]).forEach((r) => { next[r.key] = r.value; });
        setConfig(next);
      }
      setLoading(false);
    })();
  }, [session]);

  const setKey = async (key: string, value: unknown) => {
    setConfig((c) => ({ ...c, [key]: value }));
    setSaving(key);
    try {
      const { error } = await supabase
        .from('config_app')
        .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: session?.user?.id ?? null });
      if (error) throw error;
      setToast({ kind: 'ok', text: 'Guardado' });
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      setToast({ kind: 'err', text: /row-level|policy/i.test(msg) ? 'No tienes permiso para cambiar esto.' : 'No se pudo guardar.' });
    } finally {
      setSaving(null);
      setTimeout(() => setToast(null), 2200);
    }
  };

  const cerrarSesionesGlobales = async () => {
    const ok = window.confirm('¿Cerrar sesión en todos los dispositivos? Tendrás que volver a entrar en cada uno.');
    if (!ok) return;
    await supabase.auth.signOut({ scope: 'global' });
    navigate('/login', { replace: true });
  };

  const palabrasFiltradas = useMemo(() => {
    const v = config['moderacion.palabras_filtradas'];
    if (Array.isArray(v)) return (v as string[]).join('\n');
    return '';
  }, [config]);

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Sistema</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Ajustes</span>
          </>
        }
        title="Ajustes"
      />

      <div className="admin-page" style={{ display: 'grid', gap: 24, gridTemplateColumns: '220px 1fr', alignItems: 'start' }}>
        <nav
          aria-label="Secciones de ajustes"
          style={{
            position: 'sticky',
            top: 80,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 10,
          }}
        >
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiva(s.id)}
              className="side-link"
              data-active={activa === s.id ? 'true' : undefined}
              style={{
                background: activa === s.id ? 'var(--biss-teal-50)' : 'transparent',
                color: activa === s.id ? 'var(--biss-teal-900)' : 'var(--ink-strong)',
                fontSize: 13,
                padding: '8px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                border: 0,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <s.Icon size={16} />
              {s.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'grid', gap: 20 }}>
          {loading && <div className="caption">Cargando configuración…</div>}

          {!loading && activa === 'perfil' && (
            <section className="admin-card">
              <h2>Mi perfil</h2>
              <div className="card-sub" style={{ marginBottom: 16 }}>
                Email vinculado a tu sesión actual. El rol se gestiona desde el panel.
              </div>
              <div className="data-grid" style={{ display: 'grid', gap: 10 }}>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="k" style={{ color: 'var(--ink-soft)' }}>Email</span>
                  <span className="v" style={{ fontWeight: 600 }}>{session?.user?.email ?? '—'}</span>
                </div>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="k" style={{ color: 'var(--ink-soft)' }}>Rol</span>
                  <span className="v" style={{ fontWeight: 600 }}>{rol ?? '—'}</span>
                </div>
                <div className="data-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span className="k" style={{ color: 'var(--ink-soft)' }}>User ID</span>
                  <span className="mono" style={{ fontSize: 12 }}>{session?.user?.id ?? '—'}</span>
                </div>
              </div>
            </section>
          )}

          {!loading && activa === 'seguridad' && (
            <section className="admin-card">
              <h2>Seguridad</h2>
              <div className="card-sub" style={{ marginBottom: 16 }}>
                Cambia tu contraseña o cierra todas las sesiones activas.
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <Link to="/recuperar/nueva-contrasena" className="btn btn-secondary" style={{ justifySelf: 'start' }}>
                  <KeyRound size={16} />Cambiar contraseña
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarSesionesGlobales}
                  style={{ justifySelf: 'start' }}
                >
                  <LogOut size={16} />Cerrar todas las sesiones
                </button>
                <Toggle
                  checked={false}
                  onChange={() => {
                    setToast({ kind: 'err', text: 'Auto-logout configurable se habilita en v1.1.' });
                    setTimeout(() => setToast(null), 2200);
                  }}
                  label="Auto-logout tras 30d inactivo"
                  description="Disponible en v1.1 (2FA TOTP también)."
                />
              </div>
            </section>
          )}

          {!loading && activa === 'notificaciones' && (
            <section className="admin-card">
              <h2>Notificaciones</h2>
              <div className="card-sub" style={{ marginBottom: 16 }}>
                Cómo te avisamos de la cola de moderación. Solo por email.
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <Toggle
                  checked={Boolean(config['notificaciones.email_criticos'])}
                  onChange={(v) => setKey('notificaciones.email_criticos', v)}
                  label="Email cuando entre un caso crítico"
                  description="Te llega inmediatamente a tu correo de panel."
                />
                <Toggle
                  checked={Boolean(config['notificaciones.email_resumen'])}
                  onChange={(v) => setKey('notificaciones.email_resumen', v)}
                  label="Resumen diario por email"
                  description="Una vez al día, 7am: solicitudes nuevas, testimonios pendientes."
                />
                <div className="mini-field">
                  <label htmlFor="slack-hook">Webhook de Slack (opcional)</label>
                  <input
                    id="slack-hook"
                    type="url"
                    placeholder="https://hooks.slack.com/services/…"
                    defaultValue={String(config['notificaciones.slack_webhook'] ?? '')}
                    onBlur={(e) => setKey('notificaciones.slack_webhook', e.target.value)}
                  />
                  <span className="hint">
                    Si lo pegas, mandamos alertas al canal. Sin SMS.
                  </span>
                </div>
              </div>
            </section>
          )}

          {!loading && activa === 'flujos' && (
            <section className="admin-card">
              <h2>Flujos & moderación</h2>
              <div className="card-sub" style={{ marginBottom: 16 }}>
                Cómo procesamos solicitudes, testimonios, comentarios.
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <Toggle
                  checked={Boolean(config['moderacion.pre_testimonios'])}
                  onChange={(v) => setKey('moderacion.pre_testimonios', v)}
                  label="Pre-moderar testimonios"
                  description="No se publican hasta que un editor los apruebe."
                />
                <Toggle
                  checked={Boolean(config['moderacion.auto_marcar_criticos'])}
                  onChange={(v) => setKey('moderacion.auto_marcar_criticos', v)}
                  label="Auto-marcar casos como críticos"
                  description="Si llegan ≥3 solicitudes del mismo barrio en 24h, se marcan automáticamente."
                />
                <Toggle
                  checked={Boolean(config['moderacion.comentarios_publicos'])}
                  onChange={(v) => setKey('moderacion.comentarios_publicos', v)}
                  label="Comentarios públicos de vecinos"
                  description="Si lo apagas, solo el equipo BISS deja notas en los casos."
                />
                <div className="mini-field">
                  <label htmlFor="auto-archive">Auto-archivar casos resueltos tras N días</label>
                  <input
                    id="auto-archive"
                    type="number"
                    min={7}
                    max={365}
                    defaultValue={Number(config['moderacion.auto_archivar_dias'] ?? 90)}
                    onBlur={(e) =>
                      setKey('moderacion.auto_archivar_dias', Math.max(7, Math.min(365, Number(e.target.value) || 90)))
                    }
                  />
                </div>
                <div className="mini-field">
                  <label htmlFor="palabras">Palabras filtradas (una por línea)</label>
                  <textarea
                    id="palabras"
                    defaultValue={palabrasFiltradas}
                    onBlur={(e) => {
                      const list = e.target.value
                        .split('\n')
                        .map((s) => s.trim().toLowerCase())
                        .filter(Boolean);
                      setKey('moderacion.palabras_filtradas', list);
                    }}
                    style={{ minHeight: 80, fontFamily: 'var(--font-mono)' }}
                  />
                  <span className="hint">
                    Los testimonios que contengan estas palabras se marcan para revisión manual.
                  </span>
                </div>
                <div className="mini-field" style={{ maxWidth: 200 }}>
                  <label htmlFor="folio-prefix">Prefijo de folio</label>
                  <input
                    id="folio-prefix"
                    type="text"
                    maxLength={4}
                    defaultValue={String(config['folio.prefijo'] ?? 'CS')}
                    onBlur={(e) => setKey('folio.prefijo', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                  />
                  <span className="hint">Default: CS · genera CS-AAAA-NNNN</span>
                </div>
              </div>
            </section>
          )}

          {!loading && activa === 'integraciones' && (
            <section className="admin-card">
              <h2>Integraciones</h2>
              <div className="card-sub" style={{ marginBottom: 16 }}>
                Servicios externos conectados a BISS. Las API keys NO se editan aquí — se cambian
                en los dashboards de cada servicio.
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <IntegrationCard
                  icon={<Mail size={18} />}
                  name="Resend (Email)"
                  status="Conectado"
                  detail={`Dominio: ${APP_CONFIG.url.replace('https://', '')}`}
                  link="https://resend.com/dashboard"
                />
                <IntegrationCard
                  icon={<span style={{ fontSize: 16, fontWeight: 800 }}>R2</span>}
                  name="Cloudflare R2 (Media)"
                  status="Conectado"
                  detail={`Bucket público: ${APP_CONFIG.mediaUrl}`}
                  link="https://dash.cloudflare.com/?to=/:account/r2"
                />
                <IntegrationCard
                  icon={<span style={{ fontSize: 16, fontWeight: 800 }}>📊</span>}
                  name="Plausible (Analytics)"
                  status="Sin conectar"
                  detail="Pendiente — se evalúa post-lanzamiento."
                  disabled
                />
                <IntegrationCard
                  icon={<span style={{ fontSize: 16, fontWeight: 800 }}>#</span>}
                  name="Slack (Alertas)"
                  status={
                    typeof config['notificaciones.slack_webhook'] === 'string' &&
                    (config['notificaciones.slack_webhook'] as string).startsWith('https://')
                      ? 'Configurado'
                      : 'Sin conectar'
                  }
                  detail="Configura el webhook en la sección Notificaciones."
                />
              </div>
            </section>
          )}

          {!loading && activa === 'exportar' && (
            <section className="admin-card">
              <h2>Exportar datos</h2>
              <div className="card-sub" style={{ marginBottom: 16 }}>
                Descarga CSVs para análisis externo o backup.
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <ExportButton table="casos" />
                <ExportButton table="testimonios" />
                <ExportButton table="padrinos" />
                <ExportButton table="solicitudes_caso" />
                {isAdmin && (
                  <ExportButton table="ciudadanos" pii admin />
                )}
                {!isAdmin && (
                  <div className="caption" style={{ fontSize: 12 }}>
                    El backup completo y el export de ciudadanos (incluye email) requieren rol admin.
                  </div>
                )}
              </div>
            </section>
          )}

          {toast && (
            <div
              className={toast.kind === 'ok' ? 'alert' : 'alert alert-critical'}
              role="status"
              style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                padding: '10px 16px',
                background: toast.kind === 'ok' ? 'var(--state-resolved-bg)' : 'var(--state-critical-bg)',
                border: `1px solid ${toast.kind === 'ok' ? 'var(--state-resolved-border)' : 'var(--state-critical-border)'}`,
                color: toast.kind === 'ok' ? '#065F46' : 'var(--state-critical)',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: 'var(--shadow-card)',
                zIndex: 100,
              }}
            >
              {saving && <span style={{ marginRight: 6 }}>⏳</span>}
              {toast.text}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function IntegrationCard({
  icon,
  name,
  status,
  detail,
  link,
  disabled,
}: {
  icon: React.ReactNode;
  name: string;
  status: string;
  detail: string;
  link?: string;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        border: '1px solid var(--border)',
        borderRadius: 12,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--biss-teal-50)',
          color: 'var(--biss-teal-900)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-strong)' }}>{name}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{detail}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span
          className="badge"
          style={{
            background: disabled ? 'var(--surface-sunken)' : 'var(--state-resolved-bg)',
            color: disabled ? 'var(--ink-soft)' : '#065F46',
            fontSize: 11,
          }}
        >
          {status}
        </span>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: 'var(--biss-teal-900)', fontWeight: 700 }}
          >
            Abrir dashboard ↗
          </a>
        )}
      </div>
    </div>
  );
}

function ExportButton({
  table,
  pii,
  admin,
}: {
  table: string;
  pii?: boolean;
  admin?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const onExport = async () => {
    if (pii) {
      const ok = window.confirm(
        '¿Incluir emails y datos personales en el export? Solo si los necesitas para análisis interno.',
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(10000);
      if (error) throw error;
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      if (rows.length === 0) {
        alert('Sin filas para exportar.');
        return;
      }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const v = r[h];
              if (v === null || v === undefined) return '';
              const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
              return `"${s.replace(/"/g, '""')}"`;
            })
            .join(','),
        ),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      alert(/row-level|policy/i.test(msg) ? 'No tienes permiso para exportar esta tabla.' : 'Error al exportar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={onExport}
      disabled={busy}
      style={{ justifySelf: 'start' }}
    >
      <Download size={16} />
      {busy ? 'Exportando…' : `Exportar ${table}`}{pii ? ' (PII)' : ''}
      {admin ? ' · admin only' : ''}
      <Save style={{ display: 'none' }} />
    </button>
  );
}
