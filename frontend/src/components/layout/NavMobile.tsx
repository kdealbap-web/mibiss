import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Map as MapIcon,
  Shield,
  Home as HomeIcon,
  UserRound,
  HelpCircle,
  Megaphone,
  X,
} from 'lucide-react';

import { BissMark } from '../brand/BissMark';
import { useFlowDrawer } from '../../context/FlowDrawer';
import { useSession } from '../../hooks/useMiCuenta';

interface NavMobileProps {
  open: boolean;
  onClose: () => void;
  active?: 'mapa' | 'casos' | 'barrios' | 'concejal' | 'como-funciona';
}

export function NavMobile({ open, onClose, active }: NavMobileProps) {
  const { openFlow } = useFlowDrawer();
  const session = useSession();
  const isAuth = session !== null;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <div
      className="nav-mobile"
      data-open={open ? 'true' : undefined}
      aria-hidden={!open}
    >
      <div className="nav-mobile-head">
        <div className="row row-2">
          <BissMark size={32} />
          <span className="name">BISS</span>
        </div>
        <button type="button" className="x" aria-label="Cerrar" onClick={onClose}>
          <X />
        </button>
      </div>

      <div className="nav-mobile-links">
        <Link
          className="nav-mobile-link"
          data-active={active === 'mapa' ? 'true' : undefined}
          to="/home#mapa"
          onClick={onClose}
        >
          <MapIcon />Mapa
        </Link>
        <Link
          className="nav-mobile-link"
          data-active={active === 'casos' ? 'true' : undefined}
          to="/home#casos"
          onClick={onClose}
        >
          <Shield />Casos
        </Link>
        <Link
          className="nav-mobile-link"
          data-active={active === 'barrios' ? 'true' : undefined}
          to="/home#barrios"
          onClick={onClose}
        >
          <HomeIcon />Barrios
        </Link>
        <Link
          className="nav-mobile-link"
          data-active={active === 'concejal' ? 'true' : undefined}
          to="/home#concejal"
          onClick={onClose}
        >
          <UserRound />El concejal
        </Link>
        <Link
          className="nav-mobile-link"
          data-active={active === 'como-funciona' ? 'true' : undefined}
          to="/home#como-funciona"
          onClick={onClose}
        >
          <HelpCircle />Cómo funciona
        </Link>

        <div style={{ borderTop: '1px solid var(--border)', margin: '10px 0' }} />

        <Link
          className="nav-mobile-link"
          to={isAuth ? '/mi-cuenta' : '/login'}
          onClick={onClose}
        >
          <UserRound />
          {isAuth ? 'Mi cuenta' : 'Entrar'}
        </Link>
        <button
          type="button"
          className="nav-mobile-link"
          onClick={() => {
            onClose();
            openFlow('reportar');
          }}
          style={{
            background: 'var(--biss-teal)',
            color: '#FFFFFF',
            border: 0,
            textAlign: 'left',
            width: '100%',
            cursor: 'pointer',
          }}
        >
          <Megaphone />Cuenta tu caso
        </button>
      </div>
    </div>
  );
}
