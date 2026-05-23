import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Droplets,
  Lightbulb,
  Construction,
  Heart,
  GraduationCap,
  TreePine,
  Users,
  MoreHorizontal,
  Megaphone,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SearchInput, Select } from '../components/ui';
import { useCategorias } from '../hooks/useCategorias';
import { useCasosPublicos } from '../hooks/useCasos';
import { useFlowDrawer } from '../context/FlowDrawer';
import { formatFolio, formatRelative } from '../lib/format';
import type { EstadoCaso } from '../types/biss';

const ICON_CAT: Record<string, typeof Construction> = {
  agua: Droplets,
  luz: Lightbulb,
  infraestructura: Construction,
  salud: Heart,
  educacion: GraduationCap,
  'medio-ambiente': TreePine,
  social: Users,
  otros: MoreHorizontal,
};

const ESTADO_BADGE: Record<EstadoCaso, { cls: string; txt: string }> = {
  pendiente: { cls: 'badge', txt: 'Pendiente' },
  critico: { cls: 'badge badge-critical', txt: 'Crítico' },
  progreso: { cls: 'badge badge-progress', txt: 'En gestión' },
  resuelto: { cls: 'badge badge-resolved', txt: 'Resuelto' },
  archivado: { cls: 'badge', txt: 'Archivado' },
};

const PAGE_SIZE = 12;

type EstadoFiltro = '' | 'critico' | 'progreso' | 'resuelto';

export function Casos() {
  const { data: casos = [], isLoading } = useCasosPublicos();
  const { data: categorias = [] } = useCategorias();
  const { openFlow } = useFlowDrawer();

  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<EstadoFiltro>('');
  const [categoria, setCategoria] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return casos.filter((c) => {
      if (t && !`${c.titulo} ${c.barrio_nombre}`.toLowerCase().includes(t)) return false;
      if (estado && c.estado !== estado) return false;
      if (categoria && c.categoria_codigo !== categoria) return false;
      return true;
    });
  }, [casos, q, estado, categoria]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <Navbar active="casos" />
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
          <div className="kicker" style={{ marginBottom: 4 }}>Banco de casos</div>
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
            Casos reportados en Soledad
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 6 }}>
            {casos.length} caso{casos.length === 1 ? '' : 's'} público
            {casos.length === 1 ? '' : 's'} en la bitácora.
            {casos.length > 0 && ' Toca cualquier tarjeta para ver el detalle.'}
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
              placeholder="Busca por título o barrio…"
              aria-label="Buscar caso"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
            <Select
              value={estado}
              onChange={(e) => {
                setEstado(e.target.value as EstadoFiltro);
                setPage(0);
              }}
              aria-label="Filtrar por estado"
              options={[
                { value: '', label: 'Todos los estados' },
                { value: 'critico', label: 'Crítico' },
                { value: 'progreso', label: 'En gestión' },
                { value: 'resuelto', label: 'Resuelto' },
              ]}
            />
            <Select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setPage(0);
              }}
              aria-label="Filtrar por categoría"
              options={[
                { value: '', label: 'Todas las categorías' },
                ...categorias.map((c) => ({ value: c.codigo, label: c.nombre })),
              ]}
            />
          </div>

          {isLoading && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 14,
              }}
              aria-hidden
            >
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 200,
                    borderRadius: 14,
                    background: 'var(--surface-sunken)',
                    opacity: 0.7 - i * 0.1,
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && casos.length === 0 && (
            <div
              className="admin-card"
              style={{ padding: 36, textAlign: 'center', maxWidth: 560, margin: '20px auto' }}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Todavía no hay casos públicos.</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.5 }}>
                Cuando un vecino reporta el primer caso de Soledad y BISS lo aprueba, aparece
                aquí. Sé tú quien lo abre.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openFlow('reportar')}
                style={{ marginTop: 12 }}
              >
                <Megaphone size={14} />Reportar el primer caso
              </button>
            </div>
          )}

          {!isLoading && filtered.length === 0 && casos.length > 0 && (
            <p className="caption" style={{ padding: 20 }}>
              Sin resultados con esos filtros.
            </p>
          )}

          {slice.length > 0 && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 14,
                }}
              >
                {slice.map((c) => {
                  const Icon = ICON_CAT[c.categoria_codigo] ?? MoreHorizontal;
                  const eb = ESTADO_BADGE[c.estado];
                  return (
                    <Link
                      key={c.id}
                      to={`/caso/${c.slug}`}
                      className="caso-card-link"
                      style={{
                        display: 'block',
                        background: 'var(--surface)',
                        borderRadius: 14,
                        border: '1.5px solid var(--border)',
                        overflow: 'hidden',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                      }}
                    >
                      <div
                        style={{
                          aspectRatio: '16 / 9',
                          background: c.portada_url
                            ? `url(${c.portada_url}) center/cover`
                            : `linear-gradient(135deg, ${c.categoria_color}33 0%, ${c.categoria_color}11 100%)`,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'flex-end',
                          padding: 12,
                        }}
                      >
                        <span
                          className={eb.cls}
                          style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                          }}
                        >
                          <span className="dot" />
                          {eb.txt}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: '#FFFFFFDD',
                            backdropFilter: 'blur(6px)',
                            padding: '4px 10px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                            color: c.categoria_color,
                          }}
                        >
                          <Icon size={12} />
                          {c.categoria_nombre}
                        </span>
                      </div>
                      <div style={{ padding: '14px 16px 16px' }}>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--ink-soft)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontWeight: 700,
                            marginBottom: 4,
                          }}
                        >
                          {c.barrio_nombre}
                        </div>
                        <h3
                          style={{
                            margin: 0,
                            fontFamily: 'var(--font-display)',
                            fontSize: 15,
                            fontWeight: 800,
                            lineHeight: 1.3,
                            color: 'var(--ink-strong)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {c.titulo}
                        </h3>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 10,
                            fontSize: 11,
                            color: 'var(--ink-soft)',
                          }}
                        >
                          <span className="mono">{formatFolio(c.slug).slice(0, 14)}…</span>
                          {c.publicado_en && (
                            <span>{formatRelative(c.publicado_en)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 18,
                    padding: '12px 4px',
                    borderTop: '1px solid var(--border)',
                    fontSize: 12,
                    color: 'var(--ink-soft)',
                  }}
                >
                  <span>
                    Página {page + 1} de {totalPages} · {filtered.length} casos
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
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
