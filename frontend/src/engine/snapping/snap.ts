/**
 * Snap-to-object logic with smart alignment guides. Given the moving bounds
 * and the static shapes, it returns a small delta that snaps edges/centers
 * together plus the guide lines to render.
 * @module engine/snapping/snap
 */
import type { Rect } from '@/types';

/** A guide line to draw while dragging. */
export interface SmartGuide {
  orientation: 'v' | 'h';
  /** World coordinate of the line (x for vertical, y for horizontal). */
  position: number;
  /** Extent of the guide for rendering. */
  from: number;
  to: number;
}

/** Result of a snap computation. */
export interface SnapResult {
  dx: number;
  dy: number;
  guides: SmartGuide[];
}

const THRESHOLD = 6;

/** Candidate positions along one axis of a rect (near/center/far edges). */
function axisTargets(rect: Rect, axis: 'x' | 'y'): number[] {
  return axis === 'x'
    ? [rect.x, rect.x + rect.width / 2, rect.x + rect.width]
    : [rect.y, rect.y + rect.height / 2, rect.y + rect.height];
}

/**
 * Compute a snap delta to align the moving rect to any static rect. Threshold
 * is expressed in world units and typically divided by zoom by the caller.
 */
export function computeSnap(moving: Rect, statics: Rect[], threshold = THRESHOLD): SnapResult {
  let bestX: { delta: number; guide: SmartGuide } | null = null;
  let bestY: { delta: number; guide: SmartGuide } | null = null;

  const movingXs = axisTargets(moving, 'x');
  const movingYs = axisTargets(moving, 'y');

  for (const s of statics) {
    for (const sx of axisTargets(s, 'x')) {
      for (const mx of movingXs) {
        const delta = sx - mx;
        if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
          bestX = {
            delta,
            guide: {
              orientation: 'v',
              position: sx,
              from: Math.min(s.y, moving.y),
              to: Math.max(s.y + s.height, moving.y + moving.height),
            },
          };
        }
      }
    }
    for (const sy of axisTargets(s, 'y')) {
      for (const my of movingYs) {
        const delta = sy - my;
        if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
          bestY = {
            delta,
            guide: {
              orientation: 'h',
              position: sy,
              from: Math.min(s.x, moving.x),
              to: Math.max(s.x + s.width, moving.x + moving.width),
            },
          };
        }
      }
    }
  }

  const guides: SmartGuide[] = [];
  if (bestX) guides.push(bestX.guide);
  if (bestY) guides.push(bestY.guide);
  return { dx: bestX?.delta ?? 0, dy: bestY?.delta ?? 0, guides };
}
