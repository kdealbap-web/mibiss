import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Construction,
  Lightbulb,
  Droplets,
  Plus,
  LogOut,
} from 'lucide-react';

import { Navbar } from '../components/layout/Navbar';
import { useFlowDrawer } from '../context/FlowDrawer';
import { supabase } from '../lib/supabase';

import '../styles/page-mi-cuenta.css';

type Tab = 'casos' | 'testimonios' | 'padrinazgos' | 'datos';

const CASOS_MOCK = [
  {
    folio: 'CS-2026-0142',
    titulo: 'Cráter en la calle 30',
    cat: 'infraestructura' as const,
    Icon: Construction,
    publicado: 'hace 8 meses',
    estado: 'progreso' as const,
  },
  {
    folio: 'CS-2026-0098',
    titulo: 'Poste sin luz desde marzo',
    cat: 'luz' as const,
    Icon: Lightbulb,
    publicado: 'hace 3 meses',
    estado: 'critico' as const,
  },
  {
    folio: 'CS-2025-0421',
    titulo: 'Sin agua los lunes',
    cat: 'agua' as const,
    Icon: Droplets,
    publicado: 'hace 14 meses',
    estado: 'resuelto' as const,
  },
];

export function MiCuenta() {
  const navigate = useNavigate();
  const { openFlow } = useFlowDrawer();
  const [tab, setTab] = useState<Tab>('casos');

  useEffect(() => {
    document.body.classList.add('mc-body');
    return () => document.body.classList.remove('mc-body');
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/home', { replace: true });
  };

  return (
    <>
      <Navbar />

      <div className="mc-shell">
        <div className="profile-card">
          <div className="profile-avatar">EP</div>
          <div>
            <h1>Édgar Polo</h1>
            <div className="sub">Soledad 2000 · zona occidental · vecino desde sept 2025</div>
          </div>
          <div className="profile-stats">
            <div className="profile-stat"><div className="n">3</div><div className="l">Casos</div></div>
            <div className="profile-stat"><div className="n">5</div><div className="l">Testimonios</div></div>
            <div className="profile-stat"><div className="n">1</div><div className="l">Padrinazgo</div></div>
          </div>
        </div>

        <div className="mc-card">
          <div className="tabs mc-tabs">
            <button
              type="button"
              className="tab"
              data-state={tab === 'casos' ? 'active' : undefined}
              onClick={() => setTab('casos')}
            >
              Mis casos
            </button>
            <button
              type="button"
              className="tab"
              data-tone="social"
              data-state={tab === 'testimonios' ? 'active' : undefined}
              onClick={() => setTab('testimonios')}
            >
              Mis testimonios
            </button>
            <button
              type="button"
              className="tab"
              data-tone="resolved"
              data-state={tab === 'padrinazgos' ? 'active' : undefined}
              onClick={() => setTab('padrinazgos')}
            >
              Padrinazgos
            </button>
            <button
              type="button"
              className="tab"
              data-state={tab === 'datos' ? 'active' : undefined}
              onClick={() => setTab('datos')}
            >
              Datos
            </button>
          </div>

          {tab === 'casos' && (
            <>
              {CASOS_MOCK.map((c) => {
                const badge =
                  c.estado === 'critico' ? 'badge badge-critical'
                    : c.estado === 'progreso' ? 'badge badge-progress'
                    : 'badge badge-resolved';
                const txt =
                  c.estado === 'critico' ? 'Crítico'
                    : c.estado === 'progreso' ? 'En gestión'
                    : 'Resuelto';
                return (
                  <Link key={c.folio} className="case-row" to={`/caso/${c.folio}`}>
                    <div className="ico" style={{ background: `var(--cat-${c.cat})` }}>
                      <c.Icon />
                    </div>
                    <div>
                      <div className="title">{c.titulo}</div>
                      <div className="meta">
                        <span className="mono">{c.folio}</span> · publicado {c.publicado}
                      </div>
                    </div>
                    <span className={badge}>
                      <span className="dot" />{txt}
                    </span>
                  </Link>
                );
              })}
              <div className="row row-3" style={{ marginTop: 20, justifyContent: 'space-between' }}>
                <span className="caption">Mostrando {CASOS_MOCK.length} de {CASOS_MOCK.length} casos</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => openFlow('reportar')}
                >
                  <Plus />Nuevo caso
                </button>
              </div>
            </>
          )}

          {tab === 'testimonios' && (
            <p className="caption" style={{ padding: '20px 0' }}>
              Aún no hay testimonios firmados con tu cuenta. Cuando sumes tu voz a un caso, aparecerán aquí.
            </p>
          )}

          {tab === 'padrinazgos' && (
            <p className="caption" style={{ padding: '20px 0' }}>
              Cuando apadrines un caso o un barrio, lo verás listado aquí.
            </p>
          )}

          {tab === 'datos' && (
            <div className="stack stack-3" style={{ padding: '4px 0' }}>
              <div className="data-row"><span className="k">Nombre</span><span className="v">Édgar Polo</span></div>
              <div className="data-row"><span className="k">Celular</span><span className="v mono">+57 301 245 8890</span></div>
              <div className="data-row"><span className="k">Barrio</span><span className="v">Soledad 2000</span></div>
              <div className="data-row"><span className="k">Vecino desde</span><span className="v">Sept 2025</span></div>
            </div>
          )}
        </div>

        <div className="mc-card" style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 4 }}>Notificaciones</h3>
          <p className="caption" style={{ marginBottom: 16 }}>Cómo te avisamos cuando algo cambie.</p>
          <div className="stack stack-3">
            <label className="row row-3" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span>SMS cuando mi caso cambie de estado</span>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }} />
            </label>
            <label className="row row-3" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span>SMS cuando alguien suma testimonio a mi caso</span>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }} />
            </label>
            <label className="row row-3" style={{ justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span>Resumen semanal de Soledad 2000</span>
              <input type="checkbox" style={{ accentColor: 'var(--biss-teal)', width: 18, height: 18 }} />
            </label>
            <label className="row row-3" style={{ justifyContent: 'space-between', padding: '12px 0' }}>
              <span>Casos cercanos a mi ubicación</span>
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
