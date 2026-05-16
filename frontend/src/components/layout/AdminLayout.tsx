import { useEffect, type ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Envoltorio común a todas las rutas /admin/*.
 * Sidebar fijo a la izquierda + main scrollable a la derecha.
 * El AdminTopbar lo monta cada page (porque cambia title/crumbs/actions).
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => document.body.classList.remove('admin-body');
  }, []);

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
