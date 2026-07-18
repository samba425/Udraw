/**
 * Resize-handle geometry and math. Handles are axis-aligned; rotation is
 * applied visually via the group transform.
 * @module engine/selection/handles
 */
import type { Point, Rect } from '@/types';

/** The eight resize handles plus rotate handle positions. */
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/** All resize handles in order. */
export const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/** Cursor CSS value for each handle. */
export const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

/** Return the local-space position (0..1 fractions) of a handle. */
export function handleAnchor(handle: ResizeHandle): Point {
  const map: Record<ResizeHandle, Point> = {
    nw: { x: 0, y: 0 },
    n: { x: 0.5, y: 0 },
    ne: { x: 1, y: 0 },
    e: { x: 1, y: 0.5 },
    se: { x: 1, y: 1 },
    s: { x: 0.5, y: 1 },
    sw: { x: 0, y: 1 },
    w: { x: 0, y: 0.5 },
  };
  return map[handle];
}

const MIN_SIZE = 8;

/**
 * Compute a new rect when dragging `handle` to world-space `pointer`.
 * `snap` is applied to the moving edges. Rects are kept non-negative.
 */
export function resizeRect(
  original: Rect,
  handle: ResizeHandle,
  pointer: Point,
  snap: (v: number) => number,
): Rect {
  let { x, y, width, height } = original;
  const right = x + width;
  const bottom = y + height;

  const px = snap(pointer.x);
  const py = snap(pointer.y);

  if (handle.includes('w')) {
    x = Math.min(px, right - MIN_SIZE);
    width = right - x;
  }
  if (handle.includes('e')) {
    width = Math.max(px - x, MIN_SIZE);
  }
  if (handle.includes('n')) {
    y = Math.min(py, bottom - MIN_SIZE);
    height = bottom - y;
  }
  if (handle.includes('s')) {
    height = Math.max(py - y, MIN_SIZE);
  }

  return { x, y, width, height };
}
