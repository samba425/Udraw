/**
 * Bottom pages bar: switch, add, rename (double-click), duplicate, and delete
 * pages. Each tab has a kebab menu for page actions.
 * @module components/pages/PagesBar
 */
import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { useProjectStore } from '@/state/projectStore';

/** Page tabs shown along the bottom of the editor. */
export function PagesBar(): React.JSX.Element {
  const pages = useProjectStore((s) => s.project.pages);
  const activePageId = useProjectStore((s) => s.activePageId);
  const setActivePage = useProjectStore((s) => s.setActivePage);
  const addPage = useProjectStore((s) => s.addPage);
  const duplicatePage = useProjectStore((s) => s.duplicatePage);
  const removePage = useProjectStore((s) => s.removePage);
  const renamePage = useProjectStore((s) => s.renamePage);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuId) return;
    const onDown = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuId(null);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [menuId]);

  return (
    <div
      className="flex items-center gap-1 border-t bordered px-2 py-1 surface"
      role="tablist"
      aria-label="Pages"
    >
      {pages.map((page) => (
        <div key={page.id} className="relative flex items-center">
          {editingId === page.id ? (
            <input
              autoFocus
              defaultValue={page.name}
              onBlur={(e) => {
                renamePage(page.id, e.target.value || page.name);
                setEditingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="df-focus-ring w-28 rounded-md border bordered px-2 py-1 text-xs surface-alt"
              style={{ color: 'var(--color-text)' }}
            />
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected={page.id === activePageId}
              onClick={() => setActivePage(page.id)}
              onDoubleClick={() => setEditingId(page.id)}
              className="df-focus-ring flex max-w-[160px] items-center gap-1 truncate rounded-md py-1 pl-3 pr-1 text-xs font-medium"
              style={{
                background: page.id === activePageId ? 'var(--color-surface-alt)' : 'transparent',
                color: page.id === activePageId ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}
            >
              <span className="truncate">{page.name}</span>
              <span
                role="button"
                tabIndex={0}
                title="Page options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuId((v) => (v === page.id ? null : page.id));
                }}
                className="inline-flex h-5 w-5 items-center justify-center rounded hover:brightness-125"
              >
                <MoreVertical size={13} />
              </span>
            </button>
          )}

          {menuId === page.id && (
            <div
              ref={menuRef}
              role="menu"
              className="absolute bottom-full left-0 z-50 mb-1 w-40 overflow-hidden rounded-lg border bordered py-1 shadow-xl surface"
            >
              {[
                { label: 'Rename', action: () => setEditingId(page.id) },
                { label: 'Duplicate', action: () => setActivePage(duplicatePage(page.id)) },
                {
                  label: 'Delete',
                  action: () => removePage(page.id),
                  disabled: pages.length <= 1,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={'disabled' in item ? item.disabled : false}
                  onClick={() => {
                    item.action();
                    setMenuId(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs disabled:opacity-40 enabled:hover:brightness-110"
                  style={{ color: 'var(--color-text)' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        title="Add page"
        aria-label="Add page"
        onClick={() => setActivePage(addPage())}
        className="df-focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md hover:brightness-110"
        style={{ color: 'var(--color-text)' }}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
