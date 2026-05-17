import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';

import { BissLogo } from '../components/brand/BissLogo';
import { BissMark } from '../components/brand/BissMark';
import { useFlowDrawer } from '../context/FlowDrawer';

import '../styles/login.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login() {
  const { openFlow } = useFlowDrawer();
  const [email, setEmail] = useState('');

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => document.body.classList.remove('auth-body');
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) return;
    openFlow('ingresar', { prefillEmail: clean });
  };

  const validEmail = EMAIL_RE.test(email.trim());

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
            Entra con tu correo. Te enviamos un código de 6 dígitos. Si eres del equipo,
            el panel te detecta automáticamente.
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
          <p className="sub">Te mandamos un código por email.</p>

          <form className="stack" onSubmit={onSubmit}>
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
                Sin contraseña. Te llega un código de 6 dígitos.
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

          <div className="alt" style={{ marginTop: 18 }}>
            <Link
              to="/recuperar"
              style={{ color: 'var(--biss-teal-900)', fontWeight: 700 }}
            >
              ¿Eres del equipo y olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
