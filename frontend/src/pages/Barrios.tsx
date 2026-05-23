import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, BookOpen, Search } from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Modal } from '../components/ui';
import { useBarrios } from '../hooks/useBarrios';
import { useZonas } from '../hooks/useZonas';
import { useCapitulosPublicos } from '../hooks/useCapitulos';
import { useFlowDrawer } from '../context/FlowDrawer';
import type { Barrio } from '../types/biss';

const PAGE_SIZE = 24;

interface BloqueBarriosProps {
  titulo: string;
  subtitulo: string;
  barrios: Barrio[];
  capituloByBarrio: Map<number, { casos: number; criticos: number; resueltos: number }>;
  zonaById: Map<number, { nombre: string; color_hex: string }>;
  onBarrioClick: (b: Barrio) => void;
  emptyMsg: string;
  highlight?: 'teal' | 'soft';
}

function BloqueBarrios({
  titulo,
  subtitulo,
  barrios,
  capituloByBarrio,
  zonaById,
  onBarrioClick,
  emptyMsg,
  highlight = 'soft',
}: BloqueBarriosProps) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return barrios;
    return barrios.filter((b) => b.nombre.toLowerCase().includes(t));
  }, [barrios, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const accent = highlight === 'teal' ? 'var(--biss-teal)' : 'var(--border)';

  return (
    <section
      style={{
        background: 'var(--surface)',
        border: `1.5px solid ${accent}`,
        borderRadius: 16,
        padding: '20px 22px 24px',
        marginBottom: 22,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(1.05rem, 2.6vw, 1.35rem)',
              margin: 0,
              color: 'var(--ink-strong)',
              letterSpacing: '-0.02em',
            }}
          >
            {titulo}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>{subtitulo}</p>
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 320,
          }}
        >
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-soft)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder={`Buscar en ${barrios.length} barrios…`}
            aria-label={`Buscar barrio en ${titulo}`}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              fontSize: 13,
              background: 'var(--surface)',
              color: 'var(--ink-strong)',
            }}
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="caption" style={{ padding: '14px 4px' }}>
          {q.trim() ? 'Sin coincidencias para esa búsqueda.' : emptyMsg}
        </p>
      )}

      {slice.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          {slice.map((b) => {
            const cap = capituloByBarrio.get(b.id);
            const tieneCasos = (cap?.casos ?? 0) > 0;
            const zona = zonaById.get(b.zona_id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onBarrioClick(b)}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  display: 'grid',
                  gap: 4,
                  transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: zona?.color_hex ?? '#9AA3B2',
                        flexShrink: 0,
                      }}
                      aria-hidden
                    />
                    <strong
                      style={{
                        color: 'var(--ink-strong)',
                        fontSize: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.nombre}
                    </strong>
                  </div>
                  {tieneCasos && (
                    <span
                      className="badge"
                      style={{
                        background: 'var(--biss-teal-50)',
                        color: 'var(--biss-teal-900)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <BookOpen size={11} />
                      {cap?.casos ?? 0}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  {zona?.nombre ?? '—'}
                </div>
                {tieneCasos && (cap!.criticos > 0 || cap!.resueltos > 0) && (
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, marginTop: 2 }}>
                    {cap!.criticos > 0 && (
                      <span style={{ color: 'var(--state-critical)', fontWeight: 700 }}>
                        {cap!.criticos} críticos
                      </span>
                    )}
                    {cap!.resueltos > 0 && (
                      <span style={{ color: 'var(--state-resolved)', fontWeight: 700 }}>
                        {cap!.resueltos} resueltos
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            fontSize: 12,
            color: 'var(--ink-soft)',
          }}
        >
          <span>
            Página {page + 1} de {totalPages} · {filtered.length}
            {q.trim() ? ' coincidencias' : ' barrios'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function Barrios() {
  const navigate = useNavigate();
  const { openFlow } = useFlowDrawer();
  const { data: barrios = [], isLoading } = useBarrios();
  const { data: zonas = [] } = useZonas();
  const { data: capitulos = [] } = useCapitulosPublicos();
  const [barrioSinCasos, setBarrioSinCasos] = useState<Barrio | null>(null);

  const capituloByBarrio = useMemo(() => {
    const m = new Map<number, { casos: number; criticos: number; resueltos: number }>();
    capitulos.forEach((c) => {
      m.set(c.barrio_id, {
        casos: c.casos_total,
        criticos: c.casos_criticos,
        resueltos: c.casos_resueltos,
      });
    });
    return m;
  }, [capitulos]);

  const zonaById = useMemo(() => {
    const m = new Map<number, { nombre: string; color_hex: string }>();
    zonas.forEach((z) => m.set(z.id, z));
    return m;
  }, [zonas]);

  const { conBitacora, sinBitacora } = useMemo(() => {
    const con: Barrio[] = [];
    const sin: Barrio[] = [];
    const ordered = [...barrios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    for (const b of ordered) {
      const tiene = (capituloByBarrio.get(b.id)?.casos ?? 0) > 0;
      if (tiene) con.push(b);
      else sin.push(b);
    }
    return { conBitacora: con, sinBitacora: sin };
  }, [barrios, capituloByBarrio]);

  const onBarrioClick = (b: Barrio) => {
    const tiene = (capituloByBarrio.get(b.id)?.casos ?? 0) > 0;
    if (tiene) navigate(`/capitulo/${b.slug}`);
    else setBarrioSinCasos(b);
  };

  return (
    <>
      <Navbar active="barrios" />
      <section
        style={{
          padding: '32px 24px 22px',
          background: 'linear-gradient(135deg, var(--biss-teal-50) 0%, var(--surface) 100%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Link
            to="/home"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--ink-soft)',
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            <ArrowLeft size={14} />Volver al inicio
          </Link>
          <div className="kicker" style={{ marginBottom: 4 }}>Bitácoras</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              letterSpacing: '-0.025em',
              margin: 0,
              color: 'var(--ink-strong)',
            }}
          >
            Los {barrios.length} barrios de Soledad
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6 }}>
            {conBitacora.length} con bitácora abierta · {sinBitacora.length} esperando su primer
            caso. Toca cualquier barrio para abrir su capítulo o reportar el primero.
          </p>
        </div>
      </section>

      <section style={{ padding: '24px 24px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {isLoading && (
            <div style={{ display: 'grid', gap: 8 }} aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 80,
                    borderRadius: 12,
                    background: 'var(--surface-sunken)',
                    opacity: 0.7 - i * 0.12,
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && (
            <>
              <BloqueBarrios
                titulo={`Con bitácora abierta · ${conBitacora.length}`}
                subtitulo="Barrios que ya tienen al menos un caso público."
                barrios={conBitacora}
                capituloByBarrio={capituloByBarrio}
                zonaById={zonaById}
                onBarrioClick={onBarrioClick}
                emptyMsg="Todavía no hay bitácoras abiertas."
                highlight="teal"
              />
              <BloqueBarrios
                titulo={`Sin bitácora · ${sinBitacora.length}`}
                subtitulo="Barrios listos para ser los primeros en contar su historia."
                barrios={sinBitacora}
                capituloByBarrio={capituloByBarrio}
                zonaById={zonaById}
                onBarrioClick={onBarrioClick}
                emptyMsg="Todos los barrios ya tienen bitácora."
                highlight="soft"
              />
            </>
          )}
        </div>
      </section>

      <Modal
        open={barrioSinCasos !== null}
        onClose={() => setBarrioSinCasos(null)}
        title={`${barrioSinCasos?.nombre ?? ''} aún no tiene casos`}
        description="Sé el primero en abrir un caso en tu barrio."
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setBarrioSinCasos(null)}>
              Cerrar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                const b = barrioSinCasos;
                setBarrioSinCasos(null);
                if (b) openFlow('reportar', { barrioId: b.id });
              }}
            >
              <Megaphone size={14} />
              Reportar primer caso
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--ink-strong)', margin: 0, lineHeight: 1.5 }}>
          Cuando alguien reporta el primer caso en este barrio, abrimos un capítulo público.
          Cualquier vecino puede leer, comentar y sumar testimonios.
        </p>
      </Modal>

      <Footer />
    </>
  );
}
