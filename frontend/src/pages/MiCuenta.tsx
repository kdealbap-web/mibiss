import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Construction,
  Lightbulb,
  Droplets,
  Heart,
  GraduationCap,
  TreePine,
  Users,
  MoreHorizontal,
  Plus,
  LogOut,
  Save,
  Mail,
  HandHeart,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { useFlowDrawer } from '../context/FlowDrawer';
import { supabase } from '../lib/supabase';
import { formatFolio, formatRelative, initials } from '../lib/format';
import {
  useMiPerfil,
  useMisCasos,
  useMisTestimonios,
  useMisPadrinazgos,
  useSession,
  type MiPadrinazgo,
} from '../hooks/useMiCuenta';
import { useActualizaciones } from '../hooks/useActualizaciones';
import { useBarrios } from '../hooks/useBarrios';
import {
  useActualizarMiPerfil,
  useCambiarMiEmail,
  useDefinirMiPassword,
} from '../hooks/mutations/useMiPerfilMutations';
import type { CasoPublico, EstadoCaso } from '../types/biss';

import '../styles/page-mi-cuenta.css';

const ICON_CAT: Record<string, typeof Construction> = {
  agua: Droplets,
  luz: Lightbulb,
  infraestructura: Construction,
  salud: Heart,
  educacion: GraduationCap,
  'medio-ambiente': TreePine,
  social: Users,
  otros: MoreHorizontal,
};

const ESTADO_BADGE: Record<EstadoCaso, { cls: string; txt: string }> = {
  pendiente: { cls: 'badge', txt: 'Pendiente' },
  critico: { cls: 'badge badge-critical', txt: 'Crítico' },
  progreso: { cls: 'badge badge-progress', txt: 'En gestión' },
  resuelto: { cls: 'badge badge-resolved', txt: 'Resuelto' },
  archivado: { cls: 'badge', txt: 'Archivado' },
};

type Tab = 'casos' | 'testimonios' | 'padrinazgos' | 'datos';

