import { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Droplets,
  Lightbulb,
  Construction,
  Heart,
  GraduationCap,
  TreePine,
  Users,
  MoreHorizontal,
  LocateFixed,
  MapPin,
  Plus,
  Info,
  ShieldCheck,
  Send,
  Check,
  Share2,
} from 'lucide-react';

import { FlowShell, useFlowDraft } from './FlowShell';
import { useFlowDrawer } from '../../context/FlowDrawer';

type Categoria =
  | 'agua' | 'luz' | 'infraestructura' | 'salud'
  | 'educacion' | 'medio-ambiente' | 'social' | 'otros';

interface ReportarDraft {
  categoria: Categoria | null;
  titulo: string;
  descripcion: string;
  ubicacionLabel: string;
  ubicacionDetalle: string;
  /** File objects no son serializables a JSON → guardamos solo metadatos en draft */
  fotosMeta: Array<{ name: string; size: number; type: string }>;
}

const INITIAL: ReportarDraft = {
  categoria: null,
  titulo: '',
  descripcion: '',
  ubicacionLabel: '',
  ubicacionDetalle: '',
  fotosMeta: [],
};

const CATS: Array<{ codigo: Categoria; nombre: string; color: string; Icon: typeof Droplets }> = [
  { codigo: 'agua', nombre: 'Agua', color: 'var(--cat-agua)', Icon: Droplets },
  { codigo: 'luz', nombre: 'Luz', color: 'var(--cat-luz)', Icon: Lightbulb },
  { codigo: 'infraestructura', nombre: 'Infraestructura', color: 'var(--cat-infraestructura)', Icon: Construction },
  { codigo: 'salud', nombre: 'Salud', color: 'var(--cat-salud)', Icon: Heart },
  { codigo: 'educacion', nombre: 'Educación', color: 'var(--cat-educacion)', Icon: GraduationCap },
  { codigo: 'medio-ambiente', nombre: 'Medio ambiente', color: 'var(--cat-medio-ambiente)', Icon: TreePine },
  { codigo: 'social', nombre: 'Social', color: 'var(--cat-social)', Icon: Users },
  { codigo: 'otros', nombre: 'Otros', color: 'var(--cat-otros)', Icon: MoreHorizontal },
];

function generarFolioLocal(): string {
  const año = new Date().getFullYear();
  const n = String(Math.floor(1000 + Math.random() * 9000));
  return `CS-${año}-${n}`;
}

