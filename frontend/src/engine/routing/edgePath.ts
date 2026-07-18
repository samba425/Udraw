/**
 * Edge path computation for the four router types. Resolves endpoints from
 * shapes/anchors/points and produces an SVG path plus the endpoint tangents
 * used to orient arrowheads.
 * @module engine/routing/edgePath
 */
import type { Edge, Page, Point } from '@/types';
import { anchorPoint, nearestAnchor, shapeCenter } from './anchors';

/** Result of routing an edge: its path and endpoint geometry. */
export interface RoutedEdge {
  path: string;
  start: Point;
  end: Point;
  /** Angle (radians) of the path arriving at the end point. */
  endAngle: number;
  /** Angle (radians) of the path leaving the start point. */
  startAngle: number;
  /** Midpoint used to position labels. */
  mid: Point;
}

/** Resolve an endpoint's world-space coordinate. */
function resolveEndpoint(
  page: Page,
  endpoint: Edge['source'],
  toward: Point | null,
): Point {
  if (endpoint.shapeId) {
    const shape = page.shapes[endpoint.shapeId];
    if (shape) {
      if (endpoint.anchor) return anchorPoint(shape, endpoint.anchor);
      return toward ? nearestAnchor(shape, toward).point : shapeCenter(shape);
    }
  }
  return endpoint.point ?? { x: 0, y: 0 };
}

/** Compute the routed geometry for an edge within a page. */
export function routeEdge(edge: Edge, page: Page): RoutedEdge {
  // First pass: rough targets to choose nearest anchors.
  const targetHint = edge.target.point ?? centerHint(page, edge.target.shapeId);
  const sourceHint = edge.source.point ?? centerHint(page, edge.source.shapeId);
  const start = resolveEndpoint(page, edge.source, targetHint);
  const end = resolveEndpoint(page, edge.target, sourceHint);

  const points: Point[] = [start, ...edge.waypoints, end];

  let path: string;
  switch (edge.router) {
    case 'straight':
      path = polyline(points);
      break;
    case 'orthogonal':
      path = orthogonal(points);
      break;
    case 'curved':
      path = smooth(points);
      break;
    case 'bezier':
      path = bezier(start, end);
      break;
    default:
      path = polyline(points);
  }

  const last = points[points.length - 2] ?? start;
  const first = points[1] ?? end;
  return {
    path,
    start,
    end,
    mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    endAngle: Math.atan2(end.y - last.y, end.x - last.x),
    startAngle: Math.atan2(start.y - first.y, start.x - first.x),
  };
}

function centerHint(page: Page, shapeId?: string): Point | null {
  if (!shapeId) return null;
  const shape = page.shapes[shapeId];
  return shape ? shapeCenter(shape) : null;
}

function polyline(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/** Simple orthogonal (Manhattan) routing between successive points. */
function orthogonal(points: Point[]): string {
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const midX = (prev.x + curr.x) / 2;
    d += ` L ${midX} ${prev.y} L ${midX} ${curr.y} L ${curr.x} ${curr.y}`;
  }
  return d;
}

/** Catmull-Rom-ish smoothing through the points. */
function smooth(points: Point[]): string {
  if (points.length < 3) return polyline(points);
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const cx = (p0.x + p1.x) / 2;
    d += ` Q ${p0.x} ${p0.y} ${cx} ${(p0.y + p1.y) / 2}`;
    d += ` T ${p1.x} ${p1.y}`;
  }
  return d;
}

/** Cubic bezier with horizontal control handles. */
function bezier(start: Point, end: Point): string {
  const dx = Math.abs(end.x - start.x) * 0.5 + 20;
  return `M ${start.x} ${start.y} C ${start.x + dx} ${start.y} ${end.x - dx} ${end.y} ${end.x} ${end.y}`;
}
