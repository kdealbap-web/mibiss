interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Toggle switch nativo. `<button role="switch">` con `aria-checked`.
 * Sin librerías externas.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleProps) {
  return (
    <label
      className="toggle"
      data-on={checked ? 'true' : 'false'}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <div style={{ flex: 1 }}>
        <div className="toggle-text">{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="toggle-track"
        style={{ border: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
    </label>
  );
}
