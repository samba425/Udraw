/**
 * Labeled numeric input used across the property panel.
 * @module components/property-panel/fields/NumberField
 */
import { useEffect, useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

/** A compact labeled number input that commits on change/blur. */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: NumberFieldProps): React.JSX.Element {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string): void => {
    const num = Number(raw);
    if (!Number.isFinite(num)) return;
    let next = num;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <input
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          setDraft(e.target.value);
          commit(e.target.value);
        }}
        className="df-focus-ring w-full rounded-md border bordered px-2 py-1 text-sm tabular-nums surface-alt"
        style={{ color: 'var(--color-text)' }}
      />
    </label>
  );
}
