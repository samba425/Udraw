/**
 * Banner shown when a diagram is opened in view-only mode from a share link.
 * @module components/ui/ViewOnlyBanner
 */
import { Eye, X } from 'lucide-react';
import { useEditorStore } from '@/state/editorStore';

/** Read-only mode notice with option to enable editing locally. */
export function ViewOnlyBanner(): React.JSX.Element | null {
  const readOnly = useEditorStore((s) => s.readOnly);
  const setReadOnly = useEditorStore((s) => s.setReadOnly);
  if (!readOnly) return null;

  return (
    <div
      className="flex items-center gap-2 border-b px-3 py-1.5 text-sm"
      style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}
      role="status"
    >
      <Eye size={16} />
      <span className="flex-1">View-only mode — editing is disabled. Pan and zoom still work.</span>
      <button
        type="button"
        onClick={() => setReadOnly(false)}
        className="rounded px-2 py-0.5 text-xs font-medium hover:brightness-95"
        style={{ background: '#fde68a' }}
      >
        Enable editing
      </button>
      <button type="button" aria-label="Dismiss" onClick={() => setReadOnly(false)} className="rounded p-1 hover:brightness-95">
        <X size={14} />
      </button>
    </div>
  );
}
