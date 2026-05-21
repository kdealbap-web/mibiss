import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail, KeyRound, AlertTriangle } from 'lucide-react';

import { BissLogo } from '../components/brand/BissLogo';
import { BissMark } from '../components/brand/BissMark';
import { useFlowDrawer } from '../context/FlowDrawer';
import { useMiRol, useSession } from '../hooks/useMiCuenta';
import { supabase } from '../lib/supabase';

import '../styles/login.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Modo = 'otp' | 'password';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { openFlow } = useFlowDrawer();
  const session = useSession();
  const { data: rol } = useMiRol();
  const [modo, setModo] = useState<Modo>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Soporta /login?return=/caso/xxx para volver al lugar de origen tras login.
  // Solo aceptamos paths internos (empiezan con /, sin //, sin esquemas).
  const returnTo = useMemo(() => {
    const raw = searchParams.get('return');
    if (!raw) return null;
    if (!raw.startsWith('/') || raw.startsWith('//')) return null;
    if (/^\/?(login|recuperar|admin)/i.test(raw)) return null;
    return raw;
  }, [searchParams]);

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => document.body.classList.remove('auth-body');
  }, []);

  // Si ya hay sesión activa al entrar a /login, redirige según rol o returnTo.
  useEffect(() => {
    if (!session || !rol) return;
    if (rol === 'admin' || rol === 'superadmin' || rol === 'editor') {
      navigate('/admin', { replace: true });
    } else if (returnTo) {
      navigate(returnTo, { replace: true });
    } else if (rol === 'ciudadano') {
      navigate('/mi-cuenta', { replace: true });
    }
  }, [session, rol, navigate, returnTo]);

  const validEmail = EMAIL_RE.test(email.trim());

  const onSubmitOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) return;
    openFlow('ingresar', { prefillEmail: clean });
  };

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setErr('Revisa el formato del correo.');
      return;
    }
    if (password.length < 6) {
      setErr('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: clean,
        password,
      });
      if (error) throw error;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: cms } = await supabase
          .from('usuarios_cms')
          .select('rol')
          .eq('id', user.id)
          .eq('activo', true)
          .maybeSingle();
        if (cms?.rol) {
          navigate('/admin', { replace: true });
          return;
        }
      }
      navigate(returnTo ?? '/mi-cuenta', { replace: true });
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/invalid login/i.test(msg) || /credentials/i.test(msg)) {
        setErr('Correo o contraseña no coinciden.');
      } else if (/email.*not.*confirmed/i.test(msg)) {
        setErr('Tu cuenta aún no está confirmada. Revisa tu correo o usa el código por email.');
      } else if (/rate/i.test(msg)) {
        setErr('Demasiados intentos. Espera unos minutos.');
      } else {
        setErr('No pudimos entrar. ' + msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <BissLogo width={220} variant="white" />
        <div>
          <h2>Donde Soledad cuenta lo que le pasa.</h2>
          <p
            style={{
              marginTop: 14,
              color: 'rgba(255,255,255,0.88)',
              maxWidth: '36ch',
              lineHeight: 1.5,
            }}
          >
            Entra con código por email o contraseña. Si eres del equipo, el panel te detecta
            automáticamente.
          </p>
        </div>
        <div className="quote">
          "No prometo nada. Cuento lo que pasa y muestro qué hicimos."
          <div className="quote-author">— Kevin Balvuena, concejal</div>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="brand">
            <BissMark size={64} />
          </div>
          <h1>Entra a BISS</h1>
          <p className="sub">
            {modo === 'otp'
              ? 'Te mandamos un código por email.'
              : 'Entra con tu correo y contraseña.'}
          </p>

          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Modo de entrada"
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--surface-sunken)',
              padding: 4,
              borderRadius: 'var(--radius)',
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'otp'}
              onClick={() => { setModo('otp'); setErr(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 700,
                background: modo === 'otp' ? 'var(--surface)' : 'transparent',
                color: modo === 'otp' ? 'var(--biss-teal-900)' : 'var(--ink-soft)',
                border: 0,
                cursor: 'pointer',
                boxShadow: modo === 'otp' ? 'var(--shadow-sm)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Mail size={14} />
              Código por email
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modo === 'password'}
              onClick={() => { setModo('password'); setErr(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 700,
                background: modo === 'password' ? 'var(--surface)' : 'transparent',
                color: modo === 'password' ? 'var(--biss-teal-900)' : 'var(--ink-soft)',
                border: 0,
                cursor: 'pointer',
                boxShadow: modo === 'password' ? 'var(--shadow-sm)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <KeyRound size={14} />
              Contraseña
            </button>
          </div>

          {modo === 'otp' ? (
            <form className="stack" onSubmit={onSubmitOtp}>
              <div className="field">
                <label className="field-label" htmlFor="login-email">
                  Tu correo
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '0 12px',
                    background: 'var(--surface)',
                  }}
                >
                  <Mail size={18} style={{ color: 'var(--biss-teal-900)' }} aria-hidden />
                  <input
                    id="login-email"
                    className="field-input"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ border: 0, padding: '12px 0', flex: 1 }}
                  />
                </div>
                <span className="field-helper">
                  Te llega un código de 6 dígitos. Si es tu primera vez, te creamos cuenta.
                </span>
              </div>
              <button
                className="btn btn-primary btn-block btn-lg"
                type="submit"
                disabled={!validEmail}
              >
                <ArrowRight />Continuar
              </button>
            </form>
          ) : (
            <form className="stack" onSubmit={onSubmitPassword}>
              <div className="field">
                <label className="field-label" htmlFor="login-email-p">
                  Correo
                </label>
                <input
                  id="login-email-p"
                  className="field-input"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="login-pass">
                  Contraseña
                </label>
                <input
                  id="login-pass"
                  className="field-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Link
                  to="/recuperar"
                  style={{
                    fontSize: 12.5,
                    color: 'var(--biss-teal-900)',
                    fontWeight: 700,
                    alignSelf: 'flex-end',
                    marginTop: 4,
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              {err && (
                <div
                  className="alert alert-critical"
                  role="alert"
                  style={{ padding: '8px 10px' }}
                >
                  <AlertTriangle className="alert-icon" style={{ width: 14, height: 14 }} />
                  <div className="alert-body">
                    <div className="alert-text" style={{ fontSize: 12 }}>{err}</div>
                  </div>
                </div>
              )}
              <button
                className="btn btn-primary btn-block btn-lg"
                type="submit"
                disabled={submitting || !validEmail || password.length < 6}
              >
                <KeyRound />
                {submitting ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          )}

          <div className="alt" style={{ marginTop: 18, textAlign: 'center' }}>
            {modo === 'otp' ? (
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Sin cuenta todavía? Sigue con el código por email · te creamos al toque.
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                Sin contraseña aún? Entra con código y créala desde{' '}
                <Link to="/mi-cuenta" style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}>
                  Mi cuenta
                </Link>
                .
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
