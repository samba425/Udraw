/**
 * Template gallery — pick a starter diagram or a saved user template.
 * @module components/dialogs/TemplatesDialog
 */
import { useState } from 'react';
import { BookmarkPlus, LayoutTemplate, Trash2, X } from 'lucide-react';
import { DIAGRAM_TEMPLATES } from '@/templates';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { editorBus } from '@/utils/eventBus';
import {
  deleteUserTemplate,
  listUserTemplates,
  projectFromUserTemplate,
  saveActivePageAsTemplate,
  type UserTemplate,
} from '@/services/templates/userTemplates';

/** Modal grid of starter and user diagram templates. */
export function TemplatesDialog(): React.JSX.Element | null {
  const open = useEditorStore((s) => s.templatesOpen);
  const setOpen = useEditorStore((s) => s.setTemplatesOpen);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>(() => listUserTemplates());

  if (!open) return null;

  const refreshUserTemplates = (): void => setUserTemplates(listUserTemplates());

  const applyBuiltIn = (templateId: string): void => {
    const template = DIAGRAM_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    const project = template.build();
    useProjectStore.getState().replaceProject(project);
    useHistoryStore.getState().clear();
    setOpen(false);
    editorBus.emit('zoom:fit', undefined);
    editorBus.emit('toast', { message: `Loaded “${template.title}” template.`, kind: 'success' });
  };

  const applyUser = (template: UserTemplate): void => {
    const project = projectFromUserTemplate(template);
    useProjectStore.getState().replaceProject(project);
    useHistoryStore.getState().clear();
    setOpen(false);
    editorBus.emit('zoom:fit', undefined);
    editorBus.emit('toast', { message: `Loaded “${template.title}”.`, kind: 'success' });
  };

  const saveCurrent = (): void => {
    const page = useProjectStore.getState().activePage();
    const title = window.prompt('Template name', page.name);
    if (!title?.trim()) return;
    const description = window.prompt('Description (optional)', `Saved from ${page.name}`) ?? '';
    saveActivePageAsTemplate(title.trim(), description);
    refreshUserTemplates();
    editorBus.emit('toast', { message: `Saved “${title.trim()}” to My templates.`, kind: 'success' });
  };

  const removeUser = (id: string, title: string): void => {
    if (!window.confirm(`Delete template “${title}”?`)) return;
    deleteUserTemplate(id);
    refreshUserTemplates();
    editorBus.emit('toast', { message: 'Template deleted.', kind: 'success' });
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
        className="max-h-[85vh] w-[min(640px,96vw)] overflow-y-auto rounded-xl border bordered shadow-2xl surface"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bordered bg-[var(--color-surface)] px-4 py-3">
          <LayoutTemplate size={18} style={{ color: 'var(--color-accent)' }} />
          <h2 className="flex-1 text-sm font-semibold">Start from a template</h2>
          <button
            type="button"
            onClick={saveCurrent}
            className="flex items-center gap-1 rounded-lg border bordered px-2 py-1 text-xs hover:brightness-110"
            style={{ color: 'var(--color-text)' }}
          >
            <BookmarkPlus size={14} />
            Save current page
          </button>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded p-1 hover:brightness-125">
            <X size={16} />
          </button>
        </div>

        {userTemplates.length > 0 && (
          <section className="border-b bordered p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              My templates
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {userTemplates.map((t) => (
                <div key={t.id} className="relative rounded-lg border bordered p-3">
                  <button
                    type="button"
                    onClick={() => applyUser(t)}
                    className="df-focus-ring w-full text-left transition hover:brightness-110"
                  >
                    <div className="mb-2 h-1.5 w-12 rounded-full" style={{ background: t.accent }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {t.title}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t.description}
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${t.title}`}
                    onClick={() => removeUser(t.id, t.title)}
                    className="absolute right-2 top-2 rounded p-1 hover:bg-red-500/10"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {DIAGRAM_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyBuiltIn(t.id)}
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
