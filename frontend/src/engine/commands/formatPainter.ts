/**
 * Format painter: copy visual style from one shape and apply it to others.
 * @module engine/commands/formatPainter
 */
import type { Shape, Typography } from '@/types';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';

/** Style fields copied by the format painter. */
export interface ShapeStylePatch {
  fill: Shape['fill'];
  stroke: string;
  strokeWidth: number;
  dash: Shape['dash'];
  opacity: number;
  shadow: Shape['shadow'];
  blur: number;
  typography: Typography;
  cornerRadius: number;
}

/** Extract paintable style from a shape. */
export function extractShapeStyle(shape: Shape): ShapeStylePatch {
  return {
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    dash: shape.dash,
    opacity: shape.opacity,
    shadow: shape.shadow,
    blur: shape.blur,
    typography: { ...shape.typography },
    cornerRadius: shape.cornerRadius,
  };
}

/** Activate format painter from the first selected shape. */
export function pickFormatFromSelection(): boolean {
  const editor = useEditorStore.getState();
  const page = useProjectStore.getState().activePage();
  const id = editor.selectedIds.find((sid) => page.shapes[sid]);
  if (!id) return false;
  const style = extractShapeStyle(page.shapes[id]!);
  editor.setFormatPainterStyle(style);
  editor.setFormatPainterActive(true);
  return true;
}

/** Apply the stored format to the given shape ids. */
export function applyFormatToShapes(ids: string[]): void {
  const style = useEditorStore.getState().formatPainterStyle;
  if (!style || ids.length === 0) return;
  const store = useProjectStore.getState();
  useHistoryStore.getState().run('Apply format', () => {
    for (const id of ids) {
      if (store.activePage().shapes[id]) store.updateShape(id, style);
    }
  });
}

/** Deactivate format painter. */
export function clearFormatPainter(): void {
  const editor = useEditorStore.getState();
  editor.setFormatPainterActive(false);
  editor.setFormatPainterStyle(null);
}
