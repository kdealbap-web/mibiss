import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin } from 'lucide-react';

import { SOLEDAD_CENTER, SOLEDAD_BOUNDS } from '../../lib/config';

interface BarrioMapPickerProps {
  lat: number | null;
  lng: number | null;
  nombre?: string;
  onChange: (lat: number, lng: number) => void;
  neighbors?: Array<{ nombre: string; lat: number; lng: number }>;
}

const TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const ATTR = '&copy; OpenStreetMap &copy; CARTO';

const inBounds = (lat: number, lng: number) =>
  lat >= SOLEDAD_BOUNDS.lat[0] &&
  lat <= SOLEDAD_BOUNDS.lat[1] &&
  lng >= SOLEDAD_BOUNDS.lng[0] &&
  lng <= SOLEDAD_BOUNDS.lng[1];

let nominatimLastCall = 0;
async function nominatimSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  const wait = Math.max(0, 1100 - (Date.now() - nominatimLastCall));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  nominatimLastCall = Date.now();
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      `${query} Soledad Atlántico Colombia`,
    )}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.length) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!isFinite(lat) || !isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export function BarrioMapPicker({ lat, lng, nombre, onChange, neighbors }: BarrioMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const neighborsLayerRef = useRef<L.LayerGroup | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const initial: L.LatLngTuple =
      lat != null && lng != null ? [lat, lng] : [SOLEDAD_CENTER[0], SOLEDAD_CENTER[1]];

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView(initial, 14);

    L.tileLayer(TILES, { attribution: ATTR, subdomains: 'abcd', maxZoom: 19 }).addTo(map);

    neighborsLayerRef.current = L.layerGroup().addTo(map);

    const marker = L.marker(initial, { draggable: true });
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(round5(pos.lat), round5(pos.lng));
    });
    marker.addTo(map);
    markerRef.current = marker;

    map.on('click', (e) => {
      const p = e.latlng;
      marker.setLatLng(p);
      onChange(round5(p.lat), round5(p.lng));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      neighborsLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    if (lat == null || lng == null) return;
    const cur = markerRef.current.getLatLng();
    if (Math.abs(cur.lat - lat) > 1e-5 || Math.abs(cur.lng - lng) > 1e-5) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  useEffect(() => {
    const layer = neighborsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    (neighbors ?? []).forEach((n) => {
      const icon = L.divIcon({
        className: 'pin-hito-marker',
        html: `<div class="pin-hito" style="opacity:0.55; background:#9AA3B2"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const m = L.marker([n.lat, n.lng], { icon, opacity: 0.7, interactive: false });
      m.bindTooltip(n.nombre, { direction: 'top', offset: [0, -8], className: 'biss-map-tooltip' });
      m.addTo(layer);
    });
  }, [neighbors]);

  const onSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchErr(null);
    const result = await nominatimSearch(q);
    setSearching(false);
    if (!result) {
      setSearchErr('No encontramos esa dirección — coloca el pin a mano.');
      return;
    }
    onChange(round5(result.lat), round5(result.lng));
  };

  const valid = lat != null && lng != null && inBounds(lat, lng);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <label className="search-wrap" style={{ flex: 1 }}>
          <Search size={18} aria-hidden strokeWidth={2.2} />
          <input
            type="search"
            placeholder={nombre ? `Buscar "${nombre}" en Soledad…` : 'Buscar dirección o lugar…'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearch();
              }
            }}
            aria-label="Buscar coordenadas con Nominatim"
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onSearch}
          disabled={searching || !searchQuery.trim()}
        >
          {searching ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {searchErr && (
        <div className="alert alert-warning" style={{ padding: '8px 10px', fontSize: 12 }}>
          {searchErr}
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: 360,
          borderRadius: 12,
          border: '1px solid var(--border)',
          background: 'var(--surface-sunken)',
        }}
      />
      <div className="row row-2" style={{ alignItems: 'center', gap: 8 }}>
        <MapPin
          size={14}
          style={{ color: valid ? 'var(--state-resolved)' : 'var(--state-critical)' }}
        />
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          {lat != null && lng != null
            ? `lat ${lat.toFixed(5)} · lng ${lng.toFixed(5)}${valid ? '' : ' · fuera del municipio'}`
            : 'Sin coordenadas — toca el mapa o arrastra el pin'}
        </span>
      </div>
    </div>
  );
}

function round5(n: number) {
  return Math.round(n * 1e5) / 1e5;
}
