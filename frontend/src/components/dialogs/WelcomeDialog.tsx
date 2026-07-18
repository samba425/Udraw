/**
 * Welcome / recovery dialog shown once per session. Offers templates, recent
 * diagrams from IndexedDB, and continue-editing for autosaved work.
 * @module components/dialogs/WelcomeDialog
 */
import { useEffect, useState } from 'react';
import { Clock, LayoutTemplate, Sparkles, Workflow } from 'lucide-react';
import { listProjects } from '@/services/storage/db';
import type { Project } from '@/types';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { createProject } from '@/models/factory';
import { editorBus } from '@/utils/eventBus';
import { isFeatureEnabled } from '@/lib/runtimeConfig';

const SESSION_KEY = 'diagramforge.welcomeShown';

/** Startup hub: recent files, templates, new diagram. */
export function WelcomeDialog(): React.JSX.Element | null {
  const open = useEditorStore((s) => s.welcomeOpen);
  const setOpen = useEditorStore((s) => s.setWelcomeOpen);
  const setTemplatesOpen = useEditorStore((s) => s.setTemplatesOpen);
  const [recent, setRecent] = useState<Project[]>([]);

  useEffect(() => {
    if (!open) return;
    void listProjects().then((all) => setRecent(all.slice(0, 5)));
  }, [open]);

  if (!open) return null;

  const close = (): void => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setOpen(false);
  };

  const openProject = (project: Project): void => {
    useProjectStore.getState().replaceProject(project);
    useHistoryStore.getState().clear();
    close();
    editorBus.emit('zoom:fit', undefined);
    editorBus.emit('toast', { message: `Opened “${project.name}”.`, kind: 'success' });
  };

  const newDiagram = (): void => {
    useProjectStore.getState().replaceProject(createProject());
    useHistoryStore.getState().clear();
    close();
  };

  const showTemplates = (): void => {
    close();
    setTemplatesOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to DiagramForge"
    >
      <div className="w-[min(480px,96vw)] rounded-xl border bordered shadow-2xl surface">
        <div className="border-b bordered px-5 py-4">
          <div className="flex items-center gap-2">
            <Workflow size={22} style={{ color: 'var(--color-accent)' }} />
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Welcome to DiagramForge
            </h1>
          </div>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Offline diagram editor — pick a template, open a recent file, or start blank.
          </p>
        </div>

        <div className="space-y-2 p-4">
          <button
            type="button"
            onClick={showTemplates}
            className="df-focus-ring flex w-full items-center gap-3 rounded-lg border bordered px-3 py-2.5 text-left hover:brightness-110"
          >
            <LayoutTemplate size={18} style={{ color: 'var(--color-accent)' }} />
            <span>
              <span className="block text-sm font-medium">Browse templates</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Flowchart, AWS, org chart, retro board
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              close();
              editorBus.emit('ai:open', undefined);
            }}
            className="df-focus-ring flex w-full items-center gap-3 rounded-lg border bordered px-3 py-2.5 text-left hover:brightness-110"
          >
            <Sparkles size={18} style={{ color: '#a855f7' }} />
            <span>
              <span className="block text-sm font-medium">Generate with AI</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Describe a flow in plain language
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={newDiagram}
            className="df-focus-ring flex w-full items-center gap-3 rounded-lg border bordered px-3 py-2.5 text-left hover:brightness-110"
          >
            <Workflow size={18} />
            <span className="text-sm font-medium">Blank diagram</span>
          </button>

          {recent.length > 0 && (
            <div className="pt-2">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                <Clock size={12} /> Recent (autosaved)
              </div>
              <ul className="space-y-1">
                {recent.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => openProject(p)}
                      className="w-full truncate rounded px-2 py-1.5 text-left text-sm hover:brightness-110"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {p.name}
                      <span className="ml-2 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(p.updatedAt).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t bordered px-4 py-3 text-right">
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            Continue editing
          </button>
        </div>
      </div>
    </div>
  );
}

/** Show welcome once per browser session (unless share URL loaded). */
export function useWelcomeOnStartup(): void {
  const setOpen = useEditorStore((s) => s.setWelcomeOpen);
  useEffect(() => {
    if (!isFeatureEnabled('welcome')) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (window.location.hash.startsWith('#d=') || window.location.hash.startsWith('#dv=')) return;
    const t = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(t);
  }, [setOpen]);
}
