import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Map as MapIcon,
  Shield,
  Home as HomeIcon,
  UserRound,
  HelpCircle,
  Megaphone,
  Menu,
  ShieldCheck,
} from 'lucide-react';

import { BissMark } from '../brand/BissMark';
import { NavMobile } from './NavMobile';
import { UserChip } from './UserChip';
import { useFlowDrawer } from '../../context/FlowDrawer';
import { useMiRol, useSession } from '../../hooks/useMiCuenta';

interface NavbarProps {
  active?: 'mapa' | 'casos' | 'barrios' | 'concejal' | 'como-funciona';
}

export function Navbar({ active = 'mapa' }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { openFlow } = useFlowDrawer();
  const session = useSession();
  const { data: rol } = useMiRol();
  const isAuth = session !== null;
  const isCms = rol === 'admin' || rol === 'superadmin' || rol === 'editor';

  const link = (id: NavbarProps['active'], to: string, Icon: typeof MapIcon, label: string) => (
    <NavLink
      className="navbar-link"
      data-active={active === id ? 'true' : undefined}
      to={to}
    >
      <Icon />
      {label}
    </NavLink>
  );

  return (
    <>
      <header className="navbar">
        <nav className="navbar-inner">
          <Link className="navbar-brand" to="/home">
            <BissMark size={44} />
            <div>
              <div className="name">BISS</div>
              <span className="place">Soledad · Atlántico</span>
            </div>
          </Link>

          <div className="navbar-links">
            {link('mapa', '/home#mapa', MapIcon, 'Mapa')}
            {link('casos', '/home#casos', Shield, 'Casos')}
            {link('barrios', '/home#barrios', HomeIcon, 'Barrios')}
            {link('concejal', '/home#concejal', UserRound, 'El concejal')}
            {link('como-funciona', '/home#como-funciona', HelpCircle, 'Cómo funciona')}
          </div>

          <div className="navbar-right">
            {isAuth && isCms && (
              <Link
                to="/admin"
                className="navbar-link"
                style={{
                  background: 'var(--biss-teal-50)',
                  color: 'var(--biss-teal-900)',
                  fontWeight: 800,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1.5px solid var(--biss-teal-100)',
                }}
                title="Panel admin"
              >
                <ShieldCheck size={14} />
                Admin
              </Link>
            )}
            {isAuth ? (
              <UserChip variant="compact" />
            ) : (
              <Link className="navbar-entry" to="/login" title="Entrar con tu correo">
                <span className="av">
                  <UserRound />
                </span>
                Entrar
              </Link>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm navbar-cta"
              onClick={() => openFlow('reportar')}
            >
              <Megaphone />
              Cuenta tu caso
            </button>
          </div>

          <button
            className="navbar-burger"
            type="button"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
        </nav>
      </header>

      <NavMobile open={open} onClose={() => setOpen(false)} active={active} />
    </>
  );
}