export function FlowReportar() {
  const { closeFlow } = useFlowDrawer();
  const [draft, setDraft, clearDraft] = useFlowDraft<ReportarDraft>('reportar', INITIAL);
  const [step, setStep] = useState(1);
  const [folio, setFolio] = useState<string | null>(null);
  // Files locales — fuera del draft serializado (no se pueden serializar a JSON).
  const [fotos, setFotos] = useState<File[]>([]);

  const onClose = () => {
    closeFlow();
  };

  // Step 1 — categoría
  const renderStep1 = () => (
    <FlowShell
      step={1}
      totalSteps={5}
      title="¿Qué tipo de problema es?"
      lead="Elige la categoría que mejor describe lo que pasa."
      onClose={onClose}
      body={
        <div className="cat-grid">
          {CATS.map((c) => {
            const selected = draft.categoria === c.codigo;
            return (
              <button
                key={c.codigo}
                type="button"
                className="cat-tile"
                data-state={selected ? 'selected' : undefined}
                onClick={() => setDraft((d) => ({ ...d, categoria: c.codigo }))}
              >
                <div className="ic" style={{ background: c.color }}>
                  <c.Icon />
                </div>
                <span className="name">{c.nombre}</span>
              </button>
            );
          })}
        </div>
      }
      footer={
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!draft.categoria}
          onClick={() => setStep(2)}
        >
          Continuar <ArrowRight />
        </button>
      }
    />
  );

  // Step 2 — título + descripción
  const renderStep2 = () => {
    const descLen = draft.descripcion.length;
    return (
      <FlowShell
        step={2}
        totalSteps={5}
        title="Cuéntanos qué está pasando"
        lead="Sin tecnicismos. Como se lo contarías a un vecino."
        onClose={onClose}
        onBack={() => setStep(1)}
        body={
          <>
            <div className="mini-field">
              <label htmlFor="r-titulo">Título corto</label>
              <input
                id="r-titulo"
                type="text"
                value={draft.titulo}
                onChange={(e) => setDraft((d) => ({ ...d, titulo: e.target.value }))}
                placeholder="Ej. Cráter en la calle 30"
              />
            </div>
            <div className="mini-field">
              <label htmlFor="r-desc">Qué pasó</label>
              <textarea
                id="r-desc"
                value={draft.descripcion}
                onChange={(e) => setDraft((d) => ({ ...d, descripcion: e.target.value }))}
                placeholder="Describe en tus palabras lo que está pasando."
              />
              <span className="hint">
                {descLen < 30
                  ? `Mínimo 30 caracteres. Vas en ${descLen}.`
                  : `${descLen} caracteres.`}
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
              disabled={draft.titulo.trim().length < 4 || draft.descripcion.trim().length < 30}
              onClick={() => setStep(3)}
            >
              Continuar <ArrowRight />
            </button>
          </div>
        }
      />
    );
  };

  // Step 3 — ubicación (placeholder mini-map; pin draggeable real va en próximo ciclo)
  const renderStep3 = () => {
    const cat = CATS.find((c) => c.codigo === draft.categoria);
    return (
      <FlowShell
        step={3}
        totalSteps={5}
        title="Marca dónde queda"
        lead="Toca el mapa o usa tu ubicación. Mueve el pin para ajustar."
        onClose={onClose}
        onBack={() => setStep(2)}
        body={
          <>
            <div className="mini-map">
              <div
                className="pin"
                style={{
                  background: cat?.color ?? 'var(--cat-otros)',
                  top: '44%',
                  left: '48%',
                }}
              >
                {cat && <cat.Icon style={{ width: 14, height: 14 }} />}
              </div>
            </div>
            <button
              type="button"
              className="chip"
              style={{ alignSelf: 'flex-start' }}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  ubicacionLabel: 'Tu ubicación actual',
                  ubicacionDetalle: '(detectada por GPS)',
                }))
              }
            >
              <LocateFixed style={{ color: 'var(--biss-teal)' }} />Usar mi ubicación actual
            </button>
            <div className="row row-3" style={{ padding: '4px 4px 0' }}>
              <MapPin
                style={{ width: 16, height: 16, color: 'var(--biss-teal-900)' }}
              />
              <div>
                <input
                  type="text"
                  value={draft.ubicacionLabel}
                  onChange={(e) => setDraft((d) => ({ ...d, ubicacionLabel: e.target.value }))}
                  placeholder="Barrio (ej. Soledad 2000)"
                  style={{
                    border: 0,
                    background: 'transparent',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--ink-strong)',
                    width: '100%',
                  }}
                />
                <input
                  type="text"
                  value={draft.ubicacionDetalle}
                  onChange={(e) => setDraft((d) => ({ ...d, ubicacionDetalle: e.target.value }))}
                  placeholder="Calle o referencia (ej. Calle 30 × Carrera 18)"
                  style={{
                    border: 0,
                    background: 'transparent',
                    fontSize: 11,
                    color: 'var(--ink-soft)',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </>
        }
        footer={
          <div className="row row-2">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
              <ArrowLeft />Atrás
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              disabled={draft.ubicacionLabel.trim().length < 3}
              onClick={() => setStep(4)}
            >
              Continuar <ArrowRight />
            </button>
          </div>
        }
      />
    );
  };

  // Step 4 — fotos (selección local; upload real va con R2 en próximo ciclo)
  const renderStep4 = () => {
    const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
      const list = Array.from(e.target.files ?? []).slice(0, 6 - fotos.length);
      const next = [...fotos, ...list].slice(0, 6);
      setFotos(next);
      setDraft((d) => ({
        ...d,
        fotosMeta: next.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      }));
    };
    const previews = fotos.map((f) => URL.createObjectURL(f));
    return (
      <FlowShell
        step={4}
        totalSteps={5}
        title="Si tienes fotos, súbelas"
        lead="Hasta 6 fotos o un video corto. Si no tienes, puedes saltarte este paso."
        onClose={onClose}
        onBack={() => setStep(3)}
        body={
          <>
            <div className="photo-grid">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="photo-thumb"
                  style={{
                    backgroundImage: `url(${src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'transparent',
                  }}
                >
                  FOTO {String(i + 1).padStart(2, '0')}
                </div>
              ))}
              {fotos.length < 6 && (
                <label className="photo-add" style={{ cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={onPickFiles}
                  />
                  <Plus />Agregar
                </label>
              )}
            </div>
            <div className="row row-2" style={{ marginTop: 4 }}>
              <Info style={{ width: 14, height: 14, color: 'var(--biss-teal-900)' }} />
              <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
                {fotos.length} de 6 · subidas se activan cuando conectemos el storage.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', padding: '6px 0' }}
              onClick={() => setStep(5)}
            >
              Saltar este paso →
            </button>
          </>
        }
        footer={
          <div className="row row-2">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>
              <ArrowLeft />Atrás
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => setStep(5)}
            >
              Continuar <ArrowRight />
            </button>
          </div>
        }
      />
    );
  };

  // Step 5 — revisa y envía
  const renderStep5 = () => {
    const cat = CATS.find((c) => c.codigo === draft.categoria);
    const enviar = () => {
      // TODO: cuando R2 + auth listos: subir fotos a R2, hacer INSERT en solicitudes_caso.
      // Por ahora generamos folio temporal local y mostramos confirmación.
      setFolio(generarFolioLocal());
      clearDraft();
    };
    return (
      <FlowShell
        step={5}
        totalSteps={5}
        title="Revisa y envía"
        lead="Última mirada antes de enviarlo."
        onClose={onClose}
        onBack={() => setStep(4)}
        body={
          <>
            <div className="summary">
              <div className="summary-row">
                <span className="k">Tipo</span>
                <span className="v">
                  <span
                    className={`badge badge-cat-${draft.categoria}`}
                    style={cat ? { background: 'transparent' } : undefined}
                  >
                    {cat && <cat.Icon style={{ width: 12, height: 12 }} />}
                    {cat?.nombre ?? '—'}
                  </span>
                </span>
              </div>
              <div className="summary-row">
                <span className="k">Título</span>
                <span className="v">{draft.titulo || '—'}</span>
              </div>
              <div className="summary-row">
                <span className="k">Dónde</span>
                <span className="v">
                  {draft.ubicacionLabel || '—'}
                  {draft.ubicacionDetalle && (
                    <>
                      <br />
                      <span style={{ fontWeight: 400, color: 'var(--ink-soft)', fontSize: 11 }}>
                        {draft.ubicacionDetalle}
                      </span>
                    </>
                  )}
                </span>
              </div>
              <div className="summary-row">
                <span className="k">Fotos</span>
                <span className="v">
                  {fotos.length > 0 ? `${fotos.length} imagen${fotos.length === 1 ? '' : 'es'}` : 'Sin fotos'}
                </span>
              </div>
            </div>
            <div
              className="alert alert-info"
              style={{ padding: '10px 12px' }}
            >
              <ShieldCheck
                className="alert-icon"
                style={{ width: 16, height: 16 }}
              />
              <div className="alert-body">
                <div className="alert-text" style={{ fontSize: 12 }}>
                  Lo verá BISS, vecinos del barrio, padrinos potenciales y el concejal Kevin.
                </div>
              </div>
            </div>
          </>
        }
        footer={
          <div className="row row-2">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(4)}>
              <ArrowLeft />Atrás
            </button>
            <button
              type="button"
              className="btn btn-primary grow"
              style={{
                ['--btn-bg' as never]: 'var(--state-critical)',
                ['--btn-border' as never]: 'var(--state-critical)',
                ['--btn-bg-hover' as never]: '#B70323',
                ['--btn-ink' as never]: '#FFFFFF',
              }}
              onClick={enviar}
            >
              Enviar caso <Send />
            </button>
          </div>
        }
      />
    );
  };

  // Confirmación
  if (folio) {
    return (
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-bar">
          <span className="sheet-bar-step" style={{ color: 'var(--state-resolved)' }}>
            <Check style={{ width: 13, height: 13, verticalAlign: -2 }} /> Enviado
          </span>
          <button type="button" className="x" aria-label="Cerrar" onClick={onClose}>
            <ArrowLeft style={{ display: 'none' }} />
          </button>
        </div>
        <div className="sheet-body">
          <div className="confirm">
            <div
              className="confirm-mark"
              style={{ background: 'var(--state-resolved-bg)', color: 'var(--state-resolved)' }}
            >
              <Check />
            </div>
            <div className="confirm-title">Listo, llegó tu caso</div>
            <div className="confirm-text">
              Te avisamos por SMS cuando lo revisemos. Suele tomar de 24 a 72 horas hábiles.
            </div>
            <div className="confirm-folio">{folio}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>
              Guarda este folio.
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <div className="row row-2">
            <button type="button" className="btn btn-secondary grow" onClick={onClose}>
              <Share2 />Compartir
            </button>
            <button type="button" className="btn btn-primary grow" onClick={onClose}>
              Ver mi caso
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) return renderStep1();
  if (step === 2) return renderStep2();
  if (step === 3) return renderStep3();
  if (step === 4) return renderStep4();
  return renderStep5();
}
