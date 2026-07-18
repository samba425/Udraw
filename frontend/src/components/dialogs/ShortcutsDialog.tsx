/**
 * Keyboard shortcuts reference dialog. Opens with `?` or from the toolbar.
 * @module components/dialogs/ShortcutsDialog
 */
import { Keyboard } from 'lucide-react';
import { SHORTCUT_GROUPS } from '@/constants/shortcuts';
import { useEditorStore } from '@/state/editorStore';

/** Modal listing all keyboard shortcuts. */
export function ShortcutsDialog(): React.JSX.Element | null {
  const open = useEditorStore((s) => s.shortcutsOpen);
  const setOpen = useEditorStore((s) => s.setShortcutsOpen);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="max-h-[85vh] w-[min(520px,96vw)] overflow-hidden rounded-xl border bordered shadow-2xl surface"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b bordered px-4 py-3">
          <Keyboard size={18} style={{ color: 'var(--color-accent)' }} />
          <h2 className="flex-1 text-sm font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-xs hover:brightness-125"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Close
          </button>
        </div>
        <div className="df-scroll max-h-[70vh] overflow-y-auto px-4 py-3">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                {group.title}
              </h3>
              <dl className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.keys + item.action} className="flex items-start justify-between gap-3 text-sm">
                    <dt>
                      <kbd className="rounded border bordered px-1.5 py-0.5 font-mono text-[11px]">{item.keys}</kbd>
                    </dt>
                    <dd className="text-right" style={{ color: 'var(--color-text)' }}>
                      {item.action}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
