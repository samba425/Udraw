/**
 * Connection-point (anchor) resolution for edges. Anchors are expressed as
 * either named cardinal points or normalized `fx:fy` fractions.
 * @module engine/routing/anchors
 */
import type { Point, Shape } from '@/types';
import { rectCenter } from '@/utils/geometry';

/** Named cardinal anchors mapped to normalized fractions. */
const NAMED_ANCHORS: Record<string, Point> = {
  top: { x: 0.5, y: 0 },
  right: { x: 1, y: 0.5 },
  bottom: { x: 0.5, y: 1 },
  left: { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  'top-left': { x: 0, y: 0 },
  'top-right': { x: 1, y: 0 },
  'bottom-left': { x: 0, y: 1 },
  'bottom-right': { x: 1, y: 1 },
};

/** The four default connection points offered when hovering a shape. */
export const DEFAULT_ANCHOR_NAMES = ['top', 'right', 'bottom', 'left'] as const;

/** Resolve a normalized anchor fraction from an anchor descriptor. */
export function anchorFraction(anchor: string | undefined): Point {
  if (!anchor) return { x: 0.5, y: 0.5 };
  if (anchor in NAMED_ANCHORS) return NAMED_ANCHORS[anchor]!;
  const [fx, fy] = anchor.split(':').map(Number);
  if (Number.isFinite(fx) && Number.isFinite(fy)) return { x: fx!, y: fy! };
  return { x: 0.5, y: 0.5 };
}

/** World-space position of an anchor on a shape. */
export function anchorPoint(shape: Shape, anchor: string | undefined): Point {
  const f = anchorFraction(anchor);
  return { x: shape.x + shape.width * f.x, y: shape.y + shape.height * f.y };
}

/** World-space center of a shape. */
export function shapeCenter(shape: Shape): Point {
  return rectCenter({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
}

/**
 * Pick the anchor on a shape closest to a target point. Used to auto-attach
 * edges to the nearest connection side.
 */
export function nearestAnchor(shape: Shape, target: Point): { name: string; point: Point } {
  let best = { name: 'center', point: shapeCenter(shape) };
  let bestDist = Infinity;
  for (const name of DEFAULT_ANCHOR_NAMES) {
    const point = anchorPoint(shape, name);
    const dist = (point.x - target.x) ** 2 + (point.y - target.y) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = { name, point };
    }
  }
  return best;
}
