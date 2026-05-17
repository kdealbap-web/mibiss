import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Required when there is no visible label. */
  'aria-label'?: string;
  iconSize?: number;
}

/**
 * Search input con icono de lupa fijo a la izquierda.
 * Usa la clase global `.search-wrap` (definida en styles/components.css).
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ iconSize = 18, className, ...rest }, ref) {
    return (
      <label className={['search-wrap', className].filter(Boolean).join(' ')}>
        <Search size={iconSize} aria-hidden strokeWidth={2.2} />
        <input ref={ref} type="search" {...rest} />
      </label>
    );
  },
);
