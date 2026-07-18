/**
 * Hit-testing helpers for locating shapes under a world-space point.
 * @module engine/selection/hitTest
 */
import type { Page, Point, Shape } from '@/types';
import { pointInRect } from '@/utils/geometry';

/**
 * Return the topmost (last in draw order) non-hidden, unlocked shape under a
 * world point, or undefined. Rotation is ignored for simplicity/perf.
 */
export function hitTestShape(page: Page, point: Point, excludeIds?: Set<string>): Shape | undefined {
  for (let i = page.order.length - 1; i >= 0; i--) {
    const id = page.order[i]!;
    if (excludeIds?.has(id)) continue;
    const shape = page.shapes[id];
    if (!shape || shape.hidden) continue;
    if (pointInRect(point, { x: shape.x, y: shape.y, width: shape.width, height: shape.height })) {
      return shape;
    }
  }
  return undefined;
}
