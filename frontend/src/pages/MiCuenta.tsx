import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Construction,
  Lightbulb,
  Droplets,
  Heart,
  GraduationCap,
  TreePine,
  Users,
  MoreHorizontal,
  Plus,
  LogOut,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { useFlowDrawer } from '../context/FlowDrawer';
import { supabase } from '../lib/supabase';
import { formatFolio, formatRelative, initials } from '../lib/format';
import { useMiPerfil, useMisCasos, useMisTestimonios, useSession } from '../hooks/useMiCuenta';
import { useBarrios } from '../hooks/useBarrios';
import type { CasoPublico, EstadoCaso } from '../types/biss';

import '../styles/page-mi-cuenta.css';

const ICON_CAT: Record<string, typeof Construction> = {
  agua: Droplets,
  luz: Lightbulb,
  infraestructura: Construction,
  salud: Heart,
  educacion: GraduationCap,
  'medio-ambiente': TreePine,
  social: Users,
  otros: MoreHorizontal,
};

const ESTADO_BADGE: Record<EstadoCaso, { cls: string; txt: string }> = {
  pendiente: { cls: 'badge', txt: 'Pendiente' },
  critico: { cls: 'badge badge-critical', txt: 'Crítico' },
  progreso: { cls: 'badge badge-progress', txt: 'En gestión' },
  resuelto: { cls: 'badge badge-resolved', txt: 'Resuelto' },
  archivado: { cls: 'badge', txt: 'Archivado' },
};

type Tab = 'casos' | 'testimonios' | 'padrinazgos' | 'datos';

