import { Link } from 'react-router-dom';
import { X, BookOpen, ArrowRight } from 'lucide-react';

import type { CasoPublico, EstadoCaso } from '../../types/biss';
import { formatFolio, formatRelative } from '../../lib/format';

interface MapDrawerProps {
  open: boolean;
  onClose: () => void;
  caso: CasoPublico | null;
}

/**
 * Drawer superpuesto dentro del área del mapa (NO el FlowDrawer global).
 * Se usa cuando un usuario hace click en un pin de caso.
 * Vive embebido en BissMap (position: absolute, dentro de #biss-map).
 * El CSS vive en home.css (.map-drawer + .map-drawer-overlay).
 */
const ESTADO_BADGE: Record<EstadoCaso, { cls: string; txt: string }> = {
  pendiente: { cls: 'badge', txt: 'Pendiente' },
  critico: { cls: 'badge badge-critical', txt: 'Crítico' },
  progreso: { cls: 'badge badge-progress', txt: 'En gestión' },
  resuelto: { cls: 'badge badge-resolved', txt: 'Resuelto' },
  archivado: { cls: 'badge', txt: 'Archivado' },
};

export function MapDrawer({ open, onClose, caso }: MapDrawerProps) {
  if (!caso) {
    return (
      <>
        <div
          className="map-drawer-overlay"
          data-open={open ? 'true' : undefined}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className="map-drawer"
          data-open={open ? 'true' : undefined}
          role="dialog"
          aria-modal="true"
        >
          <div className="mdr-body">
            <p className="caption">Un segundo…</p>
          </div>
        </div>
      </>
    );
  }

  const { cls, txt } = ESTADO_BADGE[caso.estado];
  const folioVisible = formatFolio(caso.slug);

  return (
    <>
      <div
        className="map-drawer-overlay"
        data-open={open ? 'true' : undefined}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="map-drawer"
        data-open={open ? 'true' : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={`Caso ${folioVisible}`}
      >
        <div className="mdr-header">
          <div className="row1">
            <span className="mdr-folio">{folioVisible}</span>
            <button type="button" className="mdr-close" aria-label="Cerrar" onClick={onClose}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <h3 className="mdr-title">{caso.titulo}</h3>
          <div className="mdr-meta">
            <span className={`badge badge-cat-${caso.categoria_codigo}`}>{caso.categoria_nombre}</span>
            <span className={cls}>
              <span className="dot" />
              {txt}
            </span>
            <span className="caption" style={{ fontSize: 11.5 }}>
              {caso.barrio_nombre}
            </span>
          </div>
        </div>

        <div className="mdr-body">
          <div
            className="mdr-cover"
            style={
              caso.portada_url
                ? {
                    backgroundImage: `url(${caso.portada_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'transparent',
                  }
                : undefined
            }
          >
            {!caso.portada_url && 'FOTO DEL CASO'}
          </div>
          <p className="mdr-desc">{caso.descripcion}</p>
          {caso.publicado_en && (
            <div className="caption" style={{ fontSize: 11.5 }}>
              Publicado {formatRelative(caso.publicado_en)}
            </div>
          )}
        </div>

        <div className="mdr-footer">
          <Link to={`/capitulo/${caso.barrio_slug}`} className="btn btn-secondary" onClick={onClose}>
            <BookOpen />Capítulo
          </Link>
          <Link to={`/caso/${caso.slug}`} className="btn btn-primary" onClick={onClose}>
            <ArrowRight />Ver caso completo
          </Link>
        </div>
      </div>
    </>
  );
}
