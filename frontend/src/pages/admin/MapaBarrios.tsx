import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Plus,
  Info,
  Maximize2,
  Edit,
  BookOpen,
  Plane,
  Building,
  Trophy,
  Cross,
  Trash2,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';
import { SearchInput } from '../../components/ui';
import { useBarrios } from '../../hooks/useBarrios';
import { useZonas } from '../../hooks/useZonas';
import type { Barrio, Zona } from '../../types/biss';

import '../../styles/page-admin-mapa-barrios.css';

const ZONA_COLORS: Record<string, { bg: string; ink: string; dot: string }> = {
  'centro-norte': { bg: 'rgba(31,175,74,0.15)', ink: '#13803A', dot: '#1FAF4A' },
  occidental: { bg: 'rgba(47,51,163,0.15)', ink: '#1F2378', dot: '#2F33A3' },
  oriental: { bg: 'rgba(201,156,10,0.18)', ink: '#876A07', dot: '#C99C0A' },
  sur: { bg: 'rgba(217,83,79,0.15)', ink: '#A53A37', dot: '#D9534F' },
  'sur-occidental': { bg: 'rgba(126,87,194,0.15)', ink: '#553D87', dot: '#7E57C2' },
};

const HITOS = [
  { nombre: 'Aeropuerto Ernesto Cortissoz', tipo: 'Transporte', zona: 'Sur', lat: '10.91000', lng: '-74.78900', Icon: Plane },
  { nombre: 'Alcaldía de Soledad', tipo: 'Institucional', zona: 'Centro', lat: '10.91500', lng: '-74.76600', Icon: Building },
  { nombre: 'Estadio Metropolitano', tipo: 'Espacio público', zona: 'Norte', lat: '10.92900', lng: '-74.77600', Icon: Trophy },
  { nombre: 'Hospital Materno Infantil', tipo: 'Salud', zona: 'Centro', lat: '10.91700', lng: '-74.74800', Icon: Cross },
];

