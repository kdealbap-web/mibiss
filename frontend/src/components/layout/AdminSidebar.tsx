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
} from 'lucide-react';

import { BissMark } from '../brand/BissMark';

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
      {typeof badge === 'number' && <span className="badge-pill">{badge}</span>}
    </NavLink>
  );
}

interface AdminSidebarProps {
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

export function AdminSidebar({ open, onToggle, onNavigate }: AdminSidebarProps) {
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
        <SideLink to="/admin/solicitudes" Icon={Inbox} label="Solicitudes" badge={18} urgent onClick={onNavigate} />
        <SideLink to="/admin/testimonios" Icon={MessageSquareQuote} label="Testimonios" badge={7} onClick={onNavigate} />
        <SideLink to="/admin/casos" Icon={FolderOpen} label="Casos abiertos" badge={142} onClick={onNavigate} />

        <div className="side-nav-section">Contenido</div>
        <SideLink to="/admin/caso" Icon={FileEdit} label="Editor de caso" onClick={onNavigate} />
        <SideLink to="/admin/mapa-barrios" Icon={MapIcon} label="Mapa & barrios" onClick={onNavigate} />
        <SideLink to="/admin/padrinos" Icon={HandHeart} label="Padrinos" onClick={onNavigate} />

        <div className="side-nav-section">Sistema</div>
        <SideLink to="/admin/usuarios" Icon={Users} label="Usuarios" onClick={onNavigate} />
        <SideLink to="/admin/metricas" Icon={BarChart3} label="Métricas" onClick={onNavigate} />
        <SideLink to="/admin/ajustes" Icon={Settings} label="Ajustes" onClick={onNavigate} />
      </nav>

      <div className="side-user">
        <div className="av">KB</div>
        <div>
          <div className="name">Kevin Balvuena</div>
          <div className="role">Admin · concejal</div>
        </div>
      </div>
    </aside>
  );
}
