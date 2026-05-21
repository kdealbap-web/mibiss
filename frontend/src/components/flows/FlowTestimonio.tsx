import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Home as HomeIcon,
  Heart,
  Eye,
  Briefcase,
  User,
  CheckCircle2,
  Info,
  Shield,
  Send,
  MessageSquareQuote,
  Check,
  LogIn,
} from 'lucide-react';

import { FlowShell, useFlowDraft } from './FlowShell';
import { useFlowDrawer } from '../../context/FlowDrawer';
import { useSumarTestimonio } from '../../hooks/mutations/useSumarTestimonio';
import { useMiPerfil } from '../../hooks/useMiCuenta';
import type { RelacionTestimonio } from '../../types/biss';

type Rol = 'vecino' | 'familia' | 'testigo' | 'profesional' | 'prefiere-no-decir';

interface TestimonioDraft {
  rol: Rol | null;
  historia: string;
  nombre: string;
  barrio: string;
  anonimo: boolean;
}

const INITIAL: TestimonioDraft = {
  rol: null,
  historia: '',
  nombre: '',
  barrio: '',
  anonimo: false,
};

const ROLES: Array<{
  codigo: Rol;
  title: string;
  sub: string;
  color: string;
  Icon: typeof HomeIcon;
}> = [
  { codigo: 'vecino', title: 'Soy vecino del barrio', sub: 'Vivo cerca y me afecta', color: 'var(--cat-social)', Icon: HomeIcon },
  { codigo: 'familia', title: 'Soy familia afectada', sub: 'Le pasó a alguien cercano', color: 'var(--cat-salud)', Icon: Heart },
  { codigo: 'testigo', title: 'Pasé por ahí ese día', sub: 'Lo vi, soy testigo', color: 'var(--cat-agua)', Icon: Eye },
  { codigo: 'profesional', title: 'Soy profesional involucrado', sub: 'Médico, docente, líder social…', color: 'var(--cat-educacion)', Icon: Briefcase },
  { codigo: 'prefiere-no-decir', title: 'Prefiero no decir', sub: 'Igual cuenta tu historia', color: 'var(--cat-otros)', Icon: User },
];

// rol del prototipo → enum DB testimonios.relacion
const ROL_TO_RELACION: Record<string, RelacionTestimonio> = {
  vecino: 'vecino',
  familia: 'familiar',
  testigo: 'otro',
  profesional: 'lider',
  'prefiere-no-decir': 'otro',
};

