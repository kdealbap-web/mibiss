import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Mail, ShieldAlert } from 'lucide-react';

import { BissLogo } from '../components/brand/BissLogo';
import { BissMark } from '../components/brand/BissMark';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';

import '../styles/login.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Recuperar() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => document.body.classList.remove('auth-body');
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setErr('Revisa el correo. Algo no cuadra con el formato.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${APP_CONFIG.url}/recuperar/nueva-contrasena`,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/rate/i.test(msg)) setErr('Demasiados intentos. Espera unos minutos.');
      else setErr('No pudimos enviar el correo. Vuelve a intentarlo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <BissLogo width={220} variant="white" />
        <div>
          <h2>¿Perdiste el acceso?</h2>
          <p
            style={{
              marginTop: 14,
              color: 'rgba(255,255,255,0.88)',
              maxWidth: '36ch',
              lineHeight: 1.5,
            }}
          >
            Si eres del equipo BISS, te enviamos un enlace para cambiar tu contraseña.
            Si eres ciudadano, no necesitas contraseña — entras con tu código por email.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="brand">
            <BissMark size={64} />
          </div>
          <h1>Recuperar acceso</h1>
          <p className="sub">
            Te enviamos un enlace de un solo uso. Vence en 1 hora.
          </p>

          {submitted ? (
            <>
              <div
                className="alert"
                style={{
                  background: 'var(--state-info-bg)',
                  border: '1px solid var(--state-info-border)',
                  padding: '14px 16px',
                }}
              >
                <Info
                  className="alert-icon"
                  style={{ width: 18, height: 18, color: 'var(--biss-teal-900)' }}
                />
                <div className="alert-body">
                  <div
                    className="alert-text"
                    style={{ fontSize: 13, color: 'var(--biss-teal-900)' }}
                  >
                    Si tu correo es del equipo BISS, te llegará un link en unos minutos. Si eres
                    ciudadano, recuerda que entras con código por email — sin contraseña.
                  </div>
                </div>
              </div>
              <Link
                to="/login"
                className="btn btn-secondary btn-block"
                style={{ marginTop: 18 }}
              >
                <ArrowLeft />Volver a entrar
              </Link>
            </>
          ) : (
            <form className="stack" onSubmit={onSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="r-email">
                  Tu correo del equipo
                </label>
                <input
                  id="r-email"
                  className="field-input"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@biss.gov.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div
                className="alert alert-warning"
                style={{ padding: '10px 12px' }}
              >
                <ShieldAlert
                  className="alert-icon"
                  style={{ width: 16, height: 16 }}
                />
                <div className="alert-body">
                  <div className="alert-text" style={{ fontSize: 12 }}>
                    Solo correos del equipo BISS pueden recuperar contraseña. Los ciudadanos
                    entran con código por email.
                  </div>
                </div>
              </div>
              {err && (
                <div
                  className="alert alert-critical"
                  style={{ padding: '10px 12px' }}
                  role="alert"
                >
                  <div className="alert-body">
                    <div className="alert-text" style={{ fontSize: 12 }}>
                      {err}
                    </div>
                  </div>
                </div>
              )}
              <button
                className="btn btn-primary btn-block btn-lg"
                type="submit"
                disabled={sending}
              >
                <Mail />
                {sending ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )}

          <div className="alt" style={{ marginTop: 18, textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Volver a entrar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
