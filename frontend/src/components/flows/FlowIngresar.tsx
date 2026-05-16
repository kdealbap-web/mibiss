import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Info,
  RefreshCw,
  CheckCircle2,
  Check,
  Hand,
  Mail,
} from 'lucide-react';

import { FlowShell, useFlowDraft } from './FlowShell';
import { useFlowDrawer } from '../../context/FlowDrawer';
import { supabase } from '../../lib/supabase';
import { useBarrios } from '../../hooks/useBarrios';

interface IngresarDraft {
  email: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  barrioId: number | null;
  direccion: string;
  telefonoCelular: string;
  estrato: number;
  miembrosHogar: number;
  acceptaNotificaciones: boolean;
  consentimientoHabeasData: boolean;
}

const INITIAL: IngresarDraft = {
  email: '',
  cedula: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  barrioId: null,
  direccion: '',
  telefonoCelular: '',
  estrato: 1,
  miembrosHogar: 1,
  acceptaNotificaciones: true,
  consentimientoHabeasData: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CEDULA_RE = /^\d{6,12}$/;

export function FlowIngresar() {
  const { closeFlow, meta } = useFlowDrawer();
  const [draft, setDraft, clearDraft] = useFlowDraft<IngresarDraft>('ingresar', INITIAL);

  useEffect(() => {
    if (meta.prefillEmail && !draft.email) {
      setDraft((d) => ({ ...d, email: meta.prefillEmail!.toLowerCase() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.prefillEmail]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secsLeft, setSecsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sesionLista, setSesionLista] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const { data: barrios = [] } = useBarrios();

  // Cooldown del reenvío
  useEffect(() => {
    if (step !== 2 || secsLeft <= 0) return;
    const t = window.setInterval(() => {
      setSecsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [step, secsLeft]);

  const sendOtp = async () => {
    setErr(null);
    if (!EMAIL_RE.test(draft.email.trim())) {
      setErr('Revisa tu correo. Algo no cuadra con el formato.');
      return;
    }
    if (!CEDULA_RE.test(draft.cedula.trim())) {
      setErr('La cédula debe tener entre 6 y 12 dígitos.');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: draft.email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpDigits(['', '', '', '', '', '']);
      setSecsLeft(60);
      setStep(2);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/rate/i.test(msg)) setErr('Demasiados intentos. Espera unos minutos.');
      else if (/Email signups/i.test(msg)) setErr('El registro por email está deshabilitado. Avísale al admin.');
      else setErr('No pudimos enviar el código. Vuelve a intentarlo.');
    } finally {
      setSending(false);
    }
  };

  const resendOtp = async () => {
    if (secsLeft > 0) return;
    await sendOtp();
  };

  const verifyOtp = async () => {
    setErr(null);
    const token = otpDigits.join('');
    if (token.length !== 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: draft.email.trim().toLowerCase(),
        token,
        type: 'email',
      });
      if (error) throw error;
      // Sesión activa. El trigger sync_email_verified marca verificado_email=true
      // cuando Supabase setea email_confirmed_at.
      // Verificar si ya existe ciudadano (caso de re-login).
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existente } = await supabase
          .from('ciudadanos')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (existente) {
          // Usuario que vuelve. No pedimos datos otra vez.
          clearDraft();
          setSesionLista(true);
          return;
        }
      }
      setStep(3);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/expired/i.test(msg) || /invalid/i.test(msg)) {
        setErr('El código no coincide o expiró. Pide uno nuevo.');
      } else {
        setErr('No pudimos verificar el código. Vuelve a intentarlo.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const onOtpChange = (idx: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(0, 1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const onOtpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const otpComplete = otpDigits.every((d) => d.length === 1);

  const guardarCiudadano = async () => {
    setErr(null);
    if (!draft.barrioId) {
      setErr('Elige tu barrio.');
      return;
    }
    if (!draft.consentimientoHabeasData) {
      setErr('Necesitamos tu autorización para tratar tus datos.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesión perdida. Vuelve a empezar.');

      const { error } = await supabase.from('ciudadanos').insert({
        auth_user_id: user.id,
        cedula: draft.cedula.trim(),
        nombres: draft.nombres.trim(),
        apellidos: draft.apellidos.trim(),
        fecha_nacimiento: draft.fechaNacimiento,
        barrio_id: draft.barrioId,
        direccion: draft.direccion.trim(),
        email: draft.email.trim().toLowerCase(),
        telefono_celular: draft.telefonoCelular.trim() || null,
        miembros_hogar: draft.miembrosHogar,
        estrato: draft.estrato,
        consentimiento_habeas_data: draft.consentimientoHabeasData,
        acepta_notificaciones: draft.acceptaNotificaciones,
        verificado_email: true,
      });
      if (error) throw error;
      clearDraft();
      setSesionLista(true);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/duplicate key/i.test(msg) && /cedula/i.test(msg)) {
        setErr('Esa cédula ya está registrada. Si eres tú, inicia sesión con tu email anterior.');
      } else if (/duplicate key/i.test(msg) && /email/i.test(msg)) {
        setErr('Este correo ya tiene una cuenta. Inicia sesión normalmente.');
      } else if (/row-level security|policy/i.test(msg)) {
        setErr('No tienes permiso para registrarte. Avísale al admin.');
      } else {
        setErr('No pudimos guardar tus datos. Vuelve a intentarlo.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Step 1 — email + cédula
  const renderStep1 = () => (
    <FlowShell
      step={1}
      totalSteps={3}
      title="Tu correo para enviarte el código"
      lead="Lo usamos solo para verificar que eres tú. Nunca lo mostramos público."
      onClose={closeFlow}
      body={
        <>
          <div className="mini-field">
            <label htmlFor="i-email">Correo electrónico</label>
            <input
              id="i-email"
              type="email"
              autoComplete="email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              placeholder="tu@correo.com"
            />
            <span className="hint">El email puede tardar hasta 60 segundos.</span>
          </div>
          <div className="mini-field">
            <label htmlFor="i-cedula">Cédula</label>
            <input
              id="i-cedula"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={draft.cedula}
              onChange={(e) => setDraft((d) => ({ ...d, cedula: e.target.value.replace(/\D/g, '') }))}
              placeholder="1.045.678.912"
            />
            <span className="hint">Identificador legal en Colombia. Solo lo ven el equipo y tú.</span>
          </div>
          <div
            className="alert"
            style={{
              background: 'var(--state-info-bg)',
              border: '1px solid var(--state-info-border)',
              padding: '10px 12px',
            }}
          >
            <Info
              className="alert-icon"
              style={{ width: 16, height: 16, color: 'var(--biss-teal-900)' }}
            />
            <div className="alert-body">
              <div className="alert-text" style={{ fontSize: 12, color: 'var(--biss-teal-900)' }}>
                Si ya tienes cuenta, el código te ingresa. Si no, te creamos una al toque.
              </div>
            </div>
          </div>
          {err && (
            <div className="alert alert-critical" style={{ padding: '10px 12px' }} role="alert">
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12 }}>{err}</div>
              </div>
            </div>
          )}
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={sending || !EMAIL_RE.test(draft.email.trim()) || !CEDULA_RE.test(draft.cedula.trim())}
          onClick={sendOtp}
        >
          <Mail />{sending ? 'Enviando…' : 'Enviar código'} <ArrowRight />
        </button>
      }
    />
  );

  // Step 2 — verificar OTP
  const renderStep2 = () => (
    <FlowShell
      step={2}
      totalSteps={3}
      title="Pon el código que te llegó"
      lead={
        <>
          Enviamos un correo a{' '}
          <strong style={{ color: 'var(--ink-strong)' }}>{draft.email}</strong>. Revisa la
          bandeja (y spam por si acaso).
        </>
      }
      onClose={closeFlow}
      onBack={() => setStep(1)}
      body={
        <>
          <div className="otp-mini" style={{ margin: '8px 0' }}>
            {otpDigits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                data-filled={d ? 'true' : undefined}
                onChange={(e) => onOtpChange(i, e.target.value)}
                onKeyDown={(e) => onOtpKey(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <div className="row row-3" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px 8px' }}
              disabled={secsLeft > 0 || sending}
              onClick={resendOtp}
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
              {secsLeft > 0
                ? `Reenviar (00:${String(secsLeft).padStart(2, '0')})`
                : 'Reenviar código'}
            </button>
          </div>
          <div className="row row-2" style={{ marginTop: 4 }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: 'var(--state-resolved)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
              Auto-avance entre casillas · Backspace borra y retrocede
            </span>
          </div>
          {err && (
            <div className="alert alert-critical" style={{ padding: '10px 12px' }} role="alert">
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12 }}>{err}</div>
              </div>
            </div>
          )}
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!otpComplete || verifying}
          style={{ opacity: otpComplete ? 1 : 0.55 }}
          onClick={verifyOtp}
        >
          {verifying ? 'Verificando…' : 'Verificar'} <ArrowRight />
        </button>
      }
    />
  );

  // Step 3 — datos personales (nombres + cumpleaños + celular opcional)
  const renderStep3 = () => (
    <FlowShell
      step={3}
      totalSteps={3}
      stepLabel="3 / 3 · nuevo"
      title="Cuéntanos un poquito de ti"
      lead="Lo justo para registrarte. Lo demás puedes llenarlo después en Mi cuenta."
      onClose={closeFlow}
      onBack={() => setStep(2)}
      body={
        <>
          <div className="row row-2" style={{ gap: 10 }}>
            <div className="mini-field grow">
              <label htmlFor="i-nombres">Nombres</label>
              <input
                id="i-nombres"
                type="text"
                autoComplete="given-name"
                value={draft.nombres}
                onChange={(e) => setDraft((d) => ({ ...d, nombres: e.target.value }))}
              />
            </div>
            <div className="mini-field grow">
              <label htmlFor="i-apellidos">Apellidos</label>
              <input
                id="i-apellidos"
                type="text"
                autoComplete="family-name"
                value={draft.apellidos}
                onChange={(e) => setDraft((d) => ({ ...d, apellidos: e.target.value }))}
              />
            </div>
          </div>
          <div className="mini-field">
            <label htmlFor="i-fnac">Fecha de nacimiento</label>
            <input
              id="i-fnac"
              type="date"
              value={draft.fechaNacimiento}
              onChange={(e) => setDraft((d) => ({ ...d, fechaNacimiento: e.target.value }))}
            />
          </div>
          <div className="mini-field">
            <label htmlFor="i-barrio">¿En qué barrio vives?</label>
            <select
              id="i-barrio"
              value={draft.barrioId ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, barrioId: e.target.value ? Number(e.target.value) : null }))
              }
            >
              <option value="">Elige tu barrio</option>
              {barrios.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
            <span className="hint">Te mostramos primero los casos de tu zona.</span>
          </div>
          <div className="mini-field">
            <label htmlFor="i-dir">Dirección</label>
            <input
              id="i-dir"
              type="text"
              autoComplete="street-address"
              value={draft.direccion}
              onChange={(e) => setDraft((d) => ({ ...d, direccion: e.target.value }))}
              placeholder="Calle 30 # 13-45"
            />
          </div>
          <div className="row row-2" style={{ gap: 10 }}>
            <div className="mini-field grow">
              <label htmlFor="i-estrato">Estrato</label>
              <select
                id="i-estrato"
                value={draft.estrato}
                onChange={(e) => setDraft((d) => ({ ...d, estrato: Number(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="mini-field grow">
              <label htmlFor="i-hogar">Personas en el hogar</label>
              <input
                id="i-hogar"
                type="number"
                min={1}
                max={30}
                value={draft.miembrosHogar}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, miembrosHogar: Math.max(1, Math.min(30, Number(e.target.value) || 1)) }))
                }
              />
            </div>
          </div>
          <div className="mini-field">
            <label htmlFor="i-cel">Celular (opcional)</label>
            <input
              id="i-cel"
              type="tel"
              autoComplete="tel"
              value={draft.telefonoCelular}
              onChange={(e) => setDraft((d) => ({ ...d, telefonoCelular: e.target.value }))}
              placeholder="+57 300 000 0000"
            />
            <span className="hint">Para llamarte si tu caso lo amerita. No es obligatorio.</span>
          </div>
          <div
            className="toggle"
            data-on={draft.acceptaNotificaciones ? 'true' : 'false'}
            role="switch"
            aria-checked={draft.acceptaNotificaciones}
            tabIndex={0}
            onClick={() => setDraft((d) => ({ ...d, acceptaNotificaciones: !d.acceptaNotificaciones }))}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setDraft((d) => ({ ...d, acceptaNotificaciones: !d.acceptaNotificaciones }));
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <div className="toggle-text">Notifícame de mis casos</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                Por email cuando algo cambie.
              </div>
            </div>
            <div className="toggle-track" />
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 12,
              color: 'var(--ink-soft)',
              padding: '8px 0',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={draft.consentimientoHabeasData}
              onChange={(e) => setDraft((d) => ({ ...d, consentimientoHabeasData: e.target.checked }))}
              style={{ accentColor: 'var(--biss-teal)', marginTop: 2 }}
            />
            <span>
              Autorizo el tratamiento de mis datos personales conforme a la política de
              privacidad de BISS (Ley 1581 de 2012, Colombia).
            </span>
          </label>
          {err && (
            <div className="alert alert-critical" style={{ padding: '10px 12px' }} role="alert">
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12 }}>{err}</div>
              </div>
            </div>
          )}
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={
            saving ||
            draft.nombres.trim().length < 2 ||
            draft.apellidos.trim().length < 2 ||
            !draft.fechaNacimiento ||
            !draft.barrioId ||
            draft.direccion.trim().length < 4 ||
            !draft.consentimientoHabeasData
          }
          onClick={guardarCiudadano}
        >
          {saving ? 'Guardando…' : 'Entrar a BISS'} <Check />
        </button>
      }
    />
  );

  if (sesionLista) {
    return (
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-bar">
          <span className="sheet-bar-step" style={{ color: 'var(--cat-agua)' }}>
            <Check style={{ width: 13, height: 13, verticalAlign: -2 }} /> Sesión activa
          </span>
          <button type="button" className="x" aria-label="Cerrar" onClick={closeFlow}>
            <ArrowLeft style={{ display: 'none' }} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="confirm">
            <div
              className="confirm-mark"
              style={{ background: 'var(--cat-agua-bg)', color: 'var(--cat-agua)' }}
            >
              <Hand />
            </div>
            <div className="confirm-title">
              Hola, {draft.nombres || 'vecino'}
            </div>
            <div className="confirm-text">
              Ya estás dentro de BISS. Si quieres contar algo, toca{' '}
              <strong style={{ color: 'var(--ink-strong)' }}>Cuenta tu caso</strong>.
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <button type="button" className="btn btn-primary btn-block" onClick={closeFlow}>
            Empezar
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) return renderStep1();
  if (step === 2) return renderStep2();
  return renderStep3();
}
