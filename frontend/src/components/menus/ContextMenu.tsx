/**
 * Canvas context menu. Opens on right-click, offering selection-aware actions
 * (clipboard, z-order, align, lock/hide, delete). Self-contained: it installs
 * its own `contextmenu` listener scoped to the canvas application region.
 * @module components/menus/ContextMenu
 */
import { useEffect, useState } from 'react';
import { useEditorStore } from '@/state/editorStore';
import {
  alignSelection,
  deleteSelection,
  distributeSelection,
  duplicateSelection,
  groupSelection,
  reorderSelection,
  selectAll,
  setSelectionHidden,
  setSelectionLocked,
  ungroupSelection,
} from '@/engine/commands/actions';
import { copySelection, cutSelection, hasClipboard, paste } from '@/services/clipboard';
import { pluginManager } from '@/plugins/registry';
import { applyAutoLayout } from '@/engine/layout/autoLayout';
import { useProjectStore } from '@/state/projectStore';

interface MenuEntry {
  label: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  separator?: false;
}
type Entry = MenuEntry | { separator: true };

interface MenuPos {
  x: number;
  y: number;
}

/** Right-click context menu for the canvas. */
export function ContextMenu(): React.JSX.Element | null {
  const [pos, setPos] = useState<MenuPos | null>(null);
  const selectedIds = useEditorStore((s) => s.selectedIds);

  useEffect(() => {
    const onContext = (e: MouseEvent): void => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[role="application"]')) return;
      e.preventDefault();
      setPos({ x: e.clientX, y: e.clientY });
    };
    const onClose = (): void => setPos(null);
    window.addEventListener('contextmenu', onContext);
    window.addEventListener('pointerdown', onClose);
    window.addEventListener('blur', onClose);
    return () => {
      window.removeEventListener('contextmenu', onContext);
      window.removeEventListener('pointerdown', onClose);
      window.removeEventListener('blur', onClose);
    };
  }, []);

  if (!pos) return null;
  const hasSelection = selectedIds.length > 0;
  const multi = selectedIds.length >= 2;

  const entries: Entry[] = [
    { label: 'Cut', shortcut: 'Ctrl+X', action: cutSelection, disabled: !hasSelection },
    { label: 'Copy', shortcut: 'Ctrl+C', action: copySelection, disabled: !hasSelection },
    { label: 'Paste', shortcut: 'Ctrl+V', action: paste, disabled: !hasClipboard() },
    { label: 'Duplicate', shortcut: 'Ctrl+D', action: duplicateSelection, disabled: !hasSelection },
    { separator: true },
    { label: 'Group', shortcut: 'Ctrl+G', action: groupSelection, disabled: !multi },
    { label: 'Ungroup', shortcut: 'Ctrl+Shift+G', action: ungroupSelection, disabled: !hasSelection },
    { separator: true },
    { label: 'Bring to front', action: () => reorderSelection('front'), disabled: !hasSelection },
    { label: 'Send to back', action: () => reorderSelection('back'), disabled: !hasSelection },
    { label: 'Bring forward', action: () => reorderSelection('forward'), disabled: !hasSelection },
    { label: 'Send backward', action: () => reorderSelection('backward'), disabled: !hasSelection },
    { separator: true },
    { label: 'Align left', action: () => alignSelection('left'), disabled: !multi },
    { label: 'Align center', action: () => alignSelection('hcenter'), disabled: !multi },
    { label: 'Align right', action: () => alignSelection('right'), disabled: !multi },
    { label: 'Distribute horizontally', action: () => distributeSelection('horizontal'), disabled: selectedIds.length < 3 },
    { label: 'Distribute vertically', action: () => distributeSelection('vertical'), disabled: selectedIds.length < 3 },
    {
      label: 'Auto layout',
      action: () => {
        const shapeIds = selectedIds.filter((id) => useProjectStore.getState().activePage().shapes[id]);
        applyAutoLayout(shapeIds.length > 0 ? shapeIds : undefined);
      },
      disabled: !hasSelection,
    },
    { separator: true },
    { label: 'Lock', action: () => setSelectionLocked(true), disabled: !hasSelection },
    { label: 'Unlock', action: () => setSelectionLocked(false), disabled: !hasSelection },
    { label: 'Hide', action: () => setSelectionHidden(true), disabled: !hasSelection },
    { separator: true },
    { label: 'Select all', shortcut: 'Ctrl+A', action: selectAll },
    { label: 'Delete', shortcut: 'Del', action: deleteSelection, disabled: !hasSelection },
  ];

  const pluginItems = pluginManager.menuItems();
  if (pluginItems.length > 0) {
    entries.push({ separator: true });
    for (const item of pluginItems) {
      entries.push({
        label: item.title,
        action: () => pluginManager.runCommand(item.command),
        disabled: item.requiresSelection ? !hasSelection : false,
      });
    }
  }

  return (
    <div
      role="menu"
      className="fixed z-[60] min-w-[220px] overflow-hidden rounded-lg border bordered py-1 shadow-2xl surface"
      style={{ left: Math.min(pos.x, window.innerWidth - 240), top: Math.min(pos.y, window.innerHeight - 420) }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {entries.map((entry, i) =>
        'separator' in entry ? (
          <div key={`sep${i}`} className="my-1 h-px" style={{ background: 'var(--color-border)' }} />
        ) : (
          <button
            key={entry.label}
            role="menuitem"
            type="button"
            disabled={entry.disabled}
            onClick={() => {
              entry.action();
              setPos(null);
            }}
            className="flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-sm disabled:opacity-40 enabled:hover:brightness-110"
            style={{ color: 'var(--color-text)' }}
          >
            <span>{entry.label}</span>
            {entry.shortcut && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {entry.shortcut}
              </span>
            )}
          </button>
        ),
      )}
    </div>
  );
}
