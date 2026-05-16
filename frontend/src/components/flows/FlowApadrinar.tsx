import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  HandHeart,
  Check,
  Send,
  ShieldCheck,
  CircleDollarSign,
  Package,
  HardHat,
  Megaphone,
  MoreHorizontal,
} from 'lucide-react';

import { FlowShell, useFlowDraft } from './FlowShell';
import { useFlowDrawer } from '../../context/FlowDrawer';
import { useApadrinar } from '../../hooks/mutations/useApadrinar';
import type { TipoApoyo } from '../../types/biss';

interface ApadrinarDraft {
  nombre: string;
  tipoApoyo: TipoApoyo | '';
  descripcion: string;
  email: string;
  telefono: string;
  /** Honeypot: bots llenan campos no etiquetados; humanos no lo ven. */
  website: string;
}

const INITIAL: ApadrinarDraft = {
  nombre: '',
  tipoApoyo: '',
  descripcion: '',
  email: '',
  telefono: '',
  website: '',
};

const TIPOS: Array<{ codigo: TipoApoyo; label: string; Icon: typeof Package }> = [
  { codigo: 'financiero', label: 'Aporte financiero',   Icon: CircleDollarSign },
  { codigo: 'material',   label: 'Materiales o insumos', Icon: Package },
  { codigo: 'voluntario', label: 'Mano de obra · voluntariado', Icon: HardHat },
  { codigo: 'politico',   label: 'Gestión política o difusión', Icon: Megaphone },
  { codigo: 'otro',       label: 'Otro tipo de apoyo',  Icon: MoreHorizontal },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FlowApadrinar() {
  const { closeFlow, meta } = useFlowDrawer();
  const [draft, setDraft, clearDraft] = useFlowDraft<ApadrinarDraft>('apadrinar', INITIAL);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [err, setErr] = useState<string | null>(null);

  const apadrinar = useApadrinar();

  const enviar = async () => {
    setErr(null);

    // Honeypot: si tiene valor, es bot. Mensaje genérico para no enseñar.
    if (draft.website.trim().length > 0) {
      setErr('Error inesperado, intenta de nuevo.');
      return;
    }
    if (draft.nombre.trim().length < 3) {
      setErr('Pon tu nombre o el de tu organización (mínimo 3 caracteres).');
      return;
    }
    if (!draft.tipoApoyo) {
      setErr('Elige cómo quieres ayudar.');
      return;
    }
    if (draft.descripcion.trim().length < 30) {
      setErr('Cuéntanos un poco más (mínimo 30 caracteres).');
      return;
    }
    if (!EMAIL_RE.test(draft.email.trim())) {
      setErr('Revisa tu correo. Algo no cuadra con el formato.');
      return;
    }

    try {
      await apadrinar.mutateAsync({
        nombre: draft.nombre.trim(),
        tipo_apoyo: draft.tipoApoyo,
        descripcion: draft.descripcion.trim(),
        contacto_privado_email: draft.email.trim().toLowerCase(),
        contacto_privado_tel: draft.telefono.trim() || null,
        caso_id: meta.casoId ?? null,
        aporte_descripcion: draft.descripcion.trim(),
      });

      // TODO Sprint D: enviar email a contacto_privado_email confirmando recepción
      // + email a admin alertando nueva inscripción.

      clearDraft();
      setStep(3);
    } catch (e: unknown) {
      const msg = String((e as { message?: string })?.message ?? e);
      if (/duplicate/i.test(msg)) {
        setErr('Ya recibimos una inscripción con esos datos. Revisaremos pronto.');
      } else if (/row-level security|policy/i.test(msg)) {
        setErr('No pudimos registrar tu inscripción. Verifica los datos.');
      } else {
        setErr('Algo salió raro. Vuelve a intentarlo.');
      }
    }
  };

  // Step 1 — Intro
  const renderStep1 = () => (
    <FlowShell
      step={1}
      totalSteps={2}
      title={meta.casoTitulo ? `Quieres apadrinar este caso` : 'Quieres ayudar a Soledad'}
      lead="Padrinos son personas, empresas u organizaciones que aportan recursos para resolver casos. No necesitas cuenta — solo cuéntanos quién eres y cómo puedes ayudar."
      onClose={closeFlow}
      body={
        <>
          <div
            className="alert"
            style={{
              background: 'var(--state-resolved-bg)',
              border: '1px solid var(--state-resolved-border)',
              padding: '12px 14px',
            }}
          >
            <HandHeart
              className="alert-icon"
              style={{ width: 18, height: 18, color: 'var(--state-resolved)' }}
            />
            <div className="alert-body">
              <div className="alert-text" style={{ fontSize: 13, color: '#065F46', lineHeight: 1.5 }}>
                {meta.casoTitulo ? (
                  <>
                    Apadrinarás: <strong>{meta.casoTitulo}</strong>.
                    <br />
                    El equipo de Kevin te contactará para coordinar.
                  </>
                ) : (
                  <>El equipo de Kevin te contactará para coordinar tu aporte.</>
                )}
              </div>
            </div>
          </div>
          <div
            className="alert"
            style={{
              background: 'var(--state-info-bg)',
              border: '1px solid var(--state-info-border)',
              padding: '10px 12px',
            }}
          >
            <ShieldCheck
              className="alert-icon"
              style={{ width: 16, height: 16, color: 'var(--biss-teal-900)' }}
            />
            <div className="alert-body">
              <div className="alert-text" style={{ fontSize: 12, color: 'var(--biss-teal-900)' }}>
                Tu inscripción pasa por moderación. No publicamos tus datos sin revisarlos.
              </div>
            </div>
          </div>
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => setStep(2)}
        >
          Continuar <ArrowRight />
        </button>
      }
    />
  );

  // Step 2 — Datos
  const renderStep2 = () => (
    <FlowShell
      step={2}
      totalSteps={2}
      title="Cuéntanos quién eres"
      lead="El email es el canal por donde te contactaremos. El teléfono es opcional."
      onClose={closeFlow}
      onBack={() => setStep(1)}
      body={
        <>
          <div className="mini-field">
            <label htmlFor="a-name">Tu nombre o el de tu organización</label>
            <input
              id="a-name"
              type="text"
              autoComplete="organization"
              value={draft.nombre}
              onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
              placeholder="Ej. Ferretería Don Iván S.A.S."
            />
          </div>

          <div className="mini-field">
            <label htmlFor="a-tipo">¿Cómo puedes ayudar?</label>
            <select
              id="a-tipo"
              value={draft.tipoApoyo}
              onChange={(e) => setDraft((d) => ({ ...d, tipoApoyo: e.target.value as TipoApoyo | '' }))}
            >
              <option value="">Elige una opción</option>
              {TIPOS.map((t) => (
                <option key={t.codigo} value={t.codigo}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="mini-field">
            <label htmlFor="a-desc">¿Cómo puedes ayudar en este caso?</label>
            <textarea
              id="a-desc"
              style={{ minHeight: 100 }}
              value={draft.descripcion}
              onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
              placeholder="Ej. Puedo aportar 20 sacos de cemento y mano de obra el fin de semana."
            />
            <span className="hint">
              {draft.descripcion.length < 30
                ? `Mínimo 30 caracteres. Vas en ${draft.descripcion.length}.`
                : `${draft.descripcion.length} caracteres.`}
            </span>
          </div>

          <div className="mini-field">
            <label htmlFor="a-email">Correo de contacto</label>
            <input
              id="a-email"
              type="email"
              autoComplete="email"
              value={draft.email}
              onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              placeholder="contacto@empresa.co"
            />
            <span className="hint">Privado. Solo lo ve el equipo de BISS.</span>
          </div>

          <div className="mini-field">
            <label htmlFor="a-phone">Celular (opcional)</label>
            <input
              id="a-phone"
              type="tel"
              autoComplete="tel"
              value={draft.telefono}
              onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))}
              placeholder="+57 300 000 0000"
            />
          </div>

          {/* Honeypot: bots llenan campos no visibles. CSS y atributos lo ocultan. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={draft.website}
            onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
            style={{ display: 'none' }}
          />

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
        <div className="row row-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setStep(1)}
            disabled={apadrinar.isPending}
          >
            <ArrowLeft />Atrás
          </button>
          <button
            type="button"
            className="btn btn-primary grow"
            style={{
              ['--btn-bg' as never]: 'var(--state-resolved)',
              ['--btn-border' as never]: 'var(--state-resolved)',
              ['--btn-bg-hover' as never]: '#0E8A50',
              ['--btn-ink' as never]: '#FFFFFF',
            }}
            disabled={apadrinar.isPending}
            onClick={enviar}
          >
            {apadrinar.isPending ? 'Enviando…' : 'Enviar inscripción'} <Send />
          </button>
        </div>
      }
    />
  );

  if (step === 3) {
    return (
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-bar">
          <span className="sheet-bar-step" style={{ color: 'var(--state-resolved)' }}>
            <Check style={{ width: 13, height: 13, verticalAlign: -2 }} /> Enviado
          </span>
          <button type="button" className="x" aria-label="Cerrar" onClick={closeFlow}>
            <ArrowLeft style={{ display: 'none' }} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="confirm">
            <div
              className="confirm-mark"
              style={{ background: 'var(--state-resolved-bg)', color: 'var(--state-resolved)' }}
            >
              <HandHeart />
            </div>
            <div className="confirm-title">Listo, recibimos tu inscripción</div>
            <div className="confirm-text">
              Revisaremos tus datos y te contactaremos al correo que diste. Gracias por querer
              ayudar a Soledad.
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <button type="button" className="btn btn-primary btn-block" onClick={closeFlow}>
            Volver al caso
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) return renderStep1();
  return renderStep2();
}
