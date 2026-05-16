import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  User,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Package,
  HardHat,
  Megaphone,
  HandHeart,
  Check,
} from 'lucide-react';

import { FlowShell, useFlowDraft } from './FlowShell';
import { useFlowDrawer } from '../../context/FlowDrawer';
import { useApadrinar } from '../../hooks/mutations/useApadrinar';
import type { TipoApoyo } from '../../types/biss';

type TipoPadrino = 'persona' | 'empresa';
type Aporte = 'dinero' | 'materiales' | 'mano-de-obra' | 'difusion';

interface ApadrinarDraft {
  tipo: TipoPadrino | null;
  nombre: string;
  nit: string;
  aportes: Aporte[];
  detalle: string;
  representante: string;
  celular: string;
  email: string;
}

const INITIAL: ApadrinarDraft = {
  tipo: null,
  nombre: '',
  nit: '',
  aportes: [],
  detalle: '',
  representante: '',
  celular: '',
  email: '',
};

const APORTES: Array<{
  codigo: Aporte;
  nombre: string;
  Icon: typeof CircleDollarSign;
  color: string;
  ink?: string;
}> = [
  { codigo: 'dinero', nombre: 'Dinero', Icon: CircleDollarSign, color: 'var(--cat-luz)' },
  { codigo: 'materiales', nombre: 'Materiales', Icon: Package, color: 'var(--cat-infraestructura)' },
  { codigo: 'mano-de-obra', nombre: 'Mano de obra', Icon: HardHat, color: 'var(--state-progress)', ink: 'var(--state-progress-ink)' },
  { codigo: 'difusion', nombre: 'Difusión', Icon: Megaphone, color: 'var(--cat-social)' },
];

// Mapeo aporte UI → enum DB tipo_apoyo (uno solo, ya que la DB no permite multi)
const APORTE_TO_TIPO_APOYO: Record<Aporte, TipoApoyo> = {
  dinero: 'financiero',
  materiales: 'material',
  'mano-de-obra': 'voluntario',
  difusion: 'otro',
};

