import { useEffect, useState, type ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const MOBILE_BREAKPOINT = '(max-width: 899px)';

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('admin-body');
    return () => document.body.classList.remove('admin-body');
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sidebarOpen]);

  const handleNavigate = () => {
    if (window.matchMedia(MOBILE_BREAKPOINT).matches) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className="admin-shell"
      data-sidebar-open={sidebarOpen ? 'true' : 'false'}
    >
      <AdminSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        onNavigate={handleNavigate}
      />
      <div
        className="admin-overlay"
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <main className="admin-main">{children}</main>
    </div>
  );
}
