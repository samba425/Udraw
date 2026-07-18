/**
 * Small shared property-panel controls: select, range, checkbox, and text.
 * @module components/property-panel/fields/controls
 */

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/** Labeled dropdown select. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="df-focus-ring w-32 rounded-md border bordered px-2 py-1 text-sm surface-alt"
        style={{ color: 'var(--color-text)' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/** Labeled range slider with a numeric readout. */
export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: RangeFieldProps): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 accent-[var(--color-accent)]"
        />
        <span className="w-8 text-right text-xs tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
          {value}
        </span>
      </div>
    </label>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Labeled checkbox. */
export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps): React.JSX.Element {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[var(--color-accent)]"
      />
    </label>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Labeled multiline text field. */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: TextAreaFieldProps): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="df-focus-ring w-full resize-none rounded-md border bordered px-2 py-1 text-sm surface-alt"
        style={{ color: 'var(--color-text)' }}
      />
    </label>
  );
}
