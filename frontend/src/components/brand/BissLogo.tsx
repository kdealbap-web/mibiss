import type { CSSProperties } from 'react';

type Variant = 'default' | 'white' | 'mono';

const FILTERS: Record<Variant, string | undefined> = {
  default: undefined,
  white: 'brightness(0) invert(1)',
  mono: 'grayscale(1) brightness(0.45)',
};

interface BissLogoProps {
  variant?: Variant;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function BissLogo({
  variant = 'default',
  height = 40,
  className,
  style,
  alt = 'BISS — Banco de Ideas y Soluciones de Soledad',
}: BissLogoProps) {
  return (
    <img
      src="/biss-logo.png"
      alt={alt}
      className={className}
      style={{
        height,
        width: 'auto',
        display: 'block',
        filter: FILTERS[variant],
        ...style,
      }}
    />
  );
}
