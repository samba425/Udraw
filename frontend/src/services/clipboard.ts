/**
 * Clipboard for shapes. Uses an in-memory buffer as the source of truth and
 * mirrors to the system clipboard as JSON (best-effort) so copies survive
 * across tabs. Paste offsets each copy so it does not land exactly on top.
 * @module services/clipboard
 */
import type { Shape } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { createId } from '@/models/factory';

/** Serialized clipboard payload. */
interface ClipboardPayload {
  type: 'diagramforge/shapes';
  shapes: Shape[];
}

let buffer: Shape[] = [];
let pasteCount = 0;
const PASTE_OFFSET = 16;

/** Copy the current selection into the clipboard buffer. */
export function copySelection(): void {
  const page = useProjectStore.getState().activePage();
  const shapes = useEditorStore
    .getState()
    .selectedIds.map((id) => page.shapes[id])
    .filter((s): s is Shape => Boolean(s));
  if (shapes.length === 0) return;
  buffer = shapes.map((s) => structuredClone(s));
  pasteCount = 0;
  const payload: ClipboardPayload = { type: 'diagramforge/shapes', shapes: buffer };
  void navigator.clipboard?.writeText(JSON.stringify(payload)).catch(() => undefined);
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
  if (buffer.length === 0) return;
  pasteCount += 1;
  const delta = PASTE_OFFSET * pasteCount;
  const clones = buffer.map((s) => ({
    ...structuredClone(s),
    id: createId('shape'),
    x: s.x + delta,
    y: s.y + delta,
  }));
  useHistoryStore.getState().run('Paste', () => {
    useProjectStore.getState().addShapes(clones);
    useEditorStore.getState().select(clones.map((c) => c.id));
  });
}

/** True when there is something to paste. */
export function hasClipboard(): boolean {
  return buffer.length > 0;
}
