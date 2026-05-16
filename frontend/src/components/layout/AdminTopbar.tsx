import type { ReactNode } from 'react';

interface AdminTopbarProps {
  crumbs?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
}

export function AdminTopbar({ crumbs, title, actions }: AdminTopbarProps) {
  return (
    <header className="admin-topbar">
      <div>
        {crumbs && <div className="crumbs">{crumbs}</div>}
        <h1>{title}</h1>
      </div>
      {actions && <div className="row row-3">{actions}</div>}
    </header>
  );
}
