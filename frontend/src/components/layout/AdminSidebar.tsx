import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  MessageSquareQuote,
  FolderOpen,
  FileEdit,
  Map as MapIcon,
  HandHeart,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  BookOpen,
  MapPinned,
  Crown,
  Shield as ShieldIcon,
} from 'lucide-react';

import { BissMark } from '../brand/BissMark';
import { useSession, useMiRol, useMiPerfil } from '../../hooks/useMiCuenta';
import { useSolicitudes } from '../../hooks/useSolicitudes';
import { useTestimoniosPendientes } from '../../hooks/useTestimonios';
import { useStatsGlobales } from '../../hooks/useStats';
import { initials } from '../../lib/format';
import { supabase } from '../../lib/supabase';

interface SideLinkProps {
  to: string;
  Icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
  urgent?: boolean;
  end?: boolean;
  onClick?: () => void;
}

function SideLink({ to, Icon, label, badge, urgent, end, onClick }: SideLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        ['side-link', isActive ? 'is-active' : '', urgent ? 'urgent' : '']
          .filter(Boolean)
          .join(' ')
      }
      data-active={undefined}
    >
      <Icon />
      <span style={{ flex: 1 }}>{label}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="badge-pill">{badge}</span>
      )}
    </NavLink>
  );
}

interface AdminSidebarProps {
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

export function AdminSidebar({ open, onToggle, onNavigate }: AdminSidebarProps) {
  const session = useSession();
  const { data: rol } = useMiRol();
  const { data: perfil } = useMiPerfil();
  const { data: solicitudes = [] } = useSolicitudes();
  const { data: testimoniosPend = [] } = useTestimoniosPendientes();
  const { data: stats } = useStatsGlobales();

  const solicitudesCount = solicitudes.length;
  const testimoniosCount = testimoniosPend.length;
  const casosAbiertosCount = (stats?.casos_criticos ?? 0) + (stats?.casos_progreso ?? 0);

  const nombreSesion = perfil
    ? `${perfil.nombres} ${perfil.apellidos}`.trim()
    : session?.user?.email ?? 'Usuario';
  const rolLabel =
    rol === 'superadmin' ? 'Superadmin' :
    rol === 'admin' ? 'Admin' :
    rol === 'editor' ? 'Editor' :
    rol === 'ciudadano' ? 'Ciudadano' :
    'Sesión activa';
  const isCms = rol === 'admin' || rol === 'superadmin' || rol === 'editor';

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/home';
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <BissMark size={36} />
        <div>
          <div className="name">BISS</div>
          <div className="sub">Panel admin</div>
        </div>
        <button
          type="button"
          className="admin-burger"
          onClick={onToggle}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="side-nav">
        <div className="side-nav-section">Operación</div>
        <SideLink to="/admin" Icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} end />
        <SideLink
          to="/admin/solicitudes"
          Icon={Inbox}
          label="Solicitudes"
          badge={solicitudesCount}
          urgent={solicitudesCount > 0}
          onClick={onNavigate}
        />
        <SideLink
          to="/admin/testimonios"
          Icon={MessageSquareQuote}
          label="Testimonios"
          badge={testimoniosCount}
          onClick={onNavigate}
        />
        <SideLink
          to="/admin/casos"
          Icon={FolderOpen}
          label="Casos abiertos"
          badge={casosAbiertosCount}
          onClick={onNavigate}
        />

        <div className="side-nav-section">Contenido</div>
        <SideLink to="/admin/casos" Icon={FileEdit} label="Casos" onClick={onNavigate} />
        <SideLink to="/admin/capitulos" Icon={BookOpen} label="Capítulos" onClick={onNavigate} />
        <SideLink to="/admin/barrios" Icon={MapPinned} label="Barrios" onClick={onNavigate} />
        <SideLink to="/admin/mapa-barrios" Icon={MapIcon} label="Mapa global" onClick={onNavigate} />
        <SideLink to="/admin/padrinos" Icon={HandHeart} label="Padrinos" onClick={onNavigate} />

        <div className="side-nav-section">Sistema</div>
        <SideLink to="/admin/usuarios" Icon={Users} label="Usuarios" onClick={onNavigate} />
        <SideLink to="/admin/metricas" Icon={BarChart3} label="Métricas" onClick={onNavigate} />
        <SideLink to="/admin/ajustes" Icon={Settings} label="Ajustes" onClick={onNavigate} />
      </nav>

      <div className="side-user">
        <div
          className="av"
          aria-hidden
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            minHeight: 36,
            flexShrink: 0,
            flexGrow: 0,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            lineHeight: 1,
          }}
        >
          {initials(nombreSesion)}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            className="name"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
              lineHeight: 1.2,
            }}
          >
            <span
              aria-label="Sesión activa"
              title="Sesión activa"
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#3DAF6C',
                boxShadow: '0 0 0 2px rgba(61,175,108,0.25)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {nombreSesion}
            </span>
          </div>
          <div
            className="role"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {rol === 'superadmin' || rol === 'admin' ? (
              <Crown style={{ width: 11, height: 11, flexShrink: 0 }} />
            ) : isCms ? (
              <ShieldIcon style={{ width: 11, height: 11, flexShrink: 0 }} />
            ) : null}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rolLabel}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 0,
            width: 30,
            height: 30,
            minWidth: 30,
            borderRadius: 8,
            color: 'rgba(255,255,255,0.85)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}
