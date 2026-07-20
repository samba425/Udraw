/**
 * Breadcrumb shown while editing inside a group (Esc to exit).
 * @module components/canvas/GroupBreadcrumb
 */
import { ChevronRight, X } from 'lucide-react';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';

/** Shows the active group context above the canvas. */
export function GroupBreadcrumb(): React.JSX.Element | null {
  const activeGroupId = useEditorStore((s) => s.activeGroupId);
  const setActiveGroupId = useEditorStore((s) => s.setActiveGroupId);
  const page = useProjectStore((s) => s.project.pages.find((p) => p.id === s.activePageId) ?? s.project.pages[0]!);

  if (!activeGroupId) return null;
  const group = page.shapes[activeGroupId];
  if (!group) return null;

  return (
    <div
      className="pointer-events-auto absolute left-3 top-3 z-20 flex items-center gap-1 rounded-lg border bordered px-2 py-1 text-xs shadow-md surface"
      style={{ color: 'var(--color-text)' }}
    >
      <span style={{ color: 'var(--color-text-muted)' }}>Page</span>
      <ChevronRight size={12} style={{ color: 'var(--color-text-muted)' }} />
      <span className="font-medium">{group.text?.trim() || 'Group'}</span>
      <button
        type="button"
        aria-label="Exit group"
        title="Exit group (Esc)"
        onClick={() => setActiveGroupId(null)}
        className="ml-1 rounded p-0.5 hover:brightness-125"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
