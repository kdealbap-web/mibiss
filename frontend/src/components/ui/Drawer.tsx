import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useFocusTrap } from '../../hooks/useFocusTrap';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
}

export function Drawer({ open, onClose, children, ariaLabel }: DrawerProps) {
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="biss-drawer-backdrop"
        data-open={open ? 'true' : undefined}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className="biss-drawer"
        data-open={open ? 'true' : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </aside>
    </>,
    document.body,
  );
}
