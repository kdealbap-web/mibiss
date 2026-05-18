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
} from 'lucide-react';

import { BissMark } from '../brand/BissMark';
import { NavMobile } from './NavMobile';
import { useFlowDrawer } from '../../context/FlowDrawer';
import { useSession } from '../../hooks/useMiCuenta';

interface NavbarProps {
  active?: 'mapa' | 'casos' | 'barrios' | 'concejal' | 'como-funciona';
}

export function Navbar({ active = 'mapa' }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { openFlow } = useFlowDrawer();
  const session = useSession();
  const isAuth = session !== null;

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
            <Link
              className="navbar-entry"
              to={isAuth ? '/mi-cuenta' : '/login'}
              title={isAuth ? 'Abrir mi cuenta' : 'Entrar con tu correo'}
            >
              <span className="av" style={isAuth ? { background: '#3DAF6C' } : undefined}>
                <UserRound />
              </span>
              {isAuth ? 'Mi cuenta' : 'Entrar'}
            </Link>
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
