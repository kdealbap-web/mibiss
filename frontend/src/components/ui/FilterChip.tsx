import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: ReactNode;
  active: boolean;
  count?: number;
  icon?: ReactNode;
}

/**
 * Toggle chip con aria-pressed. Re-usa la clase global `.chip` + `.chip-active`.
 * Muestra el conteo incluso si es 0 (no deshabilita).
 */
export function FilterChip({
  label,
  active,
  count,
  icon,
  className,
  type = 'button',
  onClick,
  ...rest
}: FilterChipProps) {
  const classes = ['chip', active && 'chip-active', className].filter(Boolean).join(' ');
  return (
    <button
      type={type}
      className={classes}
      aria-pressed={active}
      onClick={onClick}
      {...rest}
    >
      {icon}
      {label}
      {typeof count === 'number' && <span className="chip-count">{count}</span>}
    </button>
  );
}
