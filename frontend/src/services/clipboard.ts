/**
 * Clipboard for shapes and connectors. Uses an in-memory buffer as the source
 * of truth and mirrors to the system clipboard as JSON (best-effort).
 * @module services/clipboard
 */
import type { Edge, Shape } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { bundleFromSelection, cloneBundle } from '@/models/groupBundle';

/** Serialized clipboard payload. */
interface ClipboardPayload {
  type: 'diagramforge/bundle';
  shapes: Shape[];
  edges: Edge[];
}

let buffer: ClipboardPayload | null = null;
let pasteCount = 0;
const PASTE_OFFSET = 16;

/** Copy the current selection into the clipboard buffer (includes group contents). */
export function copySelection(): void {
  const page = useProjectStore.getState().activePage();
  const ids = useEditorStore.getState().selectedIds;
  const bundle = bundleFromSelection(page, ids);
  if (bundle.shapes.length === 0) return;
  buffer = { type: 'diagramforge/bundle', shapes: bundle.shapes, edges: bundle.edges };
  pasteCount = 0;
  void navigator.clipboard?.writeText(JSON.stringify(buffer)).catch(() => undefined);
}

/** Cut = copy then delete the selection. */
export function cutSelection(): void {
  copySelection();
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  useHistoryStore.getState().run('Cut', () => {
    useProjectStore.getState().removeElements(ids);
    useEditorStore.getState().clearSelection();
  });
}

/** Paste the clipboard buffer with a cascading offset; selects the copies. */
export function paste(): void {
  if (!buffer || buffer.shapes.length === 0) return;
  pasteCount += 1;
  const delta = PASTE_OFFSET * pasteCount;
  const cloned = cloneBundle({ shapes: buffer.shapes, edges: buffer.edges }, { x: delta, y: delta });
  useHistoryStore.getState().run('Paste', () => {
    const store = useProjectStore.getState();
    store.addShapes(cloned.shapes);
    store.addEdges(cloned.edges);
    useEditorStore.getState().select(cloned.selectIds);
  });
}

/** True when there is something to paste. */
export function hasClipboard(): boolean {
  return Boolean(buffer && buffer.shapes.length > 0);
}
