import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Check } from 'lucide-react';

import { BissLogo } from '../components/brand/BissLogo';
import { BissMark } from '../components/brand/BissMark';
import { supabase } from '../lib/supabase';
import { useSession } from '../hooks/useMiCuenta';

import '../styles/login.css';

const MIN_PASS = 8;

export function RecuperarNuevaContrasena() {
  const navigate = useNavigate();
  const session = useSession();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('auth-body');
    return () => document.body.classList.remove('auth-body');
  }, []);

  const valid =
    pass.length >= MIN_PASS &&
    confirm.length >= MIN_PASS &&
    pass === confirm;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!valid) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/admin', { replace: true }), 2000);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/session/i.test(msg) || /jwt/i.test(msg) || /Auth session missing/i.test(msg)) {
        setErr('El enlace expiró o ya se usó. Pide uno nuevo en "Recuperar acceso".');
      } else {
        setErr('No pudimos actualizar la contraseña. Vuelve a intentarlo.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <BissLogo width={220} variant="white" />
        <div>
          <h2>Define tu nueva contraseña</h2>
          <p
            style={{
              marginTop: 14,
              color: 'rgba(255,255,255,0.88)',
              maxWidth: '36ch',
              lineHeight: 1.5,
            }}
          >
            Mínimo 8 caracteres. Mezcla letras y números para que sea más fuerte.
          </p>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="brand">
            <BissMark size={64} />
          </div>
          <h1>Nueva contraseña</h1>
          <p className="sub">
            {session
              ? 'Setea la nueva contraseña de tu cuenta del equipo.'
              : 'Abre el link desde tu correo. Sin sesión activa no podemos cambiar la contraseña.'}
          </p>

          {done ? (
            <div
              className="alert"
              style={{
                background: 'var(--state-resolved-bg)',
                border: '1px solid var(--state-resolved-border)',
                padding: '14px 16px',
              }}
            >
              <Check
                className="alert-icon"
                style={{ width: 18, height: 18, color: 'var(--state-resolved)' }}
              />
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 13, color: '#065F46' }}>
                  Contraseña actualizada. Te llevamos al panel…
                </div>
              </div>
            </div>
          ) : (
            <form className="stack" onSubmit={onSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="n-pass">
                  Nueva contraseña
                </label>
                <input
                  id="n-pass"
                  className="field-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  minLength={MIN_PASS}
                  required
                />
                <span className="field-helper">Mínimo {MIN_PASS} caracteres.</span>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="n-confirm">
                  Confirma
                </label>
                <input
                  id="n-confirm"
                  className="field-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={MIN_PASS}
                  required
                />
                {confirm.length >= MIN_PASS && pass !== confirm && (
                  <span
                    className="field-helper"
                    style={{ color: 'var(--state-critical)' }}
                  >
                    Las contraseñas no coinciden.
                  </span>
                )}
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
                disabled={!valid || saving || !session}
              >
                <KeyRound />
                {saving ? 'Guardando…' : 'Guardar contraseña'}
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
