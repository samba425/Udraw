/**
 * Color picker field: a swatch button that opens a themed color grid plus a
 * native color input for arbitrary values.
 * @module components/property-panel/fields/ColorField
 */
import { useEffect, useRef, useState } from 'react';
import { COLOR_GRID } from '@/constants/palette';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
}

/** A labeled color swatch with a popover palette. */
export function ColorField({
  label,
  value,
  onChange,
  allowNone = false,
}: ColorFieldProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const isNone = value === 'none' || value === 'transparent';

  return (
    <div className="flex items-center justify-between gap-2" ref={ref}>
      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="df-focus-ring h-6 w-10 rounded border bordered"
          style={{
            background: isNone
              ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 10px 10px'
              : value,
          }}
          aria-label={`${label} color`}
        />
        {open && (
          <div className="absolute right-0 z-50 mt-1 w-[188px] rounded-lg border bordered p-2 shadow-xl surface">
            <div className="grid grid-cols-8 gap-1">
              {COLOR_GRID.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="h-4 w-4 rounded-sm border"
                  style={{ background: c, borderColor: 'var(--color-border)' }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={isNone ? '#ffffff' : value}
                onChange={(e) => onChange(e.target.value)}
                className="h-7 w-full cursor-pointer rounded"
                aria-label="Custom color"
              />
              {allowNone && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('none');
                    setOpen(false);
                  }}
                  className="rounded border bordered px-2 py-1 text-xs"
                >
                  None
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