export function MapaBarrios() {
  const { data: barrios = [] } = useBarrios();
  const { data: zonas = [] } = useZonas();
  const [q, setQ] = useState('');

  const zonaById = useMemo<Record<number, Zona>>(
    () => zonas.reduce<Record<number, Zona>>((acc, z) => ((acc[z.id] = z), acc), {}),
    [zonas],
  );

  const filtered = useMemo<Barrio[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) return barrios;
    return barrios.filter((b) => b.nombre.toLowerCase().includes(t));
  }, [barrios, q]);

  const conteoPorZona = useMemo(() => {
    const map: Record<number, number> = {};
    barrios.forEach((b) => {
      map[b.zona_id] = (map[b.zona_id] ?? 0) + 1;
    });
    return map;
  }, [barrios]);

  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Contenido</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Mapa & barrios</span>
          </>
        }
        title={`Mapa & barrios · ${barrios.length} barrios · ${zonas.length} zonas`}
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Upload />Importar shapefile
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <Plus />Nuevo barrio
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="alert alert-info">
          <Info className="alert-icon" />
          <div className="alert-body">
            <div className="alert-title">Sincronización con shapefile pendiente</div>
            <div className="alert-text">
              La DB tiene <strong>{barrios.length} barrios</strong> registrados. Coordenadas precisas se cargarán cuando
              la Alcaldía entregue el shapefile oficial (oficio Secretaría de Planeación · Iris Polo).
            </div>
          </div>
        </div>

        <div className="mb-grid">
          <div className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>Mapa de zonas territoriales</h2>
                <div className="card-sub">5 zonas oficiales · vista previa de geocercas</div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm">
                <Maximize2 />Pantalla completa
              </button>
            </div>
            <div className="map-preview">
              <div className="zone-shape z1" />
              <div className="zone-shape z2" />
              <div className="zone-shape z3" />
              <div className="zone-shape z4" />
              <div className="zone-shape z5" />
              <div className="zone-tag" style={{ top: '24%', left: '24%', color: '#13803A' }}>Centro-norte</div>
              <div className="zone-tag" style={{ top: '50%', left: '18%', color: '#1F2378' }}>Occidental</div>
              <div className="zone-tag" style={{ top: '26%', left: '60%', color: '#876A07' }}>Oriental</div>
              <div className="zone-tag" style={{ top: '68%', left: '52%', color: '#A53A37' }}>Sur</div>
              <div className="zone-tag" style={{ top: '72%', left: '20%', color: '#553D87' }}>Sur-occidental</div>
            </div>
            <div className="row row-3 wrap" style={{ marginTop: 14, gap: 8 }}>
              {zonas.map((z) => {
                const c = ZONA_COLORS[z.codigo] ?? ZONA_COLORS.occidental;
                return (
                  <span
                    key={z.id}
                    className={`zone-pill zone-${z.codigo}`}
                  >
                    <span
                      className="dot"
                      style={{ background: c.dot, width: 8, height: 8, borderRadius: 99 }}
                    />
                    {z.nombre} · {conteoPorZona[z.id] ?? 0} barrios
                  </span>
                );
              })}
            </div>
          </div>

          <div className="admin-card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ marginBottom: 4 }}>Editor de barrios</h2>
              <div className="card-sub" style={{ marginBottom: 10 }}>
                Edita nombre, zona y coordenadas. Activa o desactiva bitácora.
              </div>
              <SearchInput
                placeholder="Buscar barrio…"
                aria-label="Buscar barrio"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {filtered.slice(0, 50).map((b, i) => {
              const z = zonaById[b.zona_id];
              const color = z ? ZONA_COLORS[z.codigo] ?? ZONA_COLORS.occidental : ZONA_COLORS.occidental;
              const zonaLabel = z?.codigo ?? '';
              return (
                <div key={b.id} className="barrio-list-row">
                  <div className="marker">{String(i + 1).padStart(3, '0')}</div>
                  <div>
                    <div className="name">{b.nombre}</div>
                    <div className="coords">
                      {b.coord_lat?.toFixed(5) ?? '—'}, {b.coord_lng?.toFixed(5) ?? '—'}
                      {z && <> · {zonaLabel}</>}
                    </div>
                    {z && (
                      <span
                        className={`zone-pill zone-${z.codigo}`}
                        style={{ marginTop: 4, display: 'inline-flex' }}
                      >
                        <span className="dot" style={{ background: color.dot, width: 6, height: 6, borderRadius: 99 }} />
                        {z.nombre}
                      </span>
                    )}
                  </div>
                  <span className="cnt-pill">— casos</span>
                  <div className="row row-2">
                    <button
                      type="button"
                      aria-label="Editar"
                      style={{
                        background: 'var(--surface-sunken)',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--biss-teal-900)',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit style={{ width: 14, height: 14 }} />
                    </button>
                    <Link
                      to={`/capitulo/${b.slug}`}
                      aria-label="Ver bitácora"
                      style={{
                        background: 'var(--surface-sunken)',
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--biss-teal-900)',
                      }}
                    >
                      <BookOpen style={{ width: 14, height: 14 }} />
                    </Link>
                  </div>
                </div>
              );
            })}

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span className="caption">
                {Math.min(50, filtered.length)} de {barrios.length} barrios visibles
              </span>
              <button type="button" className="btn btn-ghost btn-sm">
                Ver todos →
              </button>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Hitos municipales · {HITOS.length} activos</h2>
              <div className="card-sub">
                Aeropuerto, hospitales, alcaldía, estadios, etc. Aparecen en el mapa público con icono distinto.
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-sm">
              <Plus />Nuevo hito
            </button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hito</th>
                <th>Tipo</th>
                <th>Zona</th>
                <th>Coordenadas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {HITOS.map((h) => (
                <tr key={h.nombre}>
                  <td>
                    <div className="row-title">
                      <div className="ic-mini" style={{ background: 'var(--biss-teal)' }}>
                        <h.Icon />
                      </div>
                      {h.nombre}
                    </div>
                  </td>
                  <td>{h.tipo}</td>
                  <td>{h.zona}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{h.lat}, {h.lng}</td>
                  <td className="action-cell">
                    <button type="button" aria-label="Editar">
                      <Edit style={{ width: 14, height: 14 }} />
                    </button>
                    <button type="button" className="danger" aria-label="Eliminar">
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
