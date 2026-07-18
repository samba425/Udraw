/**
 * Small accessible icon button used throughout toolbars and panels.
 * @module components/ui/IconButton
 */
import { forwardRef } from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
}

/** An icon-only button with tooltip label and pressed state. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { active = false, label, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`df-focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        active ? 'text-white' : 'hover:brightness-110'
      } ${className}`}
      style={{
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? '#fff' : 'var(--color-text)',
      }}
      {...rest}
    >
      {children}
    </button>
  );
});
