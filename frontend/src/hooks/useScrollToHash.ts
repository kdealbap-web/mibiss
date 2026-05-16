import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router 6 no hace scroll automático cuando solo cambia el hash.
 * Este hook escucha hash + pathname y hace scroll suave a la sección con ese id.
 */
export function useScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const timeout = window.setTimeout(() => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
    return () => window.clearTimeout(timeout);
  }, [hash, pathname]);
}