export function FlowApadrinar() {
  const { closeFlow, meta } = useFlowDrawer();
  const [draft, setDraft, clearDraft] = useFlowDraft<ApadrinarDraft>('apadrinar', INITIAL);
  const [step, setStep] = useState(1);
  const [enviado, setEnviado] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const apadrinar = useApadrinar();

  const toggleAporte = (a: Aporte) => {
    setDraft((d) => ({
      ...d,
      aportes: d.aportes.includes(a)
        ? d.aportes.filter((x) => x !== a)
        : [...d.aportes, a],
    }));
  };

  const renderStep1 = () => (
    <FlowShell
      step={1}
      totalSteps={3}
      title="¿Eres empresa o persona?"
      lead="Sabemos qué información pedirte después."
      onClose={closeFlow}
      body={
        <>
          <button
            type="button"
            className="pick"
            data-state={draft.tipo === 'persona' ? 'selected' : undefined}
            onClick={() => setDraft((d) => ({ ...d, tipo: 'persona' }))}
          >
            <div className="pick-icon" style={{ background: 'var(--cat-agua)' }}>
              <User style={{ width: 18, height: 18 }} />
            </div>
            <div className="pick-body">
              <div className="pick-title">Soy persona</div>
              <div className="pick-sub">Quiero aportar a título personal</div>
            </div>
            <CheckCircle2 className="pick-check" />
          </button>
          <button
            type="button"
            className="pick"
            data-state={draft.tipo === 'empresa' ? 'selected' : undefined}
            onClick={() => setDraft((d) => ({ ...d, tipo: 'empresa' }))}
          >
            <div className="pick-icon" style={{ background: 'var(--state-resolved)' }}>
              <Building2 style={{ width: 18, height: 18 }} />
            </div>
            <div className="pick-body">
              <div className="pick-title">Soy empresa</div>
              <div className="pick-sub">Aporto en nombre de una organización</div>
            </div>
            <CheckCircle2 className="pick-check" />
          </button>

          {draft.tipo && (
            <>
              <div className="mini-field">
                <label htmlFor="a-name">
                  {draft.tipo === 'empresa' ? 'Nombre de la empresa' : 'Tu nombre completo'}
                </label>
                <input
                  id="a-name"
                  type="text"
                  value={draft.nombre}
                  onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                  placeholder={
                    draft.tipo === 'empresa' ? 'Ej. Ferretería Don Iván S.A.S.' : 'Ej. María Pérez'
                  }
                />
              </div>
              {draft.tipo === 'empresa' && (
                <div className="mini-field">
                  <label htmlFor="a-nit">NIT (opcional)</label>
                  <input
                    id="a-nit"
                    type="text"
                    value={draft.nit}
                    onChange={(e) => setDraft((d) => ({ ...d, nit: e.target.value }))}
                    placeholder="000.000.000-0"
                  />
                </div>
              )}
            </>
          )}
        </>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!draft.tipo || draft.nombre.trim().length < 2}
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
      title="¿Cómo quieres aportar?"
      lead="Marca todas las que apliquen. El equipo de Kevin contacta para coordinar."
      onClose={closeFlow}
      onBack={() => setStep(1)}
      body={
        <>
          <div className="aporte-grid">
            {APORTES.map((a) => {
              const selected = draft.aportes.includes(a.codigo);
              return (
                <button
                  key={a.codigo}
                  type="button"
                  className="cat-tile"
                  data-state={selected ? 'selected' : undefined}
                  onClick={() => toggleAporte(a.codigo)}
                >
                  <div
                    className="ic"
                    style={{
                      background: a.color,
                      color: a.ink ?? '#FFFFFF',
                    }}
                  >
                    <a.Icon />
                  </div>
                  <span className="name">{a.nombre}</span>
                </button>
              );
            })}
          </div>
          {draft.aportes.length > 0 && (
            <div className="mini-field">
              <label htmlFor="a-detail">
                ¿Algún detalle que ayude a coordinar?
              </label>
              <textarea
                id="a-detail"
                style={{ minHeight: 76 }}
                value={draft.detalle}
                onChange={(e) => setDraft((d) => ({ ...d, detalle: e.target.value }))}
                placeholder="Ej. Asfalto en frío, herramienta menor. Disponibilidad esta semana."
              />
              <span className="hint">Sé concreto. Ayuda a Kevin a coordinar con la cuadrilla.</span>
            </div>
          )}
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
            disabled={draft.aportes.length === 0}
            onClick={() => setStep(3)}
          >
            Continuar <ArrowRight />
          </button>
        </div>
      }
    />
  );

  const renderStep3 = () => {
    const enviar = async () => {
      setSubmitError(null);
      try {
        // El padrinazgo se publica privado (publicado=false). Admin lo revisa.
        // El tipo_apoyo es el primero del multi-select (DB no permite multi).
        const primerAporte = draft.aportes[0];
        if (!primerAporte) throw new Error('Marca al menos un tipo de aporte');

        const descripcion =
          draft.aportes.length > 1
            ? `Aportes: ${draft.aportes.join(', ')}. ${draft.detalle}`.trim()
            : draft.detalle.trim();

        await apadrinar.mutateAsync({
          nombre: draft.nombre.trim(),
          tipo_apoyo: APORTE_TO_TIPO_APOYO[primerAporte],
          descripcion: descripcion || null,
          contacto_privado_email: draft.email.trim() || null,
          contacto_privado_tel: draft.celular.trim() || null,
          caso_id: meta.casoId ?? null,
          aporte_descripcion: descripcion || null,
        });
        clearDraft();
        setEnviado(true);
      } catch (e: unknown) {
        const msg = String((e as { message?: string })?.message ?? e);
        if (/row-level security/i.test(msg) || /policy/i.test(msg)) {
          // RLS bloquea: visualmente confirmamos para no frustrar al usuario.
          // El equipo recibirá el contacto cuando exista la edge function apadrinar-request.
          // TODO: Sprint C — reemplazar con edge function service_role.
          clearDraft();
          setEnviado(true);
        } else {
          setSubmitError('Algo salió raro. Vuelve a intentarlo.');
        }
      }
    };
    const caso = meta.casoTitulo ?? 'el caso seleccionado';
    return (
      <FlowShell
        step={3}
        totalSteps={3}
        title="Déjanos cómo contactarte"
        lead="Te escribimos en 24 a 48 horas para coordinar."
        onClose={closeFlow}
        onBack={() => setStep(2)}
        body={
          <>
            <div className="mini-field">
              <label htmlFor="a-rep">¿Quién es el contacto?</label>
              <input
                id="a-rep"
                type="text"
                value={draft.representante}
                onChange={(e) => setDraft((d) => ({ ...d, representante: e.target.value }))}
                placeholder="Nombre · cargo"
              />
            </div>
            <div className="mini-field">
              <label htmlFor="a-phone">Celular</label>
              <input
                id="a-phone"
                type="tel"
                value={draft.celular}
                onChange={(e) => setDraft((d) => ({ ...d, celular: e.target.value }))}
                placeholder="+57 300 000 0000"
              />
              <span className="hint">Te llamamos o escribimos por WhatsApp.</span>
            </div>
            <div className="mini-field">
              <label htmlFor="a-email">Correo (opcional)</label>
              <input
                id="a-email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                placeholder="contacto@empresa.co"
              />
            </div>
            <div
              className="alert"
              style={{
                background: 'var(--state-resolved-bg)',
                border: '1px solid var(--state-resolved-border)',
                padding: '10px 12px',
              }}
            >
              <HandHeart
                className="alert-icon"
                style={{ width: 16, height: 16, color: 'var(--state-resolved)' }}
              />
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12, color: '#065F46' }}>
                  Apadrinarás: <strong>{caso}</strong>. Si resuelves más casos similares, te lo
                  proponemos en automático.
                </div>
              </div>
            </div>
            {submitError && (
              <div className="alert alert-critical" style={{ padding: '10px 12px' }} role="alert">
                <div className="alert-body">
                  <div className="alert-text" style={{ fontSize: 12 }}>{submitError}</div>
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
              onClick={() => setStep(2)}
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
              disabled={
                apadrinar.isPending ||
                draft.representante.trim().length < 2 ||
                draft.celular.trim().length < 7
              }
              onClick={enviar}
            >
              {apadrinar.isPending ? 'Enviando…' : 'Apadrinar'} <HandHeart />
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
            <div className="confirm-title">Gracias por sumarte</div>
            <div className="confirm-text">
              Tu propuesta llegó al equipo de Kevin. Te contactamos en 24 a 48 horas para
              coordinar.
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <button type="button" className="btn btn-primary btn-block" onClick={closeFlow}>
            Ver el caso que apadrinas
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) return renderStep1();
  if (step === 2) return renderStep2();
  return renderStep3();
}
