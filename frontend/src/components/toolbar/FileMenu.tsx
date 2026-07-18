/**
 * File menu: new/open/save/export/import actions. Export and import are
 * dispatched via the event bus and handled by the services layer.
 * @module components/toolbar/FileMenu
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileDown, FilePlus2, FileUp, LayoutTemplate, Link2, Pencil, Workflow } from 'lucide-react';
import { editorBus } from '@/utils/eventBus';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { useEditorStore } from '@/state/editorStore';
import { createProject } from '@/models/factory';
import { pluginManager } from '@/plugins/registry';
import { exportWithPlugin } from '@/services/export';
import { copyShareLink, copyViewOnlyShareLink } from '@/services/share/urlShare';

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  action: () => void;
}

/** The application/file menu dropdown. */
export function FileMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const replaceProject = useProjectStore((s) => s.replaceProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const project = useProjectStore((s) => s.project);
  const projectName = project.name;
  const setTemplatesOpen = useEditorStore((s) => s.setTemplatesOpen);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const items: MenuItem[] = [
    {
      label: 'New diagram',
      icon: FilePlus2,
      action: () => {
        replaceProject(createProject());
        useHistoryStore.getState().clear();
      },
    },
    {
      label: 'Rename diagram...',
      icon: Pencil,
      action: () => {
        const next = window.prompt('Diagram name', projectName);
        if (next && next.trim()) renameProject(next.trim());
      },
    },
    {
      label: 'Browse templates...',
      icon: LayoutTemplate,
      action: () => setTemplatesOpen(true),
    },
    {
      label: 'Copy share link',
      icon: Link2,
      action: () => {
        void copyShareLink(project)
          .then(() => editorBus.emit('toast', { message: 'Share link copied.', kind: 'success' }))
          .catch(() => editorBus.emit('toast', { message: 'Could not copy link.', kind: 'error' }));
      },
    },
    {
      label: 'Copy view-only link',
      icon: Link2,
      action: () => {
        void copyViewOnlyShareLink(project)
          .then(() => editorBus.emit('toast', { message: 'View-only link copied.', kind: 'success' }))
          .catch(() => editorBus.emit('toast', { message: 'Could not copy link.', kind: 'error' }));
      },
    },
    { label: 'Import file...', icon: FileUp, action: () => editorBus.emit('import:request', undefined) },
    { label: 'Save as JSON', icon: FileDown, action: () => editorBus.emit('export:request', { format: 'json' }) },
    { label: 'Export as PNG', icon: FileDown, action: () => editorBus.emit('export:request', { format: 'png' }) },
    { label: 'Export as SVG', icon: FileDown, action: () => editorBus.emit('export:request', { format: 'svg' }) },
    { label: 'Export as PDF', icon: FileDown, action: () => editorBus.emit('export:request', { format: 'pdf' }) },
    { label: 'Export project (.zip)', icon: FileDown, action: () => editorBus.emit('export:request', { format: 'zip' }) },
    ...pluginManager.exporters().map((exporter) => ({
      label: exporter.title,
      icon: FileDown,
      action: () => {
        const store = useProjectStore.getState();
        try {
          exportWithPlugin(exporter.id, store.project, store.activePage());
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Export failed';
          editorBus.emit('toast', { message, kind: 'error' });
        }
      },
    })),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="df-focus-ring flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold hover:brightness-110"
        style={{ color: 'var(--color-text)' }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Workflow size={18} style={{ color: 'var(--color-accent)' }} />
        <span className="max-w-[140px] truncate">{projectName}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border bordered py-1 shadow-xl surface"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm hover:brightness-110"
              style={{ color: 'var(--color-text)' }}
            >
              <item.icon size={15} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
