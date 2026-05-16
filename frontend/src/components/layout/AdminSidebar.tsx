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
} from 'lucide-react';

import { BissMark } from '../brand/BissMark';

interface SideLinkProps {
  to: string;
  Icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
  urgent?: boolean;
  end?: boolean;
}

function SideLink({ to, Icon, label, badge, urgent, end }: SideLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
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

export function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <BissMark size={36} />
        <div>
          <div className="name">BISS</div>
          <div className="sub">Panel admin</div>
        </div>
      </div>

      <nav className="side-nav">
        <div className="side-nav-section">Operación</div>
        <SideLink to="/admin" Icon={LayoutDashboard} label="Dashboard" end />
        <SideLink to="/admin/solicitudes" Icon={Inbox} label="Solicitudes" badge={18} urgent />
        <SideLink to="/admin/testimonios" Icon={MessageSquareQuote} label="Testimonios" badge={7} />
        <SideLink to="/admin/casos" Icon={FolderOpen} label="Casos abiertos" badge={142} />

        <div className="side-nav-section">Contenido</div>
        <SideLink to="/admin/caso" Icon={FileEdit} label="Editor de caso" />
        <SideLink to="/admin/mapa-barrios" Icon={MapIcon} label="Mapa & barrios" />
        <SideLink to="/admin/padrinos" Icon={HandHeart} label="Padrinos" />

        <div className="side-nav-section">Sistema</div>
        <SideLink to="/admin/usuarios" Icon={Users} label="Usuarios" />
        <SideLink to="/admin/metricas" Icon={BarChart3} label="Métricas" />
        <SideLink to="/admin/ajustes" Icon={Settings} label="Ajustes" />
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
