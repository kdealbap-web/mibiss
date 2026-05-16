import { Link } from 'react-router-dom';
import { X, Clock, MessageSquare, BookOpen, ArrowRight } from 'lucide-react';

import type { EstadoCaso } from '../../types/biss';

interface MapDrawerCaso {
  folio: string;
  titulo: string;
  categoria: string;
  estado: EstadoCaso;
  barrio: string;
  zona: string;
  capituloSlug: string;
  descripcion: string;
  portadaUrl?: string;
  vecinos: number;
  voces: number;
  padrinos: number;
  ultima?: { when: string; what: string };
  vozDelBarrio?: { texto: string; autor: string };
}

interface MapDrawerProps {
  open: boolean;
  onClose: () => void;
  caso: MapDrawerCaso | null;
}

/**
 * Drawer superpuesto dentro del área del mapa (NO el FlowDrawer global).
 * Se usa cuando un usuario hace click en un pin de caso.
 * Vive embebido en BissMap (position: absolute, dentro de #biss-map).
 * El CSS vive en home.css (.map-drawer + .map-drawer-overlay).
 */
export function MapDrawer({ open, onClose, caso }: MapDrawerProps) {
  if (!caso) return null;

  const estadoBadge = {
    pendiente: 'badge badge-neutral',
    critico: 'badge badge-critical',
    progreso: 'badge badge-progress',
    resuelto: 'badge badge-resolved',
    archivado: 'badge badge-neutral',
  }[caso.estado];
  const estadoLabel = {
    pendiente: 'Pendiente',
    critico: 'Crítico',
    progreso: 'En gestión',
    resuelto: 'Resuelto',
    archivado: 'Archivado',
  }[caso.estado];

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
        aria-label={`Caso ${caso.folio}`}
      >
        <div className="mdr-header">
          <div className="row1">
            <span className="mdr-folio">{caso.folio}</span>
            <button type="button" className="mdr-close" aria-label="Cerrar" onClick={onClose}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
          <h3 className="mdr-title">{caso.titulo}</h3>
          <div className="mdr-meta">
            <span className={`badge badge-cat-${caso.categoria}`}>{caso.categoria}</span>
            <span className={estadoBadge}><span className="dot" />{estadoLabel}</span>
            <span className="caption" style={{ fontSize: 11.5 }}>
              {caso.barrio} · {caso.zona}
            </span>
          </div>
        </div>

        <div className="mdr-body">
          <div
            className="mdr-cover"
            style={
              caso.portadaUrl
                ? {
                    backgroundImage: `url(${caso.portadaUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'transparent',
                  }
                : undefined
            }
          >
            {!caso.portadaUrl && 'FOTO DEL CASO'}
          </div>
          <p className="mdr-desc">{caso.descripcion}</p>
          <div className="mdr-quick">
            <div className="q"><div className="n">{caso.vecinos}</div><div className="l">Vecinos</div></div>
            <div className="q"><div className="n">{caso.voces}</div><div className="l">Voces</div></div>
            <div className="q"><div className="n">{caso.padrinos}</div><div className="l">Padrinos</div></div>
          </div>
          {caso.ultima && (
            <div>
              <div className="mdr-section-head">
                <Clock />Última actualización
              </div>
              <div className="mdr-update">
                <div className="when">{caso.ultima.when}</div>
                <div className="what">{caso.ultima.what}</div>
              </div>
            </div>
          )}
          {caso.vozDelBarrio && (
            <div>
              <div className="mdr-section-head">
                <MessageSquare />Una voz del barrio
              </div>
              <div className="mdr-mini-quote">
                {caso.vozDelBarrio.texto}
                <div className="who">— {caso.vozDelBarrio.autor}</div>
              </div>
            </div>
          )}
        </div>

        <div className="mdr-footer">
          <Link
            to={`/capitulo/${caso.capituloSlug}`}
            className="btn btn-secondary"
          >
            <BookOpen />Capítulo
          </Link>
          <Link
            to={`/caso/${caso.folio}`}
            className="btn btn-primary"
          >
            <ArrowRight />Ver caso completo
          </Link>
        </div>
      </div>
    </>
  );
}