export function FlowTestimonio() {
  const { closeFlow, meta } = useFlowDrawer();
  const navigate = useNavigate();
  const [draft, setDraft, clearDraft] = useFlowDraft<TestimonioDraft>('testimonio', INITIAL);
  const [step, setStep] = useState(1);
  const [enviado, setEnviado] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const { data: miPerfil } = useMiPerfil();
  const sumar = useSumarTestimonio();

  const goToLogin = () => {
    const returnTo = window.location.pathname + window.location.search;
    closeFlow();
    navigate(`/login?return=${encodeURIComponent(returnTo)}`);
  };

  const renderStep1 = () => (
    <FlowShell
      step={1}
      totalSteps={3}
      title="¿Quién eres tú aquí?"
      lead="Tu rol nos ayuda a entender la historia. No es público."
      onClose={closeFlow}
      body={
        <>
          {ROLES.map((r) => {
            const selected = draft.rol === r.codigo;
            return (
              <button
                key={r.codigo}
                type="button"
                className="pick"
                data-state={selected ? 'selected' : undefined}
                onClick={() => setDraft((d) => ({ ...d, rol: r.codigo }))}
              >
                <div className="pick-icon" style={{ background: r.color }}>
                  <r.Icon style={{ width: 18, height: 18 }} />
                </div>
                <div className="pick-body">
                  <div className="pick-title">{r.title}</div>
                  <div className="pick-sub">{r.sub}</div>
                </div>
                <CheckCircle2 className="pick-check" />
              </button>
            );
          })}
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!draft.rol}
          onClick={() => setStep(2)}
        >
          Continuar <ArrowRight />
        </button>
      }
    />
  );

  const renderStep2 = () => (
    <FlowShell
      step={2}
      totalSteps={3}
      title="¿Qué pasó? ¿Qué sentiste?"
      lead="Cuéntalo en tus palabras. Lo que viste, lo que viviste, cómo te afectó."
      onClose={closeFlow}
      onBack={() => setStep(1)}
      body={
        <>
          <div className="mini-field">
            <label htmlFor="t-story">Tu historia</label>
            <textarea
              id="t-story"
              style={{ minHeight: 140 }}
              value={draft.historia}
              onChange={(e) => setDraft((d) => ({ ...d, historia: e.target.value }))}
            />
            <span className="hint">
              {draft.historia.length} caracteres · sin límite máximo
            </span>
          </div>
          <div className="row row-2" style={{ padding: '2px 0' }}>
            <Info style={{ width: 14, height: 14, color: 'var(--biss-teal-900)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
              Sin tecnicismos. Una historia vale más que una queja.
            </span>
          </div>
        </>
      }
      footer={
        <div className="row row-2">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
            <ArrowLeft />Atrás
          </button>
          <button
            type="button"
            className="btn btn-primary grow"
            disabled={draft.historia.trim().length < 20}
            onClick={() => setStep(3)}
          >
            Continuar <ArrowRight />
          </button>
        </div>
      }
    />
  );

  const renderStep3 = () => {
    const publicar = async () => {
      setSubmitError(null);
      setNeedsLogin(false);
      try {
        if (!draft.rol) throw new Error('Falta rol');
        if (draft.historia.trim().length < 20) {
          throw new Error('Tu historia debe tener al menos 20 caracteres.');
        }

        // Sin sesión, ciudadano_id va NULL (RLS p_testimonios_insert_anon).
        // Con sesión, va el id del perfil para que el testimonio quede
        // vinculado en /mi-cuenta y respete RLS p_testimonios_insert_self.
        const firmarComo = draft.anonimo
          ? null
          : draft.nombre.trim() ||
            (miPerfil ? `${miPerfil.nombres} ${miPerfil.apellidos}`.trim() : '');

        await sumar.mutateAsync({
          ciudadano_id: miPerfil?.id ?? null,
          capitulo_id: meta.capituloId ?? null,
          caso_id: meta.casoId ?? null,
          firmar_como: firmarComo || null,
          relacion: ROL_TO_RELACION[draft.rol] ?? 'otro',
          mensaje: draft.historia.trim(),
        });
        clearDraft();
        setEnviado(true);
      } catch (e: unknown) {
        const err = e as { message?: string; code?: string; details?: string };
        const msg = err.message ?? '';
        const detail = err.details ?? '';
        // eslint-disable-next-line no-console
        console.error('[testimonio] INSERT error', { msg, code: err.code, detail });
        if (/al menos 20/i.test(msg)) {
          setSubmitError(msg);
        } else if (/asociado a un caso o a un cap/i.test(msg)) {
          setSubmitError('Sumamos testimonios desde un caso o un capítulo. Vuelve atrás y elige uno.');
        } else if (/length|chk_testimonios/i.test(msg) || /chk_testimonios/i.test(detail)) {
          setSubmitError('Tu mensaje debe tener entre 20 y 1500 caracteres.');
        } else if (err.code === '42501' || /row-level|policy/i.test(msg)) {
          setSubmitError('No pudimos publicar tu testimonio. Si ya tenías cuenta, vuelve a iniciar sesión.');
          setNeedsLogin(true);
        } else {
          setSubmitError(msg ? `No pudimos publicar: ${msg}` : 'Algo salió raro. Vuelve a intentarlo.');
        }
      }
    };
    return (
      <FlowShell
        step={3}
        totalSteps={3}
        title="¿Cómo firmas?"
        lead={miPerfil
          ? 'Puedes firmar con tu nombre o ir anónimo. Tú decides.'
          : 'No necesitas cuenta. Pon tu nombre o publica anónimo.'}
        onClose={closeFlow}
        onBack={() => setStep(2)}
        body={
          <>
            <div className="mini-field">
              <label htmlFor="t-name">Tu nombre</label>
              <input
                id="t-name"
                type="text"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                disabled={draft.anonimo}
              />
              <span className="hint">Aparecerá como autora del testimonio.</span>
            </div>
            <div className="mini-field">
              <label htmlFor="t-zone">¿De qué barrio eres?</label>
              <input
                id="t-zone"
                type="text"
                value={draft.barrio}
                onChange={(e) => setDraft((d) => ({ ...d, barrio: e.target.value }))}
              />
              <span className="hint">Opcional. Da contexto a tu voz.</span>
            </div>
            <div
              className="toggle"
              data-on={draft.anonimo ? 'true' : 'false'}
              role="switch"
              aria-checked={draft.anonimo}
              tabIndex={0}
              onClick={() => setDraft((d) => ({ ...d, anonimo: !d.anonimo }))}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setDraft((d) => ({ ...d, anonimo: !d.anonimo }));
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div className="toggle-text">Prefiero ser anónimo</div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                  Tu historia se publica sin nombre.
                </div>
              </div>
              <div className="toggle-track" />
            </div>
            <div
              className="alert"
              style={{
                background: 'var(--state-info-bg)',
                border: '1px solid var(--state-info-border)',
                padding: '10px 12px',
              }}
            >
              <Shield
                className="alert-icon"
                style={{ width: 16, height: 16, color: 'var(--biss-teal-900)' }}
              />
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12, color: 'var(--biss-teal-900)' }}>
                  {miPerfil
                    ? 'Tu testimonio entra a moderación. Solo lo aprobamos cuando confirmamos que cuenta una historia real.'
                    : 'Puedes sumar tu voz sin registrarte. Tu testimonio entra a moderación antes de aparecer.'}
                </div>
              </div>
            </div>
            {submitError && (
              <div
                className="alert alert-critical"
                style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}
                role="alert"
              >
                <div className="alert-body">
                  <div className="alert-text" style={{ fontSize: 12 }}>{submitError}</div>
                </div>
                {needsLogin && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={goToLogin}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <LogIn size={14} /> Iniciar sesión
                  </button>
                )}
              </div>
            )}
          </>
        }
        footer={
          <div className="row row-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setStep(2)}
              disabled={sumar.isPending}
            >
              <ArrowLeft />Atrás
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              style={{
                ['--btn-bg' as never]: 'var(--cat-social)',
                ['--btn-border' as never]: 'var(--cat-social)',
                ['--btn-bg-hover' as never]: '#B00752',
                ['--btn-ink' as never]: '#FFFFFF',
              }}
              disabled={
                sumar.isPending ||
                (!draft.anonimo && draft.nombre.trim().length < 2)
              }
              onClick={publicar}
            >
              {sumar.isPending ? 'Publicando…' : 'Publicar testimonio'} <Send />
            </button>
          </div>
        }
      />
    );
  };

  if (enviado) {
    return (
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-bar">
          <span className="sheet-bar-step" style={{ color: 'var(--state-resolved)' }}>
            <Check style={{ width: 13, height: 13, verticalAlign: -2 }} /> Publicado
          </span>
          <button type="button" className="x" aria-label="Cerrar" onClick={closeFlow}>
            <ArrowLeft style={{ display: 'none' }} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="confirm">
            <div
              className="confirm-mark"
              style={{ background: 'var(--cat-social-bg)', color: 'var(--cat-social)' }}
            >
              <MessageSquareQuote />
            </div>
            <div className="confirm-title">Gracias por sumar tu voz</div>
            <div className="confirm-text">
              {meta.casoFolio ? (
                <>
                  Tu testimonio entra a revisión para el caso{' '}
                  <strong>{meta.casoFolio}</strong>. Cuando lo aprobemos, aparece en el caso.
                </>
              ) : (
                <>
                  Tu testimonio entra a revisión. Cuando lo aprobemos, aparece en el caso. Suele
                  tomar 12 a 24 horas.
                </>
              )}
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
  if (step === 2) return renderStep2();
  return renderStep3();
}