export function MiCuenta() {
  const navigate = useNavigate();
  const { openFlow } = useFlowDrawer();
  const session = useSession();
  const { data: perfil, isLoading: perfilLoading } = useMiPerfil();
  const { data: casos = [] } = useMisCasos();
  const { data: testimonios = [] } = useMisTestimonios();
  const { data: padrinazgos = [] } = useMisPadrinazgos();
  const { data: barrios = [] } = useBarrios();
  const [tab, setTab] = useState<Tab>('casos');

  const actualizarPerfil = useActualizarMiPerfil();
  const cambiarEmail = useCambiarMiEmail();
  const definirPassword = useDefinirMiPassword();

  useEffect(() => {
    document.body.classList.add('mc-body');
    return () => document.body.classList.remove('mc-body');
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/home', { replace: true });
  };

  if (session === null) return <Navigate to="/login" replace />;

  if (perfilLoading) {
    return (
      <>
        <Navbar />
        <div className="mc-shell">
          <p className="caption">Un segundo…</p>
        </div>
      </>
    );
  }

  const nombre = perfil ? `${perfil.nombres} ${perfil.apellidos}`.trim() : session?.user.email ?? 'Vecino';
  const barrioNombre = perfil ? barrios.find((b) => b.id === perfil.barrio_id)?.nombre ?? '—' : '—';
  const fechaIngreso = perfil
    ? new Date(perfil.creado_en).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
    : '—';

  const testimoniosAprobados = testimonios.filter((t) => t.estado === 'aprobado').length;

  return (
    <>
      <Navbar />

      <div className="mc-shell">
        <div className="profile-card">
          <div className="profile-avatar">{initials(nombre)}</div>
          <div>
            <h1>{nombre}</h1>
            <div className="sub">
              {barrioNombre !== '—' && <>{barrioNombre} · </>}vecino desde {fechaIngreso}
            </div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat"><div className="n">{casos.length}</div><div className="l">Casos</div></div>
            <div className="profile-stat"><div className="n">{testimonios.length}</div><div className="l">Testimonios</div></div>
            <div className="profile-stat"><div className="n">{padrinazgos.length}</div><div className="l">Padrinazgos</div></div>
          </div>
        </div>

        <div className="mc-card">
          <div className="tabs mc-tabs">
            <button type="button" className="tab" data-state={tab === 'casos' ? 'active' : undefined} onClick={() => setTab('casos')}>
              Mis casos
            </button>
            <button type="button" className="tab" data-tone="social" data-state={tab === 'testimonios' ? 'active' : undefined} onClick={() => setTab('testimonios')}>
              Mis testimonios
            </button>
            <button type="button" className="tab" data-tone="resolved" data-state={tab === 'padrinazgos' ? 'active' : undefined} onClick={() => setTab('padrinazgos')}>
              Padrinazgos
            </button>
            <button type="button" className="tab" data-state={tab === 'datos' ? 'active' : undefined} onClick={() => setTab('datos')}>
              Datos
            </button>
          </div>

          {tab === 'casos' && (
            <>
              {casos.length === 0 ? (
                <p className="caption" style={{ padding: '20px 0' }}>
                  Aún no tienes casos publicados. Cuando reportes uno y lo aprobemos, aparece aquí.
                </p>
              ) : (
                casos.map((c) => <MiCasoRow key={c.id} caso={c} />)
              )}
              <div className="row row-3" style={{ marginTop: 20, justifyContent: 'space-between' }}>
                <span className="caption">Mostrando {casos.length} de {casos.length} casos</span>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openFlow('reportar')}>
                  <Plus />Nuevo caso
                </button>
              </div>
            </>
          )}

          {tab === 'testimonios' && (
            <>
              {testimonios.length === 0 ? (
                <p className="caption" style={{ padding: '20px 0' }}>
                  Aquí no hay voces todavía. Si vives algo en tu barrio, cuéntalo.
                </p>
              ) : (
                <>
                  <p className="caption" style={{ paddingBottom: 12 }}>
                    {testimoniosAprobados} de {testimonios.length} aprobados.
                  </p>
                  {testimonios.map((t) => (
                    <div key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{t.mensaje}</div>
                      <div className="caption" style={{ marginTop: 6 }}>
                        Estado:{' '}
                        <strong style={{ color: t.estado === 'aprobado' ? 'var(--state-resolved)' : 'var(--ink-soft)' }}>
                          {t.estado}
                        </strong>{' '}
                        · {formatRelative(t.creado_en)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {tab === 'padrinazgos' && (
            <>
              {padrinazgos.length === 0 ? (
                <p className="caption" style={{ padding: '20px 0' }}>
                  Cuando apadrines un caso, lo verás listado aquí. Recuerda usar este mismo email
                  al inscribirte para que lo vinculemos a tu cuenta.
                </p>
              ) : (
                padrinazgos.map((p) => <MiPadrinazgoRow key={`${p.padrino_id}-${p.caso_id ?? 'sin'}`} padrinazgo={p} />)
              )}
            </>
          )}

          {tab === 'datos' && (
            perfil ? (
              <DatosForm
                perfil={perfil}
                barrios={barrios}
                sessionEmail={session.user.email ?? ''}
                onSavePerfil={async (patch) => actualizarPerfil.mutateAsync(patch)}
                onChangeEmail={async (email) => cambiarEmail.mutateAsync(email)}
                onSetPassword={async (pass) => definirPassword.mutateAsync(pass)}
                savingPerfil={actualizarPerfil.isPending}
                savingEmail={cambiarEmail.isPending}
                savingPassword={definirPassword.isPending}
              />
            ) : (
              <p className="caption" style={{ padding: '20px 0' }}>
                Tu perfil de ciudadano aún no está creado. Cuando completes el ingreso por email,
                verás tus datos aquí.
              </p>
            )
          )}
        </div>

        <div className="row row-3" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            <LogOut />Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}

function MiCasoRow({ caso }: { caso: CasoPublico }) {
  const Icon = ICON_CAT[caso.categoria_codigo] ?? MoreHorizontal;
  const { cls, txt } = ESTADO_BADGE[caso.estado];
  const [expanded, setExpanded] = useState(false);
  const { data: actualizaciones = [] } = useActualizaciones(expanded ? caso.id : null);
  const ultimas = actualizaciones.slice(0, 3);

  return (
    <div className="case-row-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
      <div
        className="case-row"
        onClick={() => setExpanded((v) => !v)}
        style={{ cursor: 'pointer' }}
        role="button"
        aria-expanded={expanded}
      >
        <div className="ico" style={{ background: `var(--cat-${caso.categoria_codigo})` }}>
          <Icon />
        </div>
        <div>
          <div className="title">{caso.titulo}</div>
          <div className="meta">
            <span className="mono">{formatFolio(caso.slug)}</span>
            {caso.publicado_en && <> · publicado {formatRelative(caso.publicado_en)}</>}
          </div>
        </div>
        <span className={cls}>
          <span className="dot" />
          {txt}
        </span>
        <button
          type="button"
          aria-label={expanded ? 'Ocultar historial' : 'Ver historial'}
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--ink-soft)',
            padding: 4,
            marginLeft: 6,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div
          style={{
            background: 'var(--surface-sunken)',
            padding: '12px 16px 14px 64px',
            borderTop: '1px solid var(--border)',
          }}
        >
          {ultimas.length === 0 ? (
            <p className="caption" style={{ fontSize: 12 }}>
              Sin movimientos registrados todavía.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
              {ultimas.map((a) => (
                <li key={a.id} style={{ display: 'flex', gap: 10 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background:
                        a.estado_nuevo === 'critico' ? 'var(--state-critical)' :
                        a.estado_nuevo === 'progreso' ? 'var(--state-progress)' :
                        a.estado_nuevo === 'resuelto' ? 'var(--state-resolved)' :
                        'var(--ink-soft)',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-strong)', fontWeight: 600 }}>
                      {a.tipo === 'cambio_estado' && a.estado_nuevo
                        ? `Cambió a ${ESTADO_BADGE[a.estado_nuevo].txt}`
                        : a.tipo === 'nota' ? 'Nota del equipo'
                        : a.tipo === 'hito' ? 'Hito'
                        : a.tipo === 'reunion' ? 'Reunión'
                        : 'Actualización'}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.4, margin: '2px 0 0' }}>
                      {a.texto}
                    </p>
                    <span className="caption mono" style={{ fontSize: 10.5 }}>
                      {formatRelative(a.ocurrido_en)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to={`/caso/${caso.slug}`}
            style={{
              display: 'inline-block',
              marginTop: 10,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--biss-teal-900)',
            }}
          >
            Ver caso completo →
          </Link>
        </div>
      )}
    </div>
  );
}

function MiPadrinazgoRow({ padrinazgo }: { padrinazgo: MiPadrinazgo }) {
  const inscritoCuando = formatRelative(padrinazgo.padrino_creado_en);
  const estadoCaso = (padrinazgo.caso_estado as EstadoCaso | null);
  const estadoBadge = estadoCaso ? ESTADO_BADGE[estadoCaso] : null;
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <HandHeart size={16} style={{ color: 'var(--state-resolved)' }} />
            <strong style={{ fontSize: 14, color: 'var(--ink-strong)' }}>
              {padrinazgo.padrino_nombre}
            </strong>
            <span className="caption" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
              · {padrinazgo.tipo_apoyo}
            </span>
          </div>
          {padrinazgo.caso_titulo && padrinazgo.caso_slug ? (
            <div style={{ fontSize: 13 }}>
              Apadrinando:{' '}
              <Link
                to={`/caso/${padrinazgo.caso_slug}`}
                style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}
              >
                {padrinazgo.caso_titulo}
              </Link>
            </div>
          ) : (
            <div className="caption" style={{ fontSize: 12 }}>Inscripción general (aún no vinculada a un caso específico).</div>
          )}
          <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.45 }}>
            {padrinazgo.descripcion}
          </p>
          <div className="caption" style={{ fontSize: 11, marginTop: 6 }}>
            Inscrito {inscritoCuando} · {padrinazgo.publicado ? 'visible en el caso' : 'pendiente de moderación'}
          </div>
        </div>
        {estadoBadge && (
          <span className={estadoBadge.cls}><span className="dot" />{estadoBadge.txt}</span>
        )}
      </div>
    </div>
  );
}

interface DatosFormProps {
  perfil: NonNullable<ReturnType<typeof useMiPerfil>['data']>;
  barrios: ReturnType<typeof useBarrios>['data'] extends infer T ? (T extends undefined ? never : T) : never;
  sessionEmail: string;
  onSavePerfil: (patch: import('../hooks/mutations/useMiPerfilMutations').PerfilPatch) => Promise<void>;
  onChangeEmail: (email: string) => Promise<void>;
  onSetPassword: (pass: string) => Promise<void>;
  savingPerfil: boolean;
  savingEmail: boolean;
  savingPassword: boolean;
}

function DatosForm({
  perfil,
  barrios,
  sessionEmail,
  onSavePerfil,
  onChangeEmail,
  onSetPassword,
  savingPerfil,
  savingEmail,
  savingPassword,
}: DatosFormProps) {
  const [form, setForm] = useState({
    nombres: perfil.nombres,
    apellidos: perfil.apellidos,
    telefono_celular: perfil.telefono_celular ?? '',
    direccion: perfil.direccion,
    barrio_id: perfil.barrio_id,
    estrato: perfil.estrato,
    miembros_hogar: perfil.miembros_hogar,
    acepta_notificaciones: perfil.acepta_notificaciones,
  });
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [emailNuevo, setEmailNuevo] = useState('');
  const [emailFeedback, setEmailFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');
  const [passFeedback, setPassFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const cambiado = useMemo(() => {
    return (
      form.nombres.trim() !== perfil.nombres ||
      form.apellidos.trim() !== perfil.apellidos ||
      (form.telefono_celular.trim() || null) !== (perfil.telefono_celular ?? null) ||
      form.direccion.trim() !== perfil.direccion ||
      form.barrio_id !== perfil.barrio_id ||
      form.estrato !== perfil.estrato ||
      form.miembros_hogar !== perfil.miembros_hogar ||
      form.acepta_notificaciones !== perfil.acepta_notificaciones
    );
  }, [form, perfil]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await onSavePerfil({
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        telefono_celular: form.telefono_celular.trim() || null,
        direccion: form.direccion.trim(),
        barrio_id: form.barrio_id,
        estrato: form.estrato,
        miembros_hogar: form.miembros_hogar,
        acepta_notificaciones: form.acepta_notificaciones,
      });
      setFeedback({ kind: 'ok', text: 'Datos guardados.' });
      setTimeout(() => setFeedback(null), 2400);
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err);
      setFeedback({
        kind: 'err',
        text: /row-level|policy/i.test(msg) ? 'No tienes permiso para esto.' : 'No pudimos guardar.',
      });
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFeedback(null);
    const clean = emailNuevo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setEmailFeedback({ kind: 'err', text: 'Revisa el formato del correo.' });
      return;
    }
    if (clean === sessionEmail.toLowerCase()) {
      setEmailFeedback({ kind: 'err', text: 'Ese ya es tu correo actual.' });
      return;
    }
    try {
      await onChangeEmail(clean);
      setEmailFeedback({
        kind: 'ok',
        text: `Te enviamos un enlace de confirmación a ${clean} y a tu correo actual. El cambio se aplica cuando confirmes ambos.`,
      });
      setEmailNuevo('');
    } catch (err: unknown) {
      const msg = String((err as { message?: string })?.message ?? err);
      if (/rate/i.test(msg)) setEmailFeedback({ kind: 'err', text: 'Demasiados intentos. Espera unos minutos.' });
      else setEmailFeedback({ kind: 'err', text: 'No pudimos iniciar el cambio. Vuelve a intentarlo.' });
    }
  };

  return (
    <form onSubmit={submit} className="stack stack-3" style={{ padding: '4px 0' }}>
      <div className="row row-2" style={{ gap: 10 }}>
        <div className="mini-field grow">
          <label htmlFor="mc-nombres">Nombres</label>
          <input
            id="mc-nombres"
            type="text"
            value={form.nombres}
            onChange={(e) => setForm((f) => ({ ...f, nombres: e.target.value }))}
            required
            minLength={2}
          />
        </div>
        <div className="mini-field grow">
          <label htmlFor="mc-apellidos">Apellidos</label>
          <input
            id="mc-apellidos"
            type="text"
            value={form.apellidos}
            onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
            required
            minLength={2}
          />
        </div>
      </div>
      <div className="mini-field">
        <label htmlFor="mc-tel">Teléfono (opcional)</label>
        <input
          id="mc-tel"
          type="tel"
          autoComplete="tel"
          value={form.telefono_celular}
          onChange={(e) => setForm((f) => ({ ...f, telefono_celular: e.target.value }))}
          placeholder="+57 300 000 0000"
        />
      </div>
      <div className="mini-field">
        <label htmlFor="mc-dir">Dirección</label>
        <input
          id="mc-dir"
          type="text"
          value={form.direccion}
          onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
        />
      </div>
      <div className="mini-field">
        <label htmlFor="mc-barrio">Barrio</label>
        <select
          id="mc-barrio"
          value={form.barrio_id}
          onChange={(e) => setForm((f) => ({ ...f, barrio_id: Number(e.target.value) }))}
        >
          {barrios.map((b) => (
            <option key={b.id} value={b.id}>{b.nombre}</option>
          ))}
        </select>
      </div>
      <div className="row row-2" style={{ gap: 10 }}>
        <div className="mini-field grow">
          <label htmlFor="mc-estrato">Estrato</label>
          <select
            id="mc-estrato"
            value={form.estrato}
            onChange={(e) => setForm((f) => ({ ...f, estrato: Number(e.target.value) }))}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="mini-field grow">
          <label htmlFor="mc-hogar">Personas en el hogar</label>
          <input
            id="mc-hogar"
            type="number"
            min={1}
            max={30}
            value={form.miembros_hogar}
            onChange={(e) =>
              setForm((f) => ({ ...f, miembros_hogar: Math.max(1, Math.min(30, Number(e.target.value) || 1)) }))
            }
          />
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderTop: '1px solid var(--border)',
          marginTop: 6,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-strong)' }}>
            Recibir notificaciones por email
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
            Cuando tu caso cambia o alguien suma testimonio.
          </div>
        </div>
        <input
          type="checkbox"
          checked={form.acepta_notificaciones}
          onChange={(e) => setForm((f) => ({ ...f, acepta_notificaciones: e.target.checked }))}
          style={{ accentColor: 'var(--biss-teal)', width: 20, height: 20 }}
        />
      </label>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
        {feedback && (
          <span
            style={{
              fontSize: 12,
              color: feedback.kind === 'ok' ? 'var(--state-resolved)' : 'var(--state-critical)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {feedback.kind === 'ok' ? <Check size={14} /> : <AlertTriangle size={14} />}
            {feedback.text}
          </span>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!cambiado || savingPerfil}
        >
          <Save size={14} />
          {savingPerfil ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          background: 'var(--surface-sunken)',
          borderRadius: 8,
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-strong)', marginBottom: 4 }}>
          Cambiar correo electrónico
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10, lineHeight: 1.4 }}>
          Correo actual: <strong>{sessionEmail}</strong>. El cambio requiere confirmar el nuevo email.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <input
            type="email"
            value={emailNuevo}
            onChange={(e) => setEmailNuevo(e.target.value)}
            placeholder="tu-nuevo@correo.com"
            style={{
              flex: '1 1 220px',
              padding: '10px 12px',
              border: '1.5px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
            }}
            aria-label="Nuevo correo"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={submitEmail}
            disabled={savingEmail || !emailNuevo.trim()}
          >
            <Mail size={14} />
            {savingEmail ? 'Enviando…' : 'Solicitar cambio'}
          </button>
        </div>
        {emailFeedback && (
          <div
            className={emailFeedback.kind === 'ok' ? 'alert' : 'alert alert-critical'}
            style={{
              marginTop: 10,
              padding: '8px 10px',
              background: emailFeedback.kind === 'ok' ? 'var(--state-resolved-bg)' : 'var(--state-critical-bg)',
              border: `1px solid ${emailFeedback.kind === 'ok' ? 'var(--state-resolved-border)' : 'var(--state-critical-border)'}`,
            }}
            role="status"
          >
            <div className="alert-body">
              <div
                className="alert-text"
                style={{
                  fontSize: 12,
                  color: emailFeedback.kind === 'ok' ? '#065F46' : 'var(--state-critical)',
                }}
              >
                {emailFeedback.text}
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          padding: 14,
          background: 'var(--surface-sunken)',
          borderRadius: 8,
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-strong)', marginBottom: 4 }}>
          Contraseña (opcional)
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10, lineHeight: 1.4 }}>
          Si defines una contraseña, podrás entrar sin esperar el código por email. Mínimo 6
          caracteres.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            type="password"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            minLength={6}
            style={{
              padding: '10px 12px',
              border: '1.5px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
            }}
            aria-label="Nueva contraseña"
          />
          <input
            type="password"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
            placeholder="Repítela"
            autoComplete="new-password"
            minLength={6}
            style={{
              padding: '10px 12px',
              border: '1.5px solid var(--border)',
              borderRadius: 8,
              fontSize: 14,
            }}
            aria-label="Confirmar contraseña"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ justifySelf: 'start' }}
            disabled={
              savingPassword ||
              pass1.length < 6 ||
              pass1 !== pass2
            }
            onClick={async () => {
              setPassFeedback(null);
              if (pass1 !== pass2) {
                setPassFeedback({ kind: 'err', text: 'Las contraseñas no coinciden.' });
                return;
              }
              try {
                await onSetPassword(pass1);
                setPassFeedback({ kind: 'ok', text: 'Contraseña guardada. Ya puedes entrar con ella.' });
                setPass1('');
                setPass2('');
              } catch (err: unknown) {
                const msg = String((err as { message?: string })?.message ?? err);
                setPassFeedback({
                  kind: 'err',
                  text: /rate/i.test(msg) ? 'Demasiados intentos. Espera unos minutos.' : 'No pudimos guardar.',
                });
              }
            }}
          >
            {savingPassword ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </div>
        {passFeedback && (
          <div
            className={passFeedback.kind === 'ok' ? 'alert' : 'alert alert-critical'}
            style={{
              marginTop: 10,
              padding: '8px 10px',
              background: passFeedback.kind === 'ok' ? 'var(--state-resolved-bg)' : 'var(--state-critical-bg)',
              border: `1px solid ${passFeedback.kind === 'ok' ? 'var(--state-resolved-border)' : 'var(--state-critical-border)'}`,
            }}
            role="status"
          >
            <div className="alert-body">
              <div
                className="alert-text"
                style={{
                  fontSize: 12,
                  color: passFeedback.kind === 'ok' ? '#065F46' : 'var(--state-critical)',
                }}
              >
                {passFeedback.text}
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
