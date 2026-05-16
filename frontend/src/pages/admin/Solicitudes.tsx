import { Link } from 'react-router-dom';
import {
  Filter,
  CheckCheck,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  MapPin,
  Check,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Construction,
  Droplets,
  Lightbulb,
  Heart,
  Users,
  TreePine,
  MoreHorizontal,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';

type Riesgo = 'alto' | 'medio' | 'bajo';
type Cat = 'infraestructura' | 'agua' | 'luz' | 'salud' | 'social' | 'medio-ambiente' | 'otros';

interface Row {
  titulo: string;
  cat: Cat;
  meta: string;
  Icon: typeof Construction;
  porNombre: string;
  porSub: string;
  barrio: string | null;
  recibido: string;
  riesgo: Riesgo;
}

const ROWS: Row[] = [
  {
    titulo: 'Hundimiento de la calle 17',
    cat: 'infraestructura',
    meta: 'Infraestructura · 3 fotos · 1 video',
    Icon: Construction,
    porNombre: 'José L.',
    porSub: '+57 301 245 8890',
    barrio: 'Salamanca',
    recibido: 'hace 2h',
    riesgo: 'alto',
  },
  {
    titulo: 'Sin agua los lunes en toda la manzana',
    cat: 'agua',
    meta: 'Agua · 2 fotos · firma de 23 vecinos',
    Icon: Droplets,
    porNombre: 'Marlén J.',
    porSub: '+57 312 778 4521',
    barrio: 'Soledad 2000',
    recibido: 'hace 4h',
    riesgo: 'alto',
  },
  {
    titulo: 'Tres postes apagados en la 18',
    cat: 'luz',
    meta: 'Luz · 4 fotos',
    Icon: Lightbulb,
    porNombre: 'Anónimo',
    porSub: 'Cel. verificado',
    barrio: 'Don Bosco',
    recibido: 'hace 6h',
    riesgo: 'medio',
  },
  {
    titulo: 'Sin ambulancia nocturna',
    cat: 'salud',
    meta: 'Salud · sin fotos · denuncia firmada',
    Icon: Heart,
    porNombre: 'Rosalba C.',
    porSub: '+57 300 871 1124',
    barrio: 'La Candelaria',
    recibido: 'hace 8h',
    riesgo: 'alto',
  },
  {
    titulo: 'Niños sin parque seguro tras cierre',
    cat: 'social',
    meta: 'Social · 6 fotos · 18 vecinos firmando',
    Icon: Users,
    porNombre: 'Carolina P.',
    porSub: 'Líder JAC',
    barrio: 'Soledad 2000',
    recibido: 'hace 10h',
    riesgo: 'medio',
  },
  {
    titulo: 'Basurero ilegal junto a la escuela',
    cat: 'medio-ambiente',
    meta: 'Medio ambiente · 5 fotos',
    Icon: TreePine,
    porNombre: 'Anónimo',
    porSub: 'Cel. verificado',
    barrio: 'El Hipódromo',
    recibido: 'hace 14h',
    riesgo: 'medio',
  },
  {
    titulo: 'Manada de perros callejeros agresivos',
    cat: 'otros',
    meta: 'Otros · sin ubicación · 1 foto',
    Icon: MoreHorizontal,
    porNombre: 'Édgar Polo',
    porSub: '+57 301 245 8890',
    barrio: null,
    recibido: 'hace 18h',
    riesgo: 'bajo',
  },
];

function badgeRiesgo(r: Riesgo) {
  if (r === 'alto') return <span className="badge badge-critical"><span className="dot" />Alto</span>;
  if (r === 'medio') return <span className="badge badge-progress"><span className="dot" />Medio</span>;
  return <span className="badge"><span className="dot" style={{ background: 'var(--ink-soft)' }} />Bajo</span>;
}

export function Solicitudes() {
  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Operación</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Solicitudes</span>
          </>
        }
        title="Solicitudes en cola · 18 pendientes"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Filter />Filtros
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <CheckCheck />Aprobar visibles
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 8 }}>
          <button type="button" className="chip chip-active">Todas <span className="chip-count">18</span></button>
          <button type="button" className="chip">
            <AlertCircle style={{ color: 'var(--state-critical)' }} />Críticas <span className="chip-count">6</span>
          </button>
          <button type="button" className="chip">
            <Clock style={{ color: 'var(--state-progress-ink)' }} />Hace +24h <span className="chip-count">4</span>
          </button>
          <button type="button" className="chip">
            <ImageIcon style={{ color: 'var(--biss-teal-900)' }} />Con multimedia <span className="chip-count">11</span>
          </button>
          <button type="button" className="chip">
            <MapPin style={{ color: 'var(--biss-teal-900)' }} />Sin ubicación <span className="chip-count">2</span>
          </button>
        </div>

        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" style={{ accentColor: 'var(--biss-teal)' }} />
                </th>
                <th>Caso reportado</th>
                <th>Reportado por</th>
                <th>Barrio</th>
                <th>Recibido</th>
                <th>Riesgo</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input type="checkbox" style={{ accentColor: 'var(--biss-teal)' }} />
                  </td>
                  <td>
                    <div className="row-title">
                      <div className="ic-mini" style={{ background: `var(--cat-${r.cat})` }}>
                        <r.Icon />
                      </div>
                      <div>
                        <div>{r.titulo}</div>
                        <div className="row-meta">{r.meta}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{r.porNombre}</strong>
                    <br />
                    <span className="row-meta">{r.porSub}</span>
                  </td>
                  <td>
                    {r.barrio ?? (
                      <span style={{ color: 'var(--ink-faint)' }}>— sin ubicar —</span>
                    )}
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 12 }}>{r.recibido}</span>
                  </td>
                  <td>{badgeRiesgo(r.riesgo)}</td>
                  <td className="action-cell">
                    <button type="button" className="approve" aria-label="Aprobar">
                      <Check style={{ width: 14, height: 14 }} />
                    </button>
                    <button type="button" aria-label="Editar">
                      <Edit style={{ width: 14, height: 14 }} />
                    </button>
                    <button type="button" className="danger" aria-label="Rechazar">
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="row row-3" style={{ justifyContent: 'space-between', paddingTop: 4 }}>
          <span className="caption">Mostrando {ROWS.length} de 18 solicitudes</span>
          <div className="row row-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled>
              <ChevronLeft />
            </button>
            <span className="caption" style={{ padding: '0 8px' }}>1 / 3</span>
            <button type="button" className="btn btn-ghost btn-sm">
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
