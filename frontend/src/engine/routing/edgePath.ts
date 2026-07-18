/**
 * Edge path computation for the four router types. Resolves endpoints from
 * shapes/anchors/points and produces an SVG path plus the endpoint tangents
 * used to orient arrowheads.
 * @module engine/routing/edgePath
 */
import type { Edge, Page, Point } from '@/types';
import {
  anchorNormal,
  anchorPoint,
  nearestAnchor,
  pairAnchors,
  shapeCenter,
  sideToward,
} from './anchors';

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

interface ResolvedEndpoint {
  point: Point;
  anchor?: string;
}

/** Resolve an endpoint's world-space coordinate and anchor side. */
function resolveEndpoint(
  page: Page,
  endpoint: Edge['source'],
  role: 'source' | 'target',
  other: Edge['target'],
): ResolvedEndpoint {
  if (endpoint.shapeId) {
    const shape = page.shapes[endpoint.shapeId];
    if (shape) {
      if (endpoint.anchor) {
        return { point: anchorPoint(shape, endpoint.anchor), anchor: endpoint.anchor };
      }
      const otherShape = other.shapeId ? page.shapes[other.shapeId] : undefined;
      if (otherShape) {
        const pair = pairAnchors(
          role === 'source' ? shape : otherShape,
          role === 'source' ? otherShape : shape,
        );
        const anchor = role === 'source' ? pair.source : pair.target;
        return { point: anchorPoint(shape, anchor), anchor };
      }
      if (other.point) {
        const picked = nearestAnchor(shape, other.point);
        return { point: picked.point, anchor: picked.name };
      }
      return { point: shapeCenter(shape), anchor: 'center' };
    }
  }
  return { point: endpoint.point ?? { x: 0, y: 0 } };
}

/** Compute the routed geometry for an edge within a page. */
export function routeEdge(edge: Edge, page: Page): RoutedEdge {
  const source = resolveEndpoint(page, edge.source, 'source', edge.target);
  const target = resolveEndpoint(page, edge.target, 'target', edge.source);
  const start = source.point;
  const end = target.point;

  let pathPoints: Point[];
  switch (edge.router) {
    case 'straight':
      pathPoints = [start, ...edge.waypoints, end];
      break;
    case 'orthogonal':
      pathPoints = orthogonalPoints(start, source.anchor, end, target.anchor, edge.waypoints);
      break;
    case 'curved':
      pathPoints = [start, ...edge.waypoints, end];
      break;
    case 'bezier':
      pathPoints = [start, end];
      break;
    default:
      pathPoints = [start, ...edge.waypoints, end];
  }

  let path: string;
  switch (edge.router) {
    case 'straight':
      path = polyline(pathPoints);
      break;
    case 'orthogonal':
      path = polyline(pathPoints);
      break;
    case 'curved':
      path = smooth(pathPoints);
      break;
    case 'bezier':
      path = bezier(start, end);
      break;
    default:
      path = polyline(pathPoints);
  }

  const pathForAngles = pathPoints.length >= 2 ? pathPoints : [start, end];
  const endPrev = pathForAngles[pathForAngles.length - 2] ?? start;
  const startNext = pathForAngles[1] ?? end;

  return {
    path,
    start,
    end,
    mid: pathMidpoint(pathForAngles),
    endAngle: Math.atan2(end.y - endPrev.y, end.x - endPrev.x),
    startAngle: Math.atan2(startNext.y - start.y, startNext.x - start.x),
  };
}

const ROUTING_GAP = 14;

/** Build anchor-aware orthogonal points with exit/entry stubs. */
function orthogonalPoints(
  start: Point,
  startAnchor: string | undefined,
  end: Point,
  endAnchor: string | undefined,
  waypoints: Point[],
): Point[] {
  if (waypoints.length > 0) {
    return [start, ...waypoints, end];
  }

  const startSide = startAnchor ?? sideToward(start, end);
  const endSide = endAnchor ?? sideToward(end, start);
  const startOut = extendPoint(start, anchorNormal(startSide), ROUTING_GAP);
  const endOut = extendPoint(end, anchorNormal(endSide), ROUTING_GAP);
  const middle = routeOrthogonalBetween(startOut, endOut, startSide, endSide);
  return dedupePoints([start, startOut, ...middle, endOut, end]);
}

function extendPoint(point: Point, normal: Point, distance: number): Point {
  return { x: point.x + normal.x * distance, y: point.y + normal.y * distance };
}

function routeOrthogonalBetween(
  from: Point,
  to: Point,
  fromSide: string,
  toSide: string,
): Point[] {
  const fromVertical = fromSide === 'top' || fromSide === 'bottom';
  const toVertical = toSide === 'top' || toSide === 'bottom';

  if (fromVertical && toVertical) {
    const midY = (from.y + to.y) / 2;
    return [{ x: from.x, y: midY }, { x: to.x, y: midY }, to];
  }

  if (!fromVertical && !toVertical) {
    const midX = (from.x + to.x) / 2;
    return [{ x: midX, y: from.y }, { x: midX, y: to.y }, to];
  }

  if (fromVertical) {
    return [{ x: from.x, y: to.y }, to];
  }

  return [{ x: to.x, y: from.y }, to];
}

function dedupePoints(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const point of points) {
    const prev = out[out.length - 1];
    if (prev && Math.abs(prev.x - point.x) < 0.01 && Math.abs(prev.y - point.y) < 0.01) continue;
    out.push(point);
  }
  return out;
}

function pathMidpoint(points: Point[]): Point {
  if (points.length < 2) {
    const only = points[0] ?? { x: 0, y: 0 };
    return only;
  }
  let length = 0;
  const segments: Array<{ a: Point; b: Point; len: number }> = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, len });
    length += len;
  }
  const half = length / 2;
  let walked = 0;
  for (const segment of segments) {
    if (walked + segment.len >= half) {
      const t = segment.len === 0 ? 0 : (half - walked) / segment.len;
      return {
        x: segment.a.x + (segment.b.x - segment.a.x) * t,
        y: segment.a.y + (segment.b.y - segment.a.y) * t,
      };
    }
    walked += segment.len;
  }
  return points[Math.floor(points.length / 2)]!;
}

function polyline(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
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
