import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Info,
  RefreshCw,
  CheckCircle2,
  Check,
  Hand,
} from 'lucide-react';

import { FlowShell, useFlowDraft } from './FlowShell';
import { useFlowDrawer } from '../../context/FlowDrawer';

interface IngresarDraft {
  celular: string;
  nombre: string;
  barrio: string;
  notificaciones: boolean;
}

const INITIAL: IngresarDraft = {
  celular: '',
  nombre: '',
  barrio: '',
  notificaciones: true,
};

export function FlowIngresar() {
  const { closeFlow } = useFlowDrawer();
  const [draft, setDraft, clearDraft] = useFlowDraft<IngresarDraft>('ingresar', INITIAL);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [secsLeft, setSecsLeft] = useState(60);
  const [sesionLista, setSesionLista] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step !== 2) return;
    setSecsLeft(60);
    const t = window.setInterval(() => {
      setSecsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [step]);

  const sendOtp = () => {
    // TODO: invocar edge function otp-send con el celular.
    setStep(2);
    setOtpDigits(['', '', '', '', '', '']);
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  };

  const verifyOtp = () => {
    // TODO: invocar edge function otp-verify; si user nuevo → step 3, si ya existe → cerrar.
    setStep(3);
  };

  const finishLogin = () => {
    // TODO: persistir sesión real (cookie + supabase.auth.setSession).
    clearDraft();
    setSesionLista(true);
  };

  const onOtpChange = (idx: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(0, 1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onOtpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const otpComplete = otpDigits.every((d) => d.length === 1);

  const renderStep1 = () => (
    <FlowShell
      step={1}
      totalSteps={3}
      title="Tu celular para enviarte el código"
      lead="Solo lo usamos para verificar que eres tú. Nunca lo mostramos público."
      onClose={closeFlow}
      body={
        <>
          <div className="mini-field">
            <label htmlFor="i-phone">Celular</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--biss-teal-900)',
                  background: 'var(--surface)',
                }}
              >
                +57
              </span>
              <input
                id="i-phone"
                type="tel"
                value={draft.celular}
                onChange={(e) => setDraft((d) => ({ ...d, celular: e.target.value }))}
                placeholder="300 000 0000"
                style={{ flex: 1 }}
              />
            </div>
            <span className="hint">El SMS puede tardar hasta 60 segundos.</span>
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
                Si ya tienes cuenta, el código te ingresa. Si no, te creamos una en el paso 3.
              </div>
            </div>
          </div>
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={draft.celular.replace(/\D/g, '').length < 7}
          onClick={sendOtp}
        >
          Enviar código <ArrowRight />
        </button>
      }
    />
  );

  const renderStep2 = () => (
    <FlowShell
      step={2}
      totalSteps={3}
      title="Pon el código que te llegó"
      lead={
        <>
          Enviamos un SMS a{' '}
          <strong style={{ color: 'var(--ink-strong)' }}>+57 {draft.celular}</strong>. Auto-llena
          si tu teclado lo detecta.
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
              disabled={secsLeft > 0}
              onClick={() => {
                // TODO: re-invocar edge function otp-send
                setSecsLeft(60);
              }}
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
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!otpComplete}
          style={{ opacity: otpComplete ? 1 : 0.55 }}
          onClick={verifyOtp}
        >
          Verificar <ArrowRight />
        </button>
      }
    />
  );

  const renderStep3 = () => (
    <FlowShell
      step={3}
      totalSteps={3}
      stepLabel="3 / 3 · nuevo"
      title="Cuéntanos un poquito de ti"
      lead="Solo dos cosas. Lo demás puedes llenarlo después en Mi cuenta."
      onClose={closeFlow}
      body={
        <>
          <div className="mini-field">
            <label htmlFor="i-name">¿Cómo te llamas?</label>
            <input
              id="i-name"
              type="text"
              value={draft.nombre}
              onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
            />
          </div>
          <div className="mini-field">
            <label htmlFor="i-barrio">¿En qué barrio vives?</label>
            <input
              id="i-barrio"
              type="text"
              value={draft.barrio}
              onChange={(e) => setDraft((d) => ({ ...d, barrio: e.target.value }))}
            />
            <span className="hint">Te mostramos primero los casos de tu zona.</span>
          </div>
          <div
            className="toggle"
            data-on={draft.notificaciones ? 'true' : 'false'}
            role="switch"
            aria-checked={draft.notificaciones}
            tabIndex={0}
            onClick={() => setDraft((d) => ({ ...d, notificaciones: !d.notificaciones }))}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setDraft((d) => ({ ...d, notificaciones: !d.notificaciones }));
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <div className="toggle-text">Notifícame de mis casos</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                Por SMS cuando algo cambie.
              </div>
            </div>
            <div className="toggle-track" />
          </div>
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={draft.nombre.trim().length < 2}
          onClick={finishLogin}
        >
          Entrar a BISS <Check />
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
            <div className="confirm-title">Hola, {draft.nombre || 'vecino'}</div>
            <div className="confirm-text">
              Te llevamos a casos cerca de{' '}
              <strong style={{ color: 'var(--ink-strong)' }}>{draft.barrio || 'Soledad'}</strong>.
              Si quieres contar algo, toca <strong style={{ color: 'var(--ink-strong)' }}>Cuenta tu caso</strong> arriba.
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
