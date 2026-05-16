import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';

interface FlowShellProps {
  step: number;
  totalSteps: number;
  title: string;
  lead?: ReactNode;
  onBack?: () => void;
  onClose: () => void;
  body: ReactNode;
  footer: ReactNode;
  stepLabel?: string;
}

/**
 * Estructura base de cualquier paso de flow.
 * Reusa las clases del prototipo (.sheet, .sheet-handle, .sheet-bar, .sheet-body, .sheet-footer).
 */
export function FlowShell({
  step,
  totalSteps,
  title,
  lead,
  onBack,
  onClose,
  body,
  footer,
  stepLabel,
}: FlowShellProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [step]);

  return (
    <div className="sheet">
      <div className="sheet-handle" />
      <div className="sheet-bar">
        {onBack ? (
          <button type="button" className="back" onClick={onBack}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Atrás
          </button>
        ) : (
          <span />
        )}
        <span className="sheet-bar-step">{stepLabel ?? `${step} / ${totalSteps}`}</span>
        <button type="button" className="x" aria-label="Cerrar" onClick={onClose}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <div className="sheet-body" ref={bodyRef}>
        <div className="sheet-title">{title}</div>
        {lead && <div className="sheet-lead">{lead}</div>}
        {body}
      </div>
      <div className="sheet-footer">{footer}</div>
    </div>
  );
}

/**
 * Persistencia simple de draft en localStorage (clave biss:flow:<nombre>).
 * El estado vive en useState; al setear se rehidrata localStorage.
 * clear() borra la entrada (típicamente tras submit exitoso o "limpiar").
 */
export function useFlowDraft<T>(
  flowName: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const KEY = `biss:flow:${flowName}`;
  const [state, setStateRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as T;
    } catch { /* noop */ }
    return initial;
  });

  const setState = (next: T | ((prev: T) => T)) => {
    setStateRaw((prev) => {
      const value = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* noop */ }
      return value;
    });
  };

  const clear = () => {
    try { localStorage.removeItem(KEY); } catch { /* noop */ }
  };

  return [state, setState, clear];
}
