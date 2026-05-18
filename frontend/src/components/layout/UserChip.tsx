import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, UserRound } from 'lucide-react';

import { Modal } from '../ui';
import { supabase } from '../../lib/supabase';
import { useMiPerfil, useSession } from '../../hooks/useMiCuenta';
import { initials } from '../../lib/format';

interface UserChipProps {
  /** 'compact' = solo avatar+dot+X (navbar desktop/mobile).
   *  'full'    = avatar+nombre+rol+X (drawer mobile). */
  variant?: 'compact' | 'full';
  /** Opcional. Si lo pasas, se cierra el contenedor (drawer) al click en cualquier acción. */
  onAction?: () => void;
}

export function UserChip({ variant = 'compact', onAction }: UserChipProps) {
  const navigate = useNavigate();
  const session = useSession();
  const { data: perfil } = useMiPerfil();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (session === null) return null;

  const nombre = perfil
    ? `${perfil.nombres} ${perfil.apellidos}`.trim()
    : session.user?.email ?? '';
  const initialsStr = nombre ? initials(nombre) : 'TU';

  const goCuenta = () => {
    onAction?.();
    navigate('/mi-cuenta');
  };

  const doSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      setConfirmOpen(false);
      onAction?.();
      navigate('/home', { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <div
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <button
            type="button"
            onClick={goCuenta}
            aria-label={`Abrir mi cuenta · ${nombre}`}
            title={nombre || 'Mi cuenta'}
            style={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--biss-teal)',
              color: '#FFFFFF',
              border: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '-0.01em',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 120ms ease, box-shadow 120ms ease',
              boxShadow: '0 0 0 2px rgba(61,175,108,0.0)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,175,108,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(61,175,108,0.0)';
            }}
          >
            {initialsStr}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#3DAF6C',
                border: '2px solid #FFFFFF',
              }}
            />
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--surface-sunken)',
              color: 'var(--ink-soft)',
              border: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 0',
            borderTop: '1px solid var(--border)',
            marginTop: 6,
          }}
        >
          <button
            type="button"
            onClick={goCuenta}
            style={{
              position: 'relative',
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--biss-teal)',
              color: '#FFFFFF',
              border: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 15,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label={`Mi cuenta · ${nombre}`}
          >
            {initialsStr}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#3DAF6C',
                border: '2px solid #FFFFFF',
              }}
            />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: 'var(--ink-strong)',
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {nombre || 'Mi cuenta'}
            </div>
            <Link
              to="/mi-cuenta"
              onClick={() => onAction?.()}
              style={{ fontSize: 12, color: 'var(--biss-teal-900)', fontWeight: 700 }}
            >
              <UserRound size={11} style={{ verticalAlign: -2 }} /> Ver mi cuenta
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: 'var(--surface-sunken)',
              color: 'var(--state-critical)',
              border: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} />
            Salir
          </button>
        </div>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => !signingOut && setConfirmOpen(false)}
        title="¿Cerrar sesión?"
        description={nombre ? `Cerrarás la sesión de ${nombre}.` : 'Cerrarás tu sesión actual.'}
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmOpen(false)}
              disabled={signingOut}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={doSignOut}
              disabled={signingOut}
            >
              <LogOut size={14} />
              {signingOut ? 'Saliendo…' : 'Sí, cerrar sesión'}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: 'var(--ink-strong)', margin: 0 }}>
          Tendrás que entrar de nuevo con tu correo para reportar casos, sumar testimonios o ver tu
          panel.
        </p>
      </Modal>
    </>
  );
}
