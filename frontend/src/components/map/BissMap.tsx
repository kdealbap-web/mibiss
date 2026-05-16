import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { useBarriosConCoords } from '../../hooks/useBarrios';
import { useCasosPublicos } from '../../hooks/useCasos';
import type { Barrio, CasoPublico, EstadoCaso } from '../../types/biss';

const CENTER: L.LatLngTuple = [10.917, -74.762];
const ZOOM = 13;

const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTR = '&copy; OpenStreetMap &copy; CARTO';

const ESTADO_COLOR: Record<EstadoCaso, string> = {
  pendiente: 'transparent',
  critico: '#E4042C',
  progreso: '#FDC746',
  resuelto: '#3DAF6C',
  archivado: '#9AA3B2',
};

const CAT_ICON_PATH: Record<string, string> = {
  agua: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/>',
  luz: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  infraestructura: '<path d="M2 20h20"/><path d="M14 12V4h-4v8"/><path d="M3 20V8h18v12"/>',
  salud: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  educacion: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  'medio-ambiente': '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
  social: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  otros: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
};

interface BissMapProps {
  onBarrioClick?: (barrio: Barrio) => void;
  onCasoClick?: (caso: CasoPublico) => void;
}

export function BissMap({ onBarrioClick, onCasoClick }: BissMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerBarriosRef = useRef<L.LayerGroup | null>(null);
  const layerCasosRef = useRef<L.LayerGroup | null>(null);

  const { data: barrios = [], isLoading: barriosLoading, error: barriosError } = useBarriosConCoords();
  const { data: casos = [] } = useCasosPublicos();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView(CENTER, ZOOM);

    L.tileLayer(TILES, {
      attribution: ATTR,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    layerBarriosRef.current = L.layerGroup().addTo(map);
    layerCasosRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerBarriosRef.current = null;
      layerCasosRef.current = null;
    };
  }, []);

  // Pines de barrio (siempre visibles como hitos sutiles)
  useEffect(() => {
    const layer = layerBarriosRef.current;
    if (!layer) return;
    layer.clearLayers();

    barrios.forEach((b) => {
      if (b.coord_lat == null || b.coord_lng == null) return;
      const icon = L.divIcon({
        className: 'pin-hito-marker',
        html: '<div class="pin-hito"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([b.coord_lat, b.coord_lng], { icon, title: b.nombre });
      marker.bindTooltip(b.nombre, {
        direction: 'top',
        offset: [0, -8],
        className: 'biss-map-tooltip',
      });
      if (onBarrioClick) marker.on('click', () => onBarrioClick(b));
      marker.addTo(layer);
    });
  }, [barrios, onBarrioClick]);

  // Pines de caso (encima de los barrios, con color de categoría + state-tag)
  useEffect(() => {
    const layer = layerCasosRef.current;
    if (!layer) return;
    layer.clearLayers();

    casos.forEach((c) => {
      if (c.lat == null || c.lng == null) return;

      const catColor = c.categoria_color || '#06777C';
      const stateColor = ESTADO_COLOR[c.estado];
      const path = CAT_ICON_PATH[c.categoria_codigo] ?? CAT_ICON_PATH.otros!;

      const html = `
        <div class="pin-case" title="${escapeHtml(c.titulo)}">
          <div class="body" style="background: ${catColor};">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>
          </div>
          <span class="state-tag" style="background: ${stateColor};"></span>
        </div>
      `;
      const icon = L.divIcon({
        className: 'pin-case-marker',
        html,
        iconSize: [38, 46],
        iconAnchor: [19, 46],
      });
      const marker = L.marker([c.lat, c.lng], { icon, title: c.titulo });
      marker.bindTooltip(
        `<strong>${escapeHtml(c.titulo)}</strong><br/><span style="opacity:.85">${escapeHtml(c.barrio_nombre)} · ${escapeHtml(c.categoria_nombre)}</span>`,
        { direction: 'top', offset: [0, -30], className: 'biss-map-tooltip', sticky: false },
      );
      if (onCasoClick) marker.on('click', () => onCasoClick(c));
      marker.addTo(layer);
    });
  }, [casos, onCasoClick]);

  return (
    <div id="biss-map" ref={containerRef}>
      {barriosLoading && (
        <div className="biss-map-overlay" role="status">
          Un segundo…
        </div>
      )}
      {barriosError && (
        <div className="biss-map-overlay biss-map-overlay-error" role="alert">
          No pudimos cargar los barrios. Vuelve a intentarlo.
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' :
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '"' ? '&quot;' :
    '&#39;',
  );
}
