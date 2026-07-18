/**
 * Converts a shape's geometry into an SVG element description. Keeping this
 * pure and framework-agnostic lets both the live renderer and the exporter
 * share identical geometry.
 * @module engine/renderer/shapePath
 */
import type { Shape, ShapeKind } from '@/types';

/** Describes how a shape kind should be rendered as an SVG primitive. */
export type ShapeGeometry =
  | { type: 'rect'; rx: number }
  | { type: 'ellipse' }
  | { type: 'path'; d: string };

/** Build an SVG path `d` string for a polygon from normalized points. */
function polygon(points: Array<[number, number]>, w: number, h: number): string {
  return (
    points
      .map(([nx, ny], i) => `${i === 0 ? 'M' : 'L'} ${nx * w} ${ny * h}`)
      .join(' ') + ' Z'
  );
}

/**
 * Return the geometry description for a shape, sized to its width/height.
 * Coordinates are local (origin at the shape's top-left).
 */
export function geometryForShape(shape: Shape): ShapeGeometry {
  const { width: w, height: h, kind, cornerRadius } = shape;
  return geometryForKind(kind, w, h, cornerRadius);
}

/** Compute geometry for a kind/size (used by both live and export renderers). */
export function geometryForKind(
  kind: ShapeKind,
  w: number,
  h: number,
  cornerRadius = 0,
): ShapeGeometry {
  switch (kind) {
    case 'rectangle':
    case 'text':
    case 'sticky-note':
    case 'image':
    case 'icon':
    case 'group':
    case 'swimlane-pool':
    case 'swimlane-lane':
      return { type: 'rect', rx: 0 };
    case 'rounded-rectangle':
      return { type: 'rect', rx: Math.min(cornerRadius || 12, w / 2, h / 2) };
    case 'ellipse':
    case 'circle':
      return { type: 'ellipse' };
    case 'diamond':
      return {
        type: 'path',
        d: polygon(
          [
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5],
          ],
          w,
          h,
        ),
      };
    case 'triangle':
      return {
        type: 'path',
        d: polygon(
          [
            [0.5, 0],
            [1, 1],
            [0, 1],
          ],
          w,
          h,
        ),
      };
    case 'hexagon':
      return {
        type: 'path',
        d: polygon(
          [
            [0.25, 0],
            [0.75, 0],
            [1, 0.5],
            [0.75, 1],
            [0.25, 1],
            [0, 0.5],
          ],
          w,
          h,
        ),
      };
    case 'parallelogram':
      return {
        type: 'path',
        d: polygon(
          [
            [0.25, 0],
            [1, 0],
            [0.75, 1],
            [0, 1],
          ],
          w,
          h,
        ),
      };
    case 'comment':
      return { type: 'path', d: commentPath(w, h) };
    case 'cloud':
      return { type: 'path', d: cloudPath(w, h) };
    case 'cylinder':
      return { type: 'path', d: cylinderPath(w, h) };
    case 'actor':
      return { type: 'path', d: actorPath(w, h) };
    default:
      return { type: 'rect', rx: 0 };
  }
}

/** A rounded speech-bubble with a tail in the lower-left corner. */
function commentPath(w: number, h: number): string {
  const r = Math.min(12, w / 4, h / 4);
  const bodyH = h * 0.8;
  return [
    `M ${r} 0`,
    `H ${w - r}`,
    `Q ${w} 0 ${w} ${r}`,
    `V ${bodyH - r}`,
    `Q ${w} ${bodyH} ${w - r} ${bodyH}`,
    `H ${w * 0.3}`,
    `L ${w * 0.16} ${h}`,
    `L ${w * 0.18} ${bodyH}`,
    `H ${r}`,
    `Q 0 ${bodyH} 0 ${bodyH - r}`,
    `V ${r}`,
    `Q 0 0 ${r} 0`,
    `Z`,
  ].join(' ');
}

/**
 * Build a freehand stroke path from normalized (0..1) points scaled to the
 * shape bounds. Used by `freehand` shapes only.
 */
export function freehandPath(
  points: Array<{ x: number; y: number }>,
  w: number,
  h: number,
): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * w} ${p.y * h}`)
    .join(' ');
}

function cloudPath(w: number, h: number): string {
  // A stylized cloud built from arcs, scaled to the bounding box.
  const s = (x: number, y: number): string => `${x * w} ${y * h}`;
  return [
    `M ${s(0.25, 0.75)}`,
    `A ${0.18 * w} ${0.22 * h} 0 0 1 ${s(0.2, 0.4)}`,
    `A ${0.2 * w} ${0.25 * h} 0 0 1 ${s(0.5, 0.28)}`,
    `A ${0.2 * w} ${0.25 * h} 0 0 1 ${s(0.82, 0.42)}`,
    `A ${0.16 * w} ${0.2 * h} 0 0 1 ${s(0.78, 0.78)}`,
    `Z`,
  ].join(' ');
}

function cylinderPath(w: number, h: number): string {
  const ry = h * 0.12;
  return [
    `M 0 ${ry}`,
    `A ${w / 2} ${ry} 0 0 1 ${w} ${ry}`,
    `L ${w} ${h - ry}`,
    `A ${w / 2} ${ry} 0 0 1 0 ${h - ry}`,
    `Z`,
    `M 0 ${ry}`,
    `A ${w / 2} ${ry} 0 0 0 ${w} ${ry}`,
  ].join(' ');
}

function actorPath(w: number, h: number): string {
  const cx = w / 2;
  const headR = Math.min(w, h) * 0.16;
  const headCy = headR;
  return [
    `M ${cx} ${headCy - headR}`,
    `a ${headR} ${headR} 0 1 0 0.01 0`,
    `Z`,
    `M ${cx} ${headCy + headR} L ${cx} ${h * 0.62}`,
    `M ${w * 0.15} ${h * 0.42} L ${w * 0.85} ${h * 0.42}`,
    `M ${cx} ${h * 0.62} L ${w * 0.2} ${h}`,
    `M ${cx} ${h * 0.62} L ${w * 0.8} ${h}`,
  ].join(' ');
}
