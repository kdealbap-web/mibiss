import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
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
import { useReportarCaso } from '../../hooks/mutations/useReportarCaso';
import { useCategorias } from '../../hooks/useCategorias';
import { useBarrios } from '../../hooks/useBarrios';
import { useMiPerfil } from '../../hooks/useMiCuenta';
import { useR2Upload } from '../../hooks/useR2Upload';
import { formatFolio } from '../../lib/format';
import { BarrioAutocomplete } from '../ui/BarrioAutocomplete';
import { SOLEDAD_CENTER } from '../../lib/config';

type Categoria =
  | 'agua' | 'luz' | 'infraestructura' | 'salud'
  | 'educacion' | 'medio-ambiente' | 'social' | 'otros';

interface ReportarDraft {
  categoria: Categoria | null;
  titulo: string;
  descripcion: string;
  barrioId: number | null;
  ubicacionDetalle: string;
  /** File objects no son serializables a JSON → guardamos solo metadatos en draft */
  fotosMeta: Array<{ name: string; size: number; type: string }>;
}

const INITIAL: ReportarDraft = {
  categoria: null,
  titulo: '',
  descripcion: '',
  barrioId: null,
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

export function FlowReportar() {
  const { closeFlow } = useFlowDrawer();
  const [draft, setDraft, clearDraft] = useFlowDraft<ReportarDraft>('reportar', INITIAL);
  const [step, setStep] = useState(1);
  const [folio, setFolio] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Files locales — fuera del draft serializado (no se pueden serializar a JSON).
  const [fotos, setFotos] = useState<File[]>([]);

  const { data: categorias = [] } = useCategorias();
  const { data: barrios = [] } = useBarrios();
  const { data: miPerfil } = useMiPerfil();
  const reportar = useReportarCaso();
  const { upload: uploadFotos, uploading, progress } = useR2Upload('solicitudes-multimedia');

  // Pre-poblar barrio desde el perfil del ciudadano (si no eligió otro aún).
  useEffect(() => {
    if (draft.barrioId == null && miPerfil?.barrio_id != null) {
      setDraft((d) => ({ ...d, barrioId: miPerfil.barrio_id! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miPerfil?.barrio_id]);

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

  // Step 3 — ubicación: autocompletar barrio (pre-poblado desde miPerfil) y
  // mostrar su ubicación en un mini-mapa Leaflet.
  const renderStep3 = () => {
    const cat = CATS.find((c) => c.codigo === draft.categoria);
    const selectedBarrio = draft.barrioId != null
      ? barrios.find((b) => b.id === draft.barrioId) ?? null
      : null;
    return (
      <FlowShell
        step={3}
        totalSteps={5}
        title="¿En qué barrio queda?"
        lead="Elige tu barrio. Mostraremos su ubicación en el mapa."
        onClose={onClose}
        onBack={() => setStep(2)}
        body={
          <>
            <BarrioAutocomplete
              value={draft.barrioId}
              onChange={(id) => setDraft((d) => ({ ...d, barrioId: id }))}
              label="Barrio"
              placeholder="Escribe el nombre de tu barrio…"
              required
            />
            <BarrioPreviewMap
              barrio={selectedBarrio}
              pinColor={cat?.color ?? 'var(--cat-otros)'}
            />
            <div className="mini-field">
              <label htmlFor="r-detalle">
                Calle o referencia <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>(opcional)</span>
              </label>
              <input
                id="r-detalle"
                type="text"
                value={draft.ubicacionDetalle}
                onChange={(e) => setDraft((d) => ({ ...d, ubicacionDetalle: e.target.value }))}
                placeholder="Ej. Calle 30 × Carrera 18"
              />
              <span className="hint">Da una referencia para que el equipo lo ubique más fácil.</span>
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
              disabled={draft.barrioId == null}
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
    const previews = fotos.map((f) => ({
      src: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/'),
      name: f.name,
    }));
    return (
      <FlowShell
        step={4}
        totalSteps={5}
        title="Si tienes fotos o video, súbelos"
        lead="Hasta 6 archivos (fotos o un video corto). Si no tienes, puedes saltarte este paso."
        onClose={onClose}
        onBack={() => setStep(3)}
        body={
          <>
            <div className="photo-grid">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className="photo-thumb"
                  style={{
                    position: 'relative',
                    background: '#0B0B0B',
                    color: 'transparent',
                    overflow: 'hidden',
                  }}
                  aria-label={p.isVideo ? `Video ${i + 1}` : `Foto ${i + 1}`}
                >
                  {p.isVideo ? (
                    <video
                      src={p.src}
                      muted
                      playsInline
                      preload="metadata"
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <img
                      src={p.src}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>
              ))}
              {fotos.length < 6 && (
                <label className="photo-add" style={{ cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*,video/*"
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
                {fotos.length} de 6 · se suben al enviar el caso (máx 5 MB c/u).
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

    const enviar = async () => {
      setSubmitError(null);
      try {
        if (!miPerfil) {
          throw new Error('Necesitas iniciar sesión para reportar un caso.');
        }
        if (!draft.categoria) throw new Error('Falta categoría');
        if (draft.barrioId == null) throw new Error('Falta seleccionar barrio');

        const categoria = categorias.find((c) => c.codigo === draft.categoria);
        if (!categoria) throw new Error('Categoría no encontrada en el catálogo');

        let fotosUrls: string[] = [];
        if (fotos.length > 0) {
          const uploaded = await uploadFotos(fotos);
          fotosUrls = uploaded.map((u) => u.url);
        }

        const desc = draft.ubicacionDetalle.trim()
          ? `${draft.descripcion.trim()}\n\nReferencia: ${draft.ubicacionDetalle.trim()}`
          : draft.descripcion.trim();

        const created = await reportar.mutateAsync({
          ciudadano_id: miPerfil.id,
          barrio_id: draft.barrioId,
          categoria_id: categoria.id,
          titulo: draft.titulo.trim(),
          descripcion: desc,
          fotos_urls: fotosUrls,
        });

        const año = new Date(created.creado_en).getFullYear();
        const shortId = created.id.slice(0, 8).toUpperCase();
        setFolio(`SOL-${año}-${shortId}`);
        clearDraft();
      } catch (e: unknown) {
        const err = e as { message?: string; code?: string; details?: string };
        const msg = err.message ?? '';
        // eslint-disable-next-line no-console
        console.error('[reportar] INSERT error', { msg, code: err.code, details: err.details });
        if (/iniciar sesi/i.test(msg)) {
          setSubmitError(msg);
        } else if (err.code === '42501' || /row-level|policy/i.test(msg)) {
          setSubmitError('Sesión caducada. Cierra sesión y vuelve a entrar.');
        } else if (/r2|firmar|subida|pesa más/i.test(msg)) {
          setSubmitError(msg);
        } else {
          setSubmitError(msg ? `No pudimos enviar: ${msg}` : 'Algo salió raro. Vuelve a intentarlo.');
        }
      }
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
                  {draft.barrioId != null
                    ? barrios.find((b) => b.id === draft.barrioId)?.nombre ?? '—'
                    : '—'}
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
            {submitError && (
              <div
                className="alert alert-critical"
                style={{ padding: '10px 12px' }}
                role="alert"
              >
                <div className="alert-body">
                  <div className="alert-text" style={{ fontSize: 12 }}>
                    {submitError}
                  </div>
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
              onClick={() => setStep(4)}
              disabled={reportar.isPending}
            >
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
              disabled={reportar.isPending || uploading}
            >
              {uploading
                ? `Subiendo fotos ${progress.done}/${progress.total}…`
                : reportar.isPending
                  ? 'Enviando…'
                  : 'Enviar caso'}
              <Send />
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
              Te avisamos por email cuando lo revisemos. Suele tomar de 24 a 72 horas hábiles.
            </div>
            <div className="confirm-folio">{formatFolio(folio)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>
              Guarda este folio mientras tu caso se aprueba.
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

/* ─── Mini-mapa del barrio seleccionado (Leaflet readonly) ──────────────── */

interface BarrioPreviewMapProps {
  barrio: { id: number; nombre: string; coord_lat: number | null; coord_lng: number | null } | null;
  pinColor: string;
}

function BarrioPreviewMap({ barrio, pinColor }: BarrioPreviewMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      attributionControl: false,
    }).setView([SOLEDAD_CENTER[0], SOLEDAD_CENTER[1]], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    // Reflow para evitar tiles grises dentro de drawers/sheets.
    const timers = [
      window.setTimeout(() => map.invalidateSize(), 50),
      window.setTimeout(() => map.invalidateSize(), 350),
    ];
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (barrio && barrio.coord_lat != null && barrio.coord_lng != null) {
      const html = `
        <div style="
          width:32px;height:40px;position:relative;
          display:flex;align-items:center;justify-content:center;
          filter:drop-shadow(0 4px 6px rgba(0,0,0,0.32));
        ">
          <div style="
            width:28px;height:28px;border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            background:${pinColor};
            border:2px solid #FFFFFF;
          "></div>
        </div>`;
      const icon = L.divIcon({
        className: 'flow-barrio-pin',
        html,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      });
      markerRef.current = L.marker([barrio.coord_lat, barrio.coord_lng], { icon }).addTo(map);
      map.setView([barrio.coord_lat, barrio.coord_lng], 15);
      window.setTimeout(() => map.invalidateSize(), 80);
    } else {
      map.setView([SOLEDAD_CENTER[0], SOLEDAD_CENTER[1]], 12);
    }
  }, [barrio, pinColor]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 4,
      }}
    >
      <div
        ref={containerRef}
        style={{
          height: 200,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--surface-sunken)',
          position: 'relative',
          zIndex: 0,
        }}
        aria-label={barrio ? `Mapa del barrio ${barrio.nombre}` : 'Mapa de Soledad'}
      />
      {barrio && (
        <div className="row row-3" style={{ fontSize: 12, color: 'var(--ink-strong)' }}>
          <MapPin style={{ width: 14, height: 14, color: 'var(--biss-teal-900)' }} />
          <span>
            <strong>{barrio.nombre}</strong>
            {barrio.coord_lat == null && (
              <span style={{ color: 'var(--ink-soft)', marginLeft: 6 }}>
                · sin coordenadas registradas
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
