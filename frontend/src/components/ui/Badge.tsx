import type { HTMLAttributes, ReactNode } from 'react';

type Tone =
  | 'critical'
  | 'progress'
  | 'resolved'
  | 'social'
  | 'neutral'
  | 'brand'
  | 'folio';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
}

const TONE_CLASS: Record<Tone, string> = {
  critical: 'badge-critical',
  progress: 'badge-progress',
  resolved: 'badge-resolved',
  social: 'badge-social',
  neutral: 'badge-neutral',
  brand: 'badge-brand',
  folio: 'badge-folio',
};

export function Badge({
  tone = 'neutral',
  dot = false,
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  const classes = ['badge', TONE_CLASS[tone], className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {dot && <span className="dot" />}
      {icon}
      {children}
    </span>
  );
}
