import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';

import { useBarriosConCoords, useBarrios } from '../../hooks/useBarrios';
import { useCasosPublicos } from '../../hooks/useCasos';
import { SOLEDAD_CENTER, SOLEDAD_BOUNDS } from '../../lib/config';
import type { Barrio, CasoPublico, EstadoCaso } from '../../types/biss';

const CENTER: L.LatLngTuple = [SOLEDAD_CENTER[0], SOLEDAD_CENTER[1]];
const ZOOM = 13;

function inSoledad(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat == null || lng == null) return false;
  return (
    lat >= SOLEDAD_BOUNDS.lat[0] &&
    lat <= SOLEDAD_BOUNDS.lat[1] &&
    lng >= SOLEDAD_BOUNDS.lng[0] &&
    lng <= SOLEDAD_BOUNDS.lng[1]
  );
}

/**
 * Jitter pequeño determinista (±~80m) derivado del id del caso. Mantiene
 * varios casos del mismo barrio visualmente separados sin sacarlos del
 * polígono real del barrio.
 */
function jitterFromId(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  const a = ((h & 0xffff) / 0xffff - 0.5) * 0.0014;
  const b = (((h >>> 16) & 0xffff) / 0xffff - 0.5) * 0.0014;
  return [a, b];
}

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
  /** Filtra los pines por categoria_codigo. 'all' o undefined = sin filtro. */
  categoryFilter?: string;
  /** Filtra los pines por estado. null/undefined = sin filtro. */
  stateFilter?: EstadoCaso | null;
}

export function BissMap({
  onBarrioClick,
  onCasoClick,
  categoryFilter,
  stateFilter,
}: BissMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerBarriosRef = useRef<L.LayerGroup | null>(null);
  const layerCasosRef = useRef<L.LayerGroup | null>(null);

  const { data: barrios = [], isLoading: barriosLoading, error: barriosError } = useBarriosConCoords();
  const { data: allBarrios = [] } = useBarrios();
  const { data: allCasos = [] } = useCasosPublicos();

  const barrioById = useMemo(() => {
    const m = new Map<number, Barrio>();
    allBarrios.forEach((b) => m.set(b.id, b));
    return m;
  }, [allBarrios]);

  const casos = allCasos.filter((c) => {
    if (categoryFilter && categoryFilter !== 'all' && c.categoria_codigo !== categoryFilter) return false;
    if (stateFilter && c.estado !== stateFilter) return false;
    return true;
  });

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

    // Fix tiles grises en mobile: re-medir contenedor después del primer paint.
    const reflowTimers = [
      window.setTimeout(() => map.invalidateSize(), 0),
      window.setTimeout(() => map.invalidateSize(), 250),
      window.setTimeout(() => map.invalidateSize(), 700),
    ];

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      reflowTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
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
      // Siempre anclar al barrio real (las coords del caso son aproximadas
      // o vienen mal de la solicitud). Jitter determinista por id evita
      // pines amontonados cuando varios casos comparten barrio.
      const b = barrioById.get(c.barrio_id);
      if (!b?.coord_lat || !b?.coord_lng || !inSoledad(b.coord_lat, b.coord_lng)) return;
      const [dx, dy] = jitterFromId(c.id);
      const lat = b.coord_lat + dx;
      const lng = b.coord_lng + dy;

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
      const marker = L.marker([lat, lng], { icon, title: c.titulo });
      marker.bindTooltip(
        `<strong>${escapeHtml(c.titulo)}</strong><br/><span style="opacity:.85">${escapeHtml(c.barrio_nombre)} · ${escapeHtml(c.categoria_nombre)}</span>`,
        { direction: 'top', offset: [0, -30], className: 'biss-map-tooltip', sticky: false },
      );
      if (onCasoClick) marker.on('click', () => onCasoClick(c));
      marker.addTo(layer);
    });
  }, [casos, onCasoClick, barrioById]);

  return (
    <div id="biss-map" ref={containerRef}>
      {barriosError && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '6px 10px',
            background: 'var(--state-critical-bg)',
            border: '1px solid var(--state-critical-border)',
            color: 'var(--state-critical)',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            zIndex: 500,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          No pudimos cargar los barrios. Recarga la página.
        </div>
      )}
      {!barriosError && barriosLoading && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            fontSize: 11,
            color: 'var(--ink-soft)',
            zIndex: 500,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          Cargando barrios…
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
