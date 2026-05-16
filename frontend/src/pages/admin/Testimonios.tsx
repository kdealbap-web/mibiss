import { Link } from 'react-router-dom';
import {
  Filter,
  CheckCheck,
  User,
  UserX,
  AlertTriangle,
  Construction,
  Droplets,
  Users,
  MapPin,
  Edit,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminTopbar } from '../../components/layout/AdminTopbar';

interface Item {
  autor: string;
  rol?: string;
  anonimo?: boolean;
  cel?: string;
  caso: string;
  cuando: string;
  cat: 'infraestructura' | 'agua' | 'social';
  CatIcon: typeof Construction;
  catLabel: string;
  texto: string;
  warning?: string;
  metaExtra?: 'lugar-soledad-2000' | 'anonimo' | 'revisar';
}

const ITEMS: Item[] = [
  {
    autor: 'Diana Pérez',
    rol: 'vecina del barrio',
    caso: 'Cráter en calle 30',
    cuando: 'hace 3 horas',
    cat: 'infraestructura',
    CatIcon: Construction,
    catLabel: 'Infraestructura',
    metaExtra: 'lugar-soledad-2000',
    texto:
      'Esa mañana iba al colegio con mi hija. Cuando vimos a Don Édgar tirado en la calle, ella se asustó tanto que no quiso volver a pasar por ahí. Llevo tres meses cargándola para evitarle el susto. Esto no debería ser normal.',
  },
  {
    autor: 'Anónimo',
    anonimo: true,
    cel: '+57 312 …4521',
    caso: 'Sin agua los lunes',
    cuando: 'hace 5 horas',
    cat: 'agua',
    CatIcon: Droplets,
    catLabel: 'Agua',
    metaExtra: 'anonimo',
    texto:
      'Llevo cuatro lunes seguidos sin agua. Mi hija nació hace dos meses. Para hervir tetero toca cargar baldes de la casa de mi mamá en San Vicente. Es injusto.',
  },
  {
    autor: 'Don Rafael Caicedo',
    rol: 'líder JAC',
    caso: 'Cráter en calle 30',
    cuando: 'hace 7 horas',
    cat: 'infraestructura',
    CatIcon: Construction,
    catLabel: 'Infraestructura',
    metaExtra: 'revisar',
    warning:
      'El filtro detectó una palabra fuerte. Considera editarla antes de aprobar — o aprobar como está si el contexto lo justifica.',
    texto:
      'Como presidente de la JAC ya nos cansamos. Llevamos doce oficios radicados a Triple A y aún no hay respuesta formal. Estos pendejos no responden. Que se entere la prensa.',
  },
  {
    autor: 'Marlén J.',
    rol: 'vecina',
    caso: 'Niños sin parque seguro',
    cuando: 'hace 11 horas',
    cat: 'social',
    CatIcon: Users,
    catLabel: 'Social',
    texto:
      'En el parque mi hijo se rompió la rodilla con un fierro suelto. Hace dos años está cerrado por reparación. Cero reparación. Solo cinta amarilla y olvido.',
  },
];

export function TestimoniosAdmin() {
  return (
    <AdminLayout>
      <AdminTopbar
        crumbs={
          <>
            <Link to="/admin">Operación</Link> /{' '}
            <span style={{ color: 'var(--ink-strong)', fontWeight: 600 }}>Testimonios</span>
          </>
        }
        title="Moderación de testimonios · 7 pendientes"
        actions={
          <>
            <button type="button" className="btn btn-secondary btn-sm">
              <Filter />Filtros
            </button>
            <button type="button" className="btn btn-primary btn-sm">
              <CheckCheck />Aprobar todos
            </button>
          </>
        }
      />

      <div className="admin-page">
        <div className="row row-3 wrap" style={{ gap: 8 }}>
          <button type="button" className="chip chip-active">Todos <span className="chip-count">7</span></button>
          <button type="button" className="chip">
            <User style={{ color: 'var(--cat-social)' }} />Firmados <span className="chip-count">4</span>
          </button>
          <button type="button" className="chip">
            <UserX style={{ color: 'var(--ink-soft)' }} />Anónimos <span className="chip-count">3</span>
          </button>
          <button type="button" className="chip">
            <AlertTriangle style={{ color: 'var(--state-progress-ink)' }} />Lenguaje fuerte <span className="chip-count">1</span>
          </button>
        </div>

        <div className="admin-card" style={{ padding: '18px 20px' }}>
          {ITEMS.map((it, i) => (
            <div
              key={i}
              className="mod-card"
              style={it.metaExtra === 'revisar' ? { borderColor: 'var(--state-progress-border)' } : undefined}
            >
              <div className="mod-card-head">
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--ink-strong)', fontSize: 14.5 }}>
                    {it.autor}
                    {it.rol && (
                      <> · <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{it.rol}</span></>
                    )}
                    {it.cel && (
                      <> <span style={{ color: 'var(--ink-faint)', fontWeight: 500, fontSize: 12 }}>· cel. {it.cel}</span></>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                    Sobre:{' '}
                    <a href="#" style={{ fontWeight: 600, color: 'var(--biss-teal-900)' }}>
                      {it.caso}
                    </a>{' '}
                    · {it.cuando}
                  </div>
                </div>
                <div className="mod-card-meta">
                  <span className={`badge badge-cat-${it.cat}`}>
                    <it.CatIcon />{it.catLabel}
                  </span>
                  {it.metaExtra === 'lugar-soledad-2000' && (
                    <span className="badge">
                      <MapPin />Soledad 2000
                    </span>
                  )}
                  {it.metaExtra === 'anonimo' && (
                    <span className="badge">
                      <UserX />Anónimo
                    </span>
                  )}
                  {it.metaExtra === 'revisar' && (
                    <span className="badge badge-progress">
                      <span className="dot" />Revisar
                    </span>
                  )}
                </div>
              </div>
              <div className="mod-card-body">{it.texto}</div>
              {it.warning && (
                <div className="alert alert-warning" style={{ padding: '10px 12px', marginBottom: 12 }}>
                  <AlertTriangle className="alert-icon" style={{ width: 16, height: 16 }} />
                  <div className="alert-body">
                    <div className="alert-text" style={{ fontSize: 12 }}>{it.warning}</div>
                  </div>
                </div>
              )}
              <div className="mod-card-actions">
                <button type="button" className="btn btn-ghost btn-sm">
                  <Edit />Editar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    ['--btn-ink' as never]: 'var(--state-critical)',
                    ['--btn-border' as never]: 'var(--state-critical)',
                    ['--btn-bg-hover' as never]: 'var(--state-critical-bg)',
                  }}
                >
                  <X />Rechazar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{
                    ['--btn-bg' as never]: 'var(--state-resolved)',
                    ['--btn-border' as never]: 'var(--state-resolved)',
                    ['--btn-bg-hover' as never]: '#0E8A50',
                  }}
                >
                  <Check />Aprobar y publicar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="row row-3" style={{ justifyContent: 'space-between', paddingTop: 4 }}>
          <span className="caption">Mostrando {ITEMS.length} de 7 testimonios</span>
          <div className="row row-2">
            <button type="button" className="btn btn-ghost btn-sm" disabled>
              <ChevronLeft />
            </button>
            <span className="caption" style={{ padding: '0 8px' }}>1 / 2</span>
            <button type="button" className="btn btn-ghost btn-sm">
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
