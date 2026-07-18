/**
 * Transient toast notifications driven by the `toast` event-bus event. Renders
 * a small stack of auto-dismissing messages in the corner of the screen.
 * @module components/ui/Toaster
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { editorBus } from '@/utils/eventBus';

interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'error';
}

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
} as const;

const COLORS = {
  info: 'var(--color-accent)',
  success: '#22c55e',
  error: '#ef4444',
} as const;

/** Renders the live toast stack. */
export function Toaster(): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let counter = 0;
    return editorBus.on('toast', ({ message, kind }) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, kind }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-16 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind];
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2 rounded-lg border bordered px-3 py-2 text-sm shadow-lg surface"
          >
            <Icon size={16} style={{ color: COLORS[toast.kind] }} />
            <span style={{ color: 'var(--color-text)' }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
