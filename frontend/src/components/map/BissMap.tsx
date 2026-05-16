import { useEffect, useRef } from 'react';
import L from 'leaflet';

import { useBarriosConCoords } from '../../hooks/useBarrios';
import type { Barrio } from '../../types/biss';

const CENTER: L.LatLngTuple = [10.917, -74.762];
const ZOOM = 13;

const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTR = '&copy; OpenStreetMap &copy; CARTO';

interface BissMapProps {
  onBarrioClick?: (barrio: Barrio) => void;
}

export function BissMap({ onBarrioClick }: BissMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const { data: barrios = [], isLoading, error } = useBarriosConCoords();

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

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
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

  return (
    <div id="biss-map" ref={containerRef}>
      {isLoading && (
        <div className="biss-map-overlay" role="status">
          Un segundo…
        </div>
      )}
      {error && (
        <div className="biss-map-overlay biss-map-overlay-error" role="alert">
          No pudimos cargar los barrios. Vuelve a intentarlo.
        </div>
      )}
    </div>
  );
}
