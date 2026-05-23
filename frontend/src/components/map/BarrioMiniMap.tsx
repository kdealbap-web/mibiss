import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Maximize2, MapPin } from 'lucide-react';

interface BarrioMiniMapProps {
  barrioId: number;
  barrioNombre: string;
  zonaNombre?: string;
  lat: number | null;
  lng: number | null;
  /** Deprecated: ignorado por ahora (las geocercas actuales son placeholders
      cuadrados que se ven mal). Se reactivará con el shapefile oficial. */
  geocerca?: unknown;
  /** Color del polígono / círculo (acento del barrio o categoría). */
  accent?: string;
  /** Altura del widget (default 200px desktop, 180px mobile via min). */
  height?: number;
}

const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export function BarrioMiniMap({
  barrioId,
  barrioNombre,
  zonaNombre,
  lat,
  lng,
  geocerca: _geocercaIgnored,
  accent = 'var(--biss-teal)',
  height = 200,
}: BarrioMiniMapProps) {
  void _geocercaIgnored;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (lat == null || lng == null) return;

    // Zoom subido a 16 (~+25% más cerca). Solo pin centrado: las geocercas
    // actuales son placeholders cuadrados que se ven feos. Cuando llegue el
    // shapefile oficial podemos volver a dibujar polígonos reales.
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      dragging: false,
      keyboard: false,
    }).setView([lat, lng], 16);

    L.tileLayer(TILES, { subdomains: 'abcd', maxZoom: 19 }).addTo(map);

    // Resolver color CSS (acepta var(...) si lo pasaron así).
    const resolved = (() => {
      const root = getComputedStyle(document.documentElement);
      const m = accent.match(/^var\((--[^)]+)\)$/);
      if (m && m[1]) return root.getPropertyValue(m[1]).trim() || '#06777C';
      return accent;
    })();

    // Pin del centro del barrio.
    const pinHtml = `<div style="
      width:28px;height:36px;display:flex;align-items:center;justify-content:center;
      filter:drop-shadow(0 4px 6px rgba(0,0,0,0.32));
    "><div style="
      width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${resolved};border:2px solid #fff;"></div></div>`;
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'barrio-mini-pin',
        html: pinHtml,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      }),
    }).addTo(map);

    mapRef.current = map;

    // Reflow para evitar tiles grises dentro de cards o sticky asides.
    const timers = [
      window.setTimeout(() => map.invalidateSize(), 60),
      window.setTimeout(() => map.invalidateSize(), 320),
      window.setTimeout(() => map.invalidateSize(), 900),
    ];
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, accent]);

  if (lat == null || lng == null) {
    return (
      <div
        style={{
          padding: '14px 16px',
          background: 'var(--surface-sunken)',
          borderRadius: 12,
          fontSize: 13,
          color: 'var(--ink-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <MapPin size={14} />
        Ubicación pendiente de cargar.
      </div>
    );
  }

  return (
    <div className="barrio-mini-map">
      <div
        ref={containerRef}
        style={{
          height,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--surface-sunken)',
          position: 'relative',
          zIndex: 0,
        }}
        aria-label={`Ubicación de ${barrioNombre}`}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 8,
          fontSize: 12,
          color: 'var(--ink-soft)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <MapPin size={13} style={{ color: accent, flexShrink: 0 }} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <strong style={{ color: 'var(--ink-strong)' }}>{barrioNombre}</strong>
            {zonaNombre && <span style={{ color: 'var(--ink-soft)' }}> · {zonaNombre}</span>}
          </span>
        </span>
        <Link
          to={`/home?barrio=${barrioId}#mapa`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--biss-teal-900)',
            fontWeight: 700,
            fontSize: 12,
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 8,
            background: 'var(--biss-teal-50)',
            border: '1px solid var(--biss-teal-100)',
            flexShrink: 0,
          }}
          title="Abrir en el mapa grande"
        >
          <Maximize2 size={12} />
          Ver en mapa
        </Link>
      </div>
    </div>
  );
}
