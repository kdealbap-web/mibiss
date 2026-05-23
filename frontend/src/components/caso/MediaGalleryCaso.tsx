import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Play } from 'lucide-react';

import type { MultimediaCaso } from '../../types/biss';

interface MediaGalleryCasoProps {
  media: MultimediaCaso[];
}

function isVideo(m: MultimediaCaso): boolean {
  return m.tipo === 'video' || /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(m.url);
}

export function MediaGalleryCaso({ media }: MediaGalleryCasoProps) {
  const items = useMemo(() => media.filter(Boolean), [media]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Reset activeIdx si cambia el set de medias.
  useEffect(() => {
    if (activeIdx >= items.length) setActiveIdx(0);
  }, [items.length, activeIdx]);

  const active = items[activeIdx];

  const open = useCallback((idx: number) => setLightbox(idx), []);
  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => {
    setLightbox((i) => (i === null ? null : (i - 1 + items.length) % items.length));
  }, [items.length]);
  const next = useCallback(() => {
    setLightbox((i) => (i === null ? null : (i + 1) % items.length));
  }, [items.length]);

  // Atajos teclado en el lightbox.
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, close, prev, next]);

  if (items.length === 0) {
    return (
      <p className="caption">
        Todavía no hay fotos o videos. Cuando los suban, aparecen aquí.
      </p>
    );
  }

  return (
    <div className="media-gallery">
      {/* Hero principal */}
      <div className="media-hero">
        {isVideo(active!) ? (
          <video
            key={active!.id}
            src={active!.url}
            poster={active!.thumb_url ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="media-hero-content"
          />
        ) : (
          <button
            type="button"
            className="media-hero-content"
            onClick={() => open(activeIdx)}
            aria-label="Abrir foto en grande"
            style={{ border: 0, padding: 0, cursor: 'zoom-in' }}
          >
            <img src={active!.url} alt="" loading="eager" />
          </button>
        )}

        {/* Flechas tipo pasar-página, solo visibles si hay más de 1 medio */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              className="media-nav media-nav-left"
              aria-label="Anterior"
              onClick={() => setActiveIdx((i) => (i - 1 + items.length) % items.length)}
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              className="media-nav media-nav-right"
              aria-label="Siguiente"
              onClick={() => setActiveIdx((i) => (i + 1) % items.length)}
            >
              <ChevronRight />
            </button>
            <div className="media-hero-counter">
              {activeIdx + 1} / {items.length}
            </div>
          </>
        )}
      </div>

      {/* Miniaturas */}
      {items.length > 1 && (
        <div className="media-thumbs">
          {items.map((m, i) => {
            const v = isVideo(m);
            return (
              <button
                key={m.id}
                type="button"
                className={`media-thumb${i === activeIdx ? ' is-active' : ''}`}
                onClick={() => setActiveIdx(i)}
                aria-label={`Ver ${v ? 'video' : 'foto'} ${i + 1}`}
                style={
                  v
                    ? { background: '#0B0B0B' }
                    : {
                        backgroundImage: `url(${m.thumb_url ?? m.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                }
              >
                {v && (
                  <span className="media-thumb-icon" aria-hidden>
                    <Play size={18} fill="currentColor" />
                  </span>
                )}
                {!v && (
                  <span className="media-thumb-icon-corner" aria-hidden>
                    <ImageIcon size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox (portal a body) */}
      {lightbox !== null &&
        items[lightbox] &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Foto en grande"
            className="media-lightbox"
            onClick={close}
          >
            <button
              type="button"
              className="media-lightbox-close"
              aria-label="Cerrar"
              onClick={close}
            >
              <X size={20} />
            </button>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  className="media-lightbox-nav media-lightbox-nav-left"
                  aria-label="Anterior"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  className="media-lightbox-nav media-lightbox-nav-right"
                  aria-label="Siguiente"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            <div className="media-lightbox-content" onClick={(e) => e.stopPropagation()}>
              {isVideo(items[lightbox]!) ? (
                <video
                  src={items[lightbox]!.url}
                  controls
                  autoPlay
                  playsInline
                  className="media-lightbox-el"
                />
              ) : (
                <img src={items[lightbox]!.url} alt="" className="media-lightbox-el" />
              )}
              <div className="media-lightbox-counter">
                {lightbox + 1} / {items.length}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
