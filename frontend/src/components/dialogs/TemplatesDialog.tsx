/**
 * Template gallery — pick a starter diagram (flowchart, AWS, org chart, retro).
 * @module components/dialogs/TemplatesDialog
 */
import { LayoutTemplate, X } from 'lucide-react';
import { DIAGRAM_TEMPLATES } from '@/templates';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { editorBus } from '@/utils/eventBus';

/** Modal grid of starter diagram templates. */
export function TemplatesDialog(): React.JSX.Element | null {
  const open = useEditorStore((s) => s.templatesOpen);
  const setOpen = useEditorStore((s) => s.setTemplatesOpen);

  if (!open) return null;

  const apply = (templateId: string): void => {
    const template = DIAGRAM_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const project = template.build();
    useProjectStore.getState().replaceProject(project);
    useHistoryStore.getState().clear();
    setOpen(false);
    editorBus.emit('zoom:fit', undefined);
    editorBus.emit('toast', { message: `Loaded “${template.title}” template.`, kind: 'success' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Diagram templates"
      onMouseDown={() => setOpen(false)}
    >
      <div
        className="w-[min(640px,96vw)] rounded-xl border bordered shadow-2xl surface"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b bordered px-4 py-3">
          <LayoutTemplate size={18} style={{ color: 'var(--color-accent)' }} />
          <h2 className="flex-1 text-sm font-semibold">Start from a template</h2>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded p-1 hover:brightness-125">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {DIAGRAM_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => apply(t.id)}
              className="df-focus-ring rounded-lg border bordered p-3 text-left transition hover:brightness-110"
            >
              <div className="mb-2 h-1.5 w-12 rounded-full" style={{ background: t.accent }} />
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {t.title}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t.description}
              </div>
              <span className="mt-2 inline-block text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                {t.category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