export function MiCuenta() {
  const navigate = useNavigate();
  const { openFlow } = useFlowDrawer();
  const session = useSession();
  const { data: perfil, isLoading: perfilLoading } = useMiPerfil();
  const { data: casos = [] } = useMisCasos();
  const { data: testimonios = [] } = useMisTestimonios();
  const { data: barrios = [] } = useBarrios();
  const [tab, setTab] = useState<Tab>('casos');

  useEffect(() => {
    document.body.classList.add('mc-body');
    return () => document.body.classList.remove('mc-body');
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/home', { replace: true });
  };

  // Sin sesión → ir a login
  if (session === null) {
    // Solo redirigimos cuando confirmamos null (no undefined inicial)
    // pero useSession devuelve directamente null si no hay sesión
    return <Navigate to="/login" replace />;
  }

  if (perfilLoading) {
    return (
      <>
        <Navbar />
        <div className="mc-shell">
          <p className="caption">Un segundo…</p>
        </div>
      </>
    );
  }

  const nombre = perfil ? `${perfil.nombres} ${perfil.apellidos}`.trim() : session?.user.email ?? 'Vecino';
  const barrioNombre = perfil ? barrios.find((b) => b.id === perfil.barrio_id)?.nombre ?? '—' : '—';
  const fechaIngreso = perfil
    ? new Date(perfil.creado_en).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
    : '—';

  const testimoniosAprobados = testimonios.filter((t) => t.estado === 'aprobado').length;

  return (
    <>
      <Navbar />

      <div className="mc-shell">
        <div className="profile-card">
          <div className="profile-avatar">{initials(nombre)}</div>
          <div>
            <h1>{nombre}</h1>
            <div className="sub">
              {barrioNombre !== '—' && <>{barrioNombre} · </>}vecino desde {fechaIngreso}
            </div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat"><div className="n">{casos.length}</div><div className="l">Casos</div></div>
            <div className="profile-stat"><div className="n">{testimonios.length}</div><div className="l">Testimonios</div></div>
            <div className="profile-stat"><div className="n">0</div><div className="l">Padrinazgos</div></div>
          </div>
        </div>

        <div className="mc-card">
          <div className="tabs mc-tabs">
            <button type="button" className="tab" data-state={tab === 'casos' ? 'active' : undefined} onClick={() => setTab('casos')}>
              Mis casos
            </button>
            <button type="button" className="tab" data-tone="social" data-state={tab === 'testimonios' ? 'active' : undefined} onClick={() => setTab('testimonios')}>
              Mis testimonios
            </button>
            <button type="button" className="tab" data-tone="resolved" data-state={tab === 'padrinazgos' ? 'active' : undefined} onClick={() => setTab('padrinazgos')}>
              Padrinazgos
            </button>
            <button type="button" className="tab" data-state={tab === 'datos' ? 'active' : undefined} onClick={() => setTab('datos')}>
              Datos
            </button>
          </div>

          {tab === 'casos' && (
            <>
              {casos.length === 0 ? (
                <p className="caption" style={{ padding: '20px 0' }}>
                  Aún no tienes casos publicados. Cuando reportes uno y lo aprobemos, aparece aquí.
                </p>
              ) : (
                casos.map((c) => <MiCasoRow key={c.id} caso={c} />)
              )}
              <div className="row row-3" style={{ marginTop: 20, justifyContent: 'space-between' }}>
                <span className="caption">Mostrando {casos.length} de {casos.length} casos</span>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => openFlow('reportar')}>
                  <Plus />Nuevo caso
                </button>
              </div>
            </>
          )}

          {tab === 'testimonios' && (
            <>
              {testimonios.length === 0 ? (
                <p className="caption" style={{ padding: '20px 0' }}>
                  Aquí no hay voces todavía. Si vives algo en tu barrio, cuéntalo.
                </p>
              ) : (
                <>
                  <p className="caption" style={{ paddingBottom: 12 }}>
                    {testimoniosAprobados} de {testimonios.length} aprobados.
                  </p>
                  {testimonios.map((t) => (
                    <div key={t.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{t.mensaje}</div>
                      <div className="caption" style={{ marginTop: 6 }}>
                        Estado:{' '}
                        <strong style={{ color: t.estado === 'aprobado' ? 'var(--state-resolved)' : 'var(--ink-soft)' }}>
                          {t.estado}
                        </strong>{' '}
                        · {formatRelative(t.creado_en)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {tab === 'padrinazgos' && (
            <p className="caption" style={{ padding: '20px 0' }}>
              Cuando apadrines un caso o un barrio, lo verás listado aquí.
            </p>
          )}

          {tab === 'datos' && (
            <div className="stack stack-3" style={{ padding: '4px 0' }}>
              <div className="data-row"><span className="k">Nombre</span><span className="v">{nombre}</span></div>
              {perfil && (
                <>
                  <div className="data-row"><span className="k">Celular</span><span className="v mono">{perfil.telefono_celular}</span></div>
                  <div className="data-row"><span className="k">Email</span><span className="v">{perfil.email}</span></div>
                  <div className="data-row"><span className="k">Barrio</span><span className="v">{barrioNombre}</span></div>
                  <div className="data-row"><span className="k">Vecino desde</span><span className="v">{fechaIngreso}</span></div>
                  <div className="data-row">
                    <span className="k">Email verificado</span>
                    <span className="v">{perfil.verificado_email ? 'Sí' : 'Pendiente'}</span>
                  </div>
                </>
              )}
              {!perfil && (
                <p className="caption">
                  Tu perfil de ciudadano aún no está creado. Cuando completes el ingreso por celular, verás tus datos aquí.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mc-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 4 }}>Notificaciones</h3>
          <p className="caption" style={{ marginBottom: 16 }}>Cómo te avisamos cuando algo cambie.</p>
          <div className="stack stack-3">
            <label className="row row-3" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span>SMS cuando mi caso cambie de estado</span>
              <input
                type="checkbox"
                defaultChecked={perfil?.acepta_notificaciones ?? true}
                style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }}
              />
            </label>
            <label className="row row-3" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span>SMS cuando alguien suma testimonio a mi caso</span>
              <input
                type="checkbox"
                defaultChecked
                style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }}
              />
            </label>
            <label className="row row-3" style={{ justifyContent: 'space-between', padding: '12px 0' }}>
              <span>Resumen semanal de mi barrio</span>
              <input type="checkbox" style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }} />
            </label>
          </div>
        </div>

        <div className="row row-3" style={{ justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
            <LogOut />Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}

function MiCasoRow({ caso }: { caso: CasoPublico }) {
  const Icon = ICON_CAT[caso.categoria_codigo] ?? MoreHorizontal;
  const { cls, txt } = ESTADO_BADGE[caso.estado];
  return (
    <Link key={caso.id} className="case-row" to={`/caso/${caso.slug}`}>
      <div className="ico" style={{ background: `var(--cat-${caso.categoria_codigo})` }}>
        <Icon />
      </div>
      <div>
        <div className="title">{caso.titulo}</div>
        <div className="meta">
          <span className="mono">{formatFolio(caso.slug)}</span>
          {caso.publicado_en && <> · publicado {formatRelative(caso.publicado_en)}</>}
        </div>
      </div>
      <span className={cls}>
        <span className="dot" />
        {txt}
      </span>
    </Link>
  );
}
