import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { useBarrios } from '../../hooks/useBarrios';
import type { Barrio } from '../../types/biss';

interface BarrioAutocompleteProps {
  /** id del barrio seleccionado, o null. */
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  /** Limitar a barrios con coord. Default true. */
  soloConCoords?: boolean;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function BarrioAutocomplete({
  value,
  onChange,
  placeholder = 'Escribe el nombre de tu barrio…',
  label,
  required = false,
  soloConCoords = false,
}: BarrioAutocompleteProps) {
  const { data: barrios = [] } = useBarrios();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => (value != null ? barrios.find((b) => b.id === value) ?? null : null),
    [barrios, value],
  );

  // Sincroniza input con barrio seleccionado.
  useEffect(() => {
    if (selected && !open) setQ(selected.nombre);
  }, [selected, open]);

  // Click fuera cierra.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        if (selected) setQ(selected.nombre);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [selected]);

  const matches = useMemo(() => {
    const list = soloConCoords
      ? barrios.filter((b) => b.coord_lat != null && b.coord_lng != null)
      : barrios;
    const t = normalize(q.trim());
    if (!t) return list.slice(0, 30);
    return list
      .filter((b) => normalize(b.nombre).includes(t))
      .slice(0, 30);
  }, [barrios, q, soloConCoords]);

  const pick = (b: Barrio) => {
    onChange(b.id);
    setQ(b.nombre);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setQ('');
    setOpen(true);
    inputRef.current?.focus();
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(matches.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const m = matches[highlight];
      if (m) pick(m);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} className="mini-field">
      {label && (
        <label htmlFor="barrio-ac" style={{ display: 'block', marginBottom: 4 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--biss-teal-900)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          id="barrio-ac"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={q}
          placeholder={placeholder}
          required={required}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="barrio-ac-list"
          onChange={(e) => {
            setQ(e.target.value);
            setHighlight(0);
            setOpen(true);
            if (selected && e.target.value !== selected.nombre) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          style={{ paddingLeft: 32, paddingRight: q ? 30 : 12 }}
        />
        {q && (
          <button
            type="button"
            onClick={clear}
            aria-label="Limpiar"
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'transparent',
              border: 0,
              color: 'var(--ink-soft)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && matches.length > 0 && (
        <ul
          id="barrio-ac-list"
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: 240,
            overflowY: 'auto',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-pop)',
            listStyle: 'none',
            padding: 4,
            margin: 0,
          }}
        >
          {matches.map((b, i) => (
            <li
              key={b.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(b);
              }}
              onMouseEnter={() => setHighlight(i)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer',
                background: i === highlight ? 'var(--biss-teal-50)' : 'transparent',
                color: 'var(--ink-strong)',
                fontWeight: i === highlight ? 700 : 500,
              }}
            >
              {b.nombre}
            </li>
          ))}
        </ul>
      )}
      {open && matches.length === 0 && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            padding: '10px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--ink-soft)',
          }}
        >
          Sin coincidencias.
        </div>
      )}
    </div>
  );
}
