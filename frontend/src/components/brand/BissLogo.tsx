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
  width?: number | string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function BissLogo({
  variant = 'default',
  height,
  width,
  className,
  style,
  alt = 'BISS — Banco de Ideas y Soluciones de Soledad',
}: BissLogoProps) {
  // Si llega width, manda el ancho (alto auto). Si llega height, alto fijo (ancho auto).
  // Si no llega ninguno, fallback al height=40 anterior.
  const sized: CSSProperties = width
    ? { width, height: 'auto' }
    : { height: height ?? 40, width: 'auto' };
  return (
    <img
      src="/biss-logo.png"
      alt={alt}
      className={className}
      style={{
        ...sized,
        display: 'block',
        filter: FILTERS[variant],
        ...style,
      }}
    />
  );
}
