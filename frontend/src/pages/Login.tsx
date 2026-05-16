import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LogIn } from 'lucide-react';

import { BissLogo } from '../components/brand/BissLogo';
import { BissMark } from '../components/brand/BissMark';
import { useFlowDrawer } from '../context/FlowDrawer';
import { supabase } from '../lib/supabase';

import '../styles/login.css';

type Tab = 'ciudadano' | 'editor';

export function Login() {
  const navigate = useNavigate();
  const { openFlow } = useFlowDrawer();

  const [tab, setTab] = useState<Tab>('ciudadano');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => document.body.classList.remove('auth-body');
  }, []);

  const onCiudadanoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    openFlow('ingresar');
  };

  const onEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError('Correo o contraseña no coinciden. Vuelve a intentarlo.');
      return;
    }
    navigate('/admin', { replace: true });
  };

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <BissLogo height={70} variant="white" />
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
            Panel para el equipo de moderación. Atendemos cada caso, leemos cada testimonio,
            coordinamos cada padrinazgo.
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
            Entra con tu celular. Si eres del equipo, cambia abajo a "Editor".
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              data-active={tab === 'ciudadano' ? 'true' : undefined}
              onClick={() => setTab('ciudadano')}
            >
              Soy ciudadano
            </button>
            <button
              type="button"
              data-active={tab === 'editor' ? 'true' : undefined}
              onClick={() => setTab('editor')}
            >
              Soy editor
            </button>
          </div>

          {tab === 'ciudadano' ? (
            <form className="stack" onSubmit={onCiudadanoSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="cel">
                  Tu celular
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0 14px',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--biss-teal-900)',
                      background: 'var(--surface)',
                    }}
                  >
                    +57
                  </span>
                  <input
                    id="cel"
                    className="field-input"
                    type="tel"
                    placeholder="300 000 0000"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                </div>
                <span className="field-helper">
                  Te enviamos un código por SMS · sin contraseña.
                </span>
              </div>
              <button
                className="btn btn-primary btn-block btn-lg"
                type="submit"
                disabled={celular.replace(/\D/g, '').length < 7}
              >
                <ArrowRight />Enviar código
              </button>
            </form>
          ) : (
            <form className="stack" onSubmit={onEditorSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="email">
                  Correo
                </label>
                <input
                  id="email"
                  className="field-input"
                  type="email"
                  placeholder="tu@biss.gov.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="pass">
                  Contraseña
                </label>
                <input
                  id="pass"
                  className="field-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <a
                  href="#"
                  style={{
                    fontSize: 13,
                    color: 'var(--biss-teal-900)',
                    fontWeight: 700,
                    alignSelf: 'flex-end',
                  }}
                >
                  ¿La olvidaste?
                </a>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--ink-soft)',
                  marginTop: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  style={{ accentColor: 'var(--biss-teal)' }}
                />
                Mantener sesión en este equipo
              </label>
              {error && (
                <div
                  className="alert alert-critical"
                  style={{ padding: '10px 12px', fontSize: 12 }}
                >
                  {error}
                </div>
              )}
              <button
                className="btn btn-primary btn-block btn-lg"
                type="submit"
                disabled={loading}
              >
                <LogIn />
                {loading ? 'Entrando…' : 'Entrar al panel'}
              </button>
            </form>
          )}

          <div className="alt">
            ¿Eres concejal o líder social? <a href="#">Solicita acceso</a>
          </div>
        </div>
      </main>
    </div>
  );
}
