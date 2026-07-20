/**
 * Snap a routing point to the grid and nearby shape anchor positions.
 * @module engine/routing/pointSnap
 */
import type { Page, Point } from '@/types';
import { anchorPoint, DEFAULT_ANCHOR_NAMES } from './anchors';
import { computeSnap } from '@/engine/snapping/snap';
import type { SmartGuide } from '@/engine/snapping/snap';
import { snapToStep } from '@/utils/geometry';

export interface RoutingSnapResult {
  point: Point;
  guides: SmartGuide[];
}

/**
 * Snap a connector waypoint or preview endpoint to grid + object guides.
 */
export function snapRoutingPoint(
  point: Point,
  page: Page,
  options: {
    gridSize: number;
    snapToGrid: boolean;
    snapToObjects: boolean;
    zoom: number;
    excludeShapeIds?: Set<string>;
  },
): RoutingSnapResult {
  let p = { ...point };
  const guides: SmartGuide[] = [];

  if (options.snapToGrid && options.gridSize > 0) {
    p = {
      x: snapToStep(p.x, options.gridSize),
      y: snapToStep(p.y, options.gridSize),
    };
  }

  if (options.snapToObjects) {
    const threshold = 8 / options.zoom;
    for (const shape of Object.values(page.shapes)) {
      if (shape.hidden || options.excludeShapeIds?.has(shape.id)) continue;
      for (const name of DEFAULT_ANCHOR_NAMES) {
        const anchor = anchorPoint(shape, name);
        if (Math.hypot(p.x - anchor.x, p.y - anchor.y) <= threshold) {
          return { point: anchor, guides };
        }
      }
    }

    const box = { x: p.x - 1, y: p.y - 1, width: 2, height: 2 };
    const statics = Object.values(page.shapes)
      .filter((s) => !s.hidden && !options.excludeShapeIds?.has(s.id))
      .map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }));
    const snap = computeSnap(box, statics, threshold);
    if (snap.dx || snap.dy) {
      p = { x: p.x + snap.dx, y: p.y + snap.dy };
      guides.push(...snap.guides);
    }
  }

  return { point: p, guides };
}
