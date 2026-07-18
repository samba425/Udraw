/**
 * Viewport helpers shared by commands and import services.
 * @module utils/viewport
 */
import { useEditorStore } from '@/state/editorStore';
import { screenToWorld } from '@/utils/geometry';

/** World-space center of the visible canvas viewport. */
export function viewportCenter(): { x: number; y: number } {
  const camera = useEditorStore.getState().camera;
  const el = document.querySelector('[aria-label="Diagram canvas"]');
  const rect = el?.getBoundingClientRect();
  return screenToWorld({ x: (rect?.width ?? 800) / 2, y: (rect?.height ?? 600) / 2 }, camera);
}
