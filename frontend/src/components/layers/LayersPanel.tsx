/**
 * Layers panel: create, rename, reorder, show/hide, and lock/unlock layers.
 * Layers are listed top-most first (matching their visual stacking).
 * @module components/layers/LayersPanel
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import { useProjectStore } from '@/state/projectStore';
import { useHistory } from '@/hooks/useHistory';
import { PanelSection } from '@/components/ui/Panel';

/** Editable list of the active page's layers. */
export function LayersPanel(): React.JSX.Element {
  const project = useProjectStore((s) => s.project);
  const activePageId = useProjectStore((s) => s.activePageId);
  const addLayer = useProjectStore((s) => s.addLayer);
  const renameLayer = useProjectStore((s) => s.renameLayer);
  const removeLayer = useProjectStore((s) => s.removeLayer);
  const setLayerVisible = useProjectStore((s) => s.setLayerVisible);
  const setLayerLocked = useProjectStore((s) => s.setLayerLocked);
  const reorderLayer = useProjectStore((s) => s.reorderLayer);
  const history = useHistory();

  const [editingId, setEditingId] = useState<string | null>(null);
  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0]!;
  const ordered = [...page.layers].sort((a, b) => b.order - a.order);

  return (
    <PanelSection
      title="Layers"
      actions={
        <button
          type="button"
          title="Add layer"
          aria-label="Add layer"
          onClick={() => history.run('Add layer', () => addLayer())}
          className="df-focus-ring inline-flex h-5 w-5 items-center justify-center rounded"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Plus size={14} />
        </button>
      }
    >
      <ul className="flex flex-col gap-0.5">
        {ordered.map((layer, i) => (
          <li
            key={layer.id}
            className="flex items-center gap-1 rounded-md px-1 py-1"
            style={{ background: 'transparent' }}
          >
            <button
              type="button"
              title={layer.visible ? 'Hide layer' : 'Show layer'}
              onClick={() => history.run('Toggle layer', () => setLayerVisible(layer.id, !layer.visible))}
              className="df-focus-ring inline-flex h-6 w-6 items-center justify-center rounded"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              type="button"
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              onClick={() => history.run('Toggle lock', () => setLayerLocked(layer.id, !layer.locked))}
              className="df-focus-ring inline-flex h-6 w-6 items-center justify-center rounded"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            {editingId === layer.id ? (
              <input
                autoFocus
                defaultValue={layer.name}
                onBlur={(e) => {
                  history.run('Rename layer', () => renameLayer(layer.id, e.target.value || layer.name));
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                className="df-focus-ring min-w-0 flex-1 rounded border bordered px-1 text-xs surface-alt"
                style={{ color: 'var(--color-text)' }}
              />
            ) : (
              <button
                type="button"
                onDoubleClick={() => setEditingId(layer.id)}
                className="min-w-0 flex-1 truncate text-left text-xs"
                style={{ color: 'var(--color-text)' }}
                title="Double-click to rename"
              >
                {layer.name}
              </button>
            )}

            <button
              type="button"
              title="Move up"
              disabled={i === 0}
              onClick={() => history.run('Reorder layer', () => reorderLayer(layer.id, 'up'))}
              className="df-focus-ring inline-flex h-6 w-5 items-center justify-center rounded disabled:opacity-30"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ChevronUp size={13} />
            </button>
            <button
              type="button"
              title="Move down"
              disabled={i === ordered.length - 1}
              onClick={() => history.run('Reorder layer', () => reorderLayer(layer.id, 'down'))}
              className="df-focus-ring inline-flex h-6 w-5 items-center justify-center rounded disabled:opacity-30"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <ChevronDown size={13} />
            </button>
            <button
              type="button"
              title="Delete layer"
              disabled={page.layers.length <= 1}
              onClick={() => history.run('Delete layer', () => removeLayer(layer.id))}
              className="df-focus-ring inline-flex h-6 w-5 items-center justify-center rounded disabled:opacity-30"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
    </PanelSection>
  );
}
