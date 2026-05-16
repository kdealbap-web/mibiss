import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  outline?: boolean;
  count?: number;
  icon?: ReactNode;
}

export function Chip({
  active = false,
  outline = false,
  count,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ChipProps) {
  const classes = [
    'chip',
    active && 'chip-active',
    outline && 'chip-outline',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      {children}
      {typeof count === 'number' && <span className="chip-count">{count}</span>}
    </button>
  );
}
