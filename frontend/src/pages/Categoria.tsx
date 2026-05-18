import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
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
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useCategorias } from '../hooks/useCategorias';
import { useCasosPublicos } from '../hooks/useCasos';
import { formatFolio, formatRelative } from '../lib/format';
import type { CasoPublico, EstadoCaso } from '../types/biss';

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

export function Categoria() {
  const { codigo = '' } = useParams<{ codigo: string }>();
  const { data: categorias = [] } = useCategorias();
  const { data: casos = [] } = useCasosPublicos();

  const categoria = useMemo(
    () => categorias.find((c) => c.codigo === codigo),
    [categorias, codigo],
  );

  const casosCat = useMemo(
    () => casos.filter((c) => c.categoria_codigo === codigo),
    [casos, codigo],
  );

  if (categorias.length > 0 && !categoria) {
    return <Navigate to="/home" replace />;
  }

  const Icon = ICON_CAT[codigo] ?? MoreHorizontal;
  const color = categoria?.color_hex ?? '#06777C';

  return (
    <>
      <Navbar active="casos" />
      <section
        style={{
          padding: '40px 24px 28px',
          background: `linear-gradient(135deg, ${color}22 0%, var(--surface) 100%)`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: color,
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={28} strokeWidth={2.2} />
            </div>
            <div>
              <div className="kicker" style={{ marginBottom: 4 }}>Categoría</div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                  letterSpacing: '-0.025em',
                  margin: 0,
                  color: 'var(--ink-strong)',
                }}
              >
                {categoria?.nombre ?? codigo}
              </h1>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginTop: 4 }}>
                {casosCat.length} caso{casosCat.length === 1 ? '' : 's'} público{casosCat.length === 1 ? '' : 's'}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 24px 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {casosCat.length === 0 ? (
            <div
              className="admin-card"
              style={{ padding: '32px 24px', textAlign: 'center' }}
            >
              <Icon size={40} style={{ color: 'var(--ink-soft)', marginBottom: 12 }} />
              <h2 style={{ fontSize: '1.25rem', marginBottom: 6, color: 'var(--ink-strong)' }}>
                Sin casos de {categoria?.nombre ?? codigo} todavía
              </h2>
              <p className="caption" style={{ marginBottom: 16 }}>
                ¿Estás viviendo algo en esta categoría? Cuéntalo.
              </p>
              <Link to="/home" className="btn btn-primary btn-sm">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {casosCat.map((c) => (
                <CasoCard key={c.id} caso={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

function CasoCard({ caso }: { caso: CasoPublico }) {
  const Icon = ICON_CAT[caso.categoria_codigo] ?? MoreHorizontal;
  const { cls, txt } = ESTADO_BADGE[caso.estado];
  return (
    <Link
      to={`/caso/${caso.slug}`}
      style={{
        display: 'block',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(6,119,124,0.18)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div
        style={{
          height: 140,
          backgroundColor: caso.portada_url ? 'transparent' : `var(--cat-${caso.categoria_codigo}, var(--biss-teal))`,
          backgroundImage: caso.portada_url ? `url(${caso.portada_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {!caso.portada_url && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <Icon size={36} strokeWidth={1.8} />
          </div>
        )}
        <span
          className={cls}
          style={{ position: 'absolute', top: 10, right: 10 }}
        >
          <span className="dot" />
          {txt}
        </span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 16,
            color: 'var(--ink-strong)',
            lineHeight: 1.25,
            marginBottom: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {caso.titulo}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{caso.barrio_nombre}</span>
          <span className="mono">
            {caso.slug ? formatFolio(caso.slug) : ''}
          </span>
        </div>
        {caso.publicado_en && (
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 6 }}>
            Publicado {formatRelative(caso.publicado_en)}
          </div>
        )}
      </div>
    </Link>
  );
}
