/**
 * Waypoint helpers: insert a point on the routed path nearest to a click.
 * @module engine/routing/waypoints
 */
import type { Edge, Page, Point } from '@/types';
import { routeEdge } from './edgePath';

/** Parse an SVG polyline path `M x y L x y ...` into points. */
export function pathToPoints(path: string): Point[] {
  const tokens = path.trim().split(/\s+/);
  const points: Point[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] === 'M' || tokens[i] === 'L') {
      const x = Number(tokens[i + 1]);
      const y = Number(tokens[i + 2]);
      if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
      i += 2;
    }
  }
  return points;
}

function distToSegment(p: Point, a: Point, b: Point): { dist: number; t: number; point: Point } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    const dist = Math.hypot(p.x - a.x, p.y - a.y);
    return { dist, t: 0, point: { ...a } };
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = { x: a.x + t * dx, y: a.y + t * dy };
  return { dist: Math.hypot(p.x - point.x, p.y - point.y), t, point };
}

/**
 * Insert a waypoint on the edge path closest to `click` (excluding endpoints).
 * Returns updated waypoints array.
 */
export function insertWaypointAtClick(edge: Edge, page: Page, click: Point): Point[] {
  const routed = routeEdge(edge, page);
  const poly = pathToPoints(routed.path);
  if (poly.length < 2) return [...edge.waypoints, click];

  let bestSeg = 0;
  let best = distToSegment(click, poly[0]!, poly[1]!);
  for (let i = 1; i < poly.length - 1; i++) {
    const d = distToSegment(click, poly[i]!, poly[i + 1]!);
    if (d.dist < best.dist) {
      best = d;
      bestSeg = i;
    }
  }

  const waypoint = best.point;
  const existing = [...edge.waypoints];
  if (existing.length === 0) {
    return [waypoint];
  }
  const insertAt = Math.min(existing.length, Math.max(0, Math.round((bestSeg / (poly.length - 1)) * existing.length)));
  existing.splice(insertAt, 0, waypoint);
  return existing;
}
