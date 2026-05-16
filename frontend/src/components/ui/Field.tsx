import type { InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  error?: string;
  icon?: ReactNode;
}

export function Field({
  label,
  helper,
  error,
  icon,
  id,
  className,
  ...inputProps
}: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

  return (
    <div className={['field', error && 'field-error', className].filter(Boolean).join(' ')}>
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div className={['field-input-wrap', icon && 'field-has-icon'].filter(Boolean).join(' ')}>
        {icon && <span className="field-icon">{icon}</span>}
        <input id={inputId} aria-describedby={describedBy} {...inputProps} />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="field-error-text" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id={`${inputId}-helper`} className="field-helper">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
