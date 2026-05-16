import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  hover?: boolean;
  dark?: boolean;
  children: ReactNode;
}

export function Card({
  raised = false,
  hover = false,
  dark = false,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [
    'card',
    raised && 'card-raised',
    hover && 'card-hover',
    dark && 'card-dark',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
