import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, BookOpen } from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SearchInput, Select, Modal } from '../components/ui';
import { useBarrios } from '../hooks/useBarrios';
import { useZonas } from '../hooks/useZonas';
import { useCapitulosPublicos } from '../hooks/useCapitulos';
import { useFlowDrawer } from '../context/FlowDrawer';
import type { Barrio } from '../types/biss';

type FiltroEstado = 'todos' | 'con-casos' | 'sin-casos';

export function Barrios() {
  const navigate = useNavigate();
  const { openFlow } = useFlowDrawer();
  const { data: barrios = [], isLoading } = useBarrios();
  const { data: zonas = [] } = useZonas();
  const { data: capitulos = [] } = useCapitulosPublicos();

  const [q, setQ] = useState('');
  const [zonaFiltro, setZonaFiltro] = useState<string>('');
  const [estado, setEstado] = useState<FiltroEstado>('con-casos');
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
    const m = new Map<number, typeof zonas[number]>();
    zonas.forEach((z) => m.set(z.id, z));
    return m;
  }, [zonas]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return barrios
      .filter((b) => {
        if (t && !b.nombre.toLowerCase().includes(t)) return false;
        if (zonaFiltro && String(b.zona_id) !== zonaFiltro) return false;
        const tieneCasos = (capituloByBarrio.get(b.id)?.casos ?? 0) > 0;
        if (estado === 'con-casos' && !tieneCasos) return false;
        if (estado === 'sin-casos' && tieneCasos) return false;
        return true;
      })
      .sort((a, b) => {
        const ca = capituloByBarrio.get(a.id)?.casos ?? 0;
        const cb = capituloByBarrio.get(b.id)?.casos ?? 0;
        if (ca !== cb) return cb - ca;
        return a.nombre.localeCompare(b.nombre, 'es');
      });
  }, [barrios, q, zonaFiltro, estado, capituloByBarrio]);

  const stats = useMemo(() => {
    const total = barrios.length;
    const conCasos = barrios.filter((b) => (capituloByBarrio.get(b.id)?.casos ?? 0) > 0).length;
    return { total, conCasos, sinCasos: total - conCasos };
  }, [barrios, capituloByBarrio]);

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
            Barrios de Soledad
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6 }}>
            {stats.total} barrios · {stats.conCasos} con bitácora abierta · {stats.sinCasos} pendientes
            de su primer caso.
          </p>
        </div>
      </section>

      <section style={{ padding: '24px 24px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 18,
            }}
          >
            <SearchInput
              className="grow"
              style={{ minWidth: 220, maxWidth: 380 }}
              placeholder="Busca tu barrio…"
              aria-label="Buscar barrio"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Select
              value={zonaFiltro}
              onChange={(e) => setZonaFiltro(e.target.value)}
              aria-label="Filtrar por zona"
              options={[
                { value: '', label: 'Todas las zonas' },
                ...zonas.map((z) => ({ value: String(z.id), label: z.nombre })),
              ]}
            />
            <Select
              value={estado}
              onChange={(e) => setEstado(e.target.value as FiltroEstado)}
              aria-label="Filtrar por estado"
              options={[
                { value: 'con-casos', label: 'Con bitácora' },
                { value: 'sin-casos', label: 'Sin bitácora' },
                { value: 'todos', label: 'Todos' },
              ]}
            />
          </div>

          {isLoading && (
            <div style={{ display: 'grid', gap: 8 }} aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 72,
                    borderRadius: 12,
                    background: 'var(--surface-sunken)',
                    opacity: 0.7 - i * 0.12,
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="admin-card" style={{ padding: 24, textAlign: 'center' }}>
              <p className="caption">Sin resultados con esos filtros.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {filtered.map((b) => {
                const cap = capituloByBarrio.get(b.id);
                const tieneCasos = (cap?.casos ?? 0) > 0;
                const zona = zonaById.get(b.zona_id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      if (tieneCasos) navigate(`/capitulo/${b.slug}`);
                      else setBarrioSinCasos(b);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '14px 16px',
                      background: 'var(--surface)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      display: 'grid',
                      gap: 6,
                      transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: zona?.color_hex ?? '#9AA3B2',
                          }}
                          aria-hidden
                        />
                        <strong style={{ color: 'var(--ink-strong)', fontSize: 15 }}>{b.nombre}</strong>
                      </div>
                      {tieneCasos ? (
                        <span
                          className="badge"
                          style={{
                            background: 'var(--biss-teal-50)',
                            color: 'var(--biss-teal-900)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <BookOpen size={12} />
                          {cap?.casos ?? 0}
                        </span>
                      ) : (
                        <span className="badge" style={{ color: 'var(--ink-soft)' }}>
                          Sin casos
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {zona?.nombre ?? '—'}
                    </div>
                    {tieneCasos && (
                      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-soft)' }}>
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
                setBarrioSinCasos(null);
                openFlow('reportar');
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
