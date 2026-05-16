import type { CSSProperties } from 'react';

type Variant = 'default' | 'white' | 'mono';

const FILTERS: Record<Variant, string | undefined> = {
  default: undefined,
  white: 'brightness(0) invert(1)',
  mono: 'grayscale(1) brightness(0.45)',
};

interface BissMarkProps {
  variant?: Variant;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

export function BissMark({
  variant = 'default',
  size = 36,
  className,
  style,
  alt = 'BISS',
}: BissMarkProps) {
  return (
    <img
      src="/biss-mark.png"
      alt={alt}
      className={className}
      style={{
        height: size,
        width: size,
        display: 'block',
        filter: FILTERS[variant],
        ...style,
      }}
    />
  );
}
