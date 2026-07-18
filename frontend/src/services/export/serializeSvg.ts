/**
 * Serializes a page into a standalone, self-contained SVG string. The output
 * mirrors the live renderer (`ShapeView`/`EdgeView`) but uses `<text>` instead
 * of `foreignObject` so it rasterizes reliably and opens in any SVG viewer.
 * @module services/export/serializeSvg
 */
import type { Edge, Page, Project, Rect, Shape } from '@/types';
import { freehandPath, geometryForShape } from '@/engine/renderer/shapePath';
import { dashArray } from '@/engine/renderer/style';
import { routeEdge } from '@/engine/routing/edgePath';
import { getLibraryIcon } from '@/shapes/registry';
import { isShapeVisible, layerMap } from '@/models/layers';

/** Options controlling SVG serialization. */
export interface SerializeOptions {
  /** Padding (world units) around the content bounds. */
  padding?: number;
  /** Optional background color; omit for transparent. */
  background?: string;
}

/** A serialized SVG plus its pixel dimensions. */
export interface SerializedSvg {
  svg: string;
  width: number;
  height: number;
}

/** Escape a string for safe inclusion in XML text/attribute content. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Compute the axis-aligned content bounds of a page's visible elements. */
export function contentBounds(page: Page): Rect | null {
  const layers = layerMap(page);
  const rects: Rect[] = [];
  for (const shape of Object.values(page.shapes)) {
    if (isShapeVisible(layers, shape)) {
      rects.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
    }
  }
  for (const edge of Object.values(page.edges)) {
    if (edge.hidden) continue;
    const routed = routeEdge(edge, page);
    rects.push({ x: routed.start.x, y: routed.start.y, width: 0, height: 0 });
    rects.push({ x: routed.end.x, y: routed.end.y, width: 0, height: 0 });
  }
  if (rects.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Serialize a page to an SVG string. */
export function serializePageToSvg(
  project: Project,
  page: Page,
  options: SerializeOptions = {},
): SerializedSvg {
  const padding = options.padding ?? 24;
  const bounds = contentBounds(page) ?? { x: 0, y: 0, width: 100, height: 100 };
  const width = Math.ceil(bounds.width + padding * 2);
  const height = Math.ceil(bounds.height + padding * 2);
  const minX = bounds.x - padding;
  const minY = bounds.y - padding;
  const layers = layerMap(page);

  const body: string[] = [];
  if (options.background) {
    body.push(
      `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${escapeXml(options.background)}"/>`,
    );
  }

  for (const id of page.order) {
    const edge = page.edges[id];
    if (edge) {
      if (!edge.hidden) body.push(edgeMarkup(edge, page));
      continue;
    }
    const shape = page.shapes[id];
    if (shape && isShapeVisible(layers, shape)) body.push(shapeMarkup(shape));
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="${minX} ${minY} ${width} ${height}">` +
    `<title>${escapeXml(project.name)} — ${escapeXml(page.name)}</title>` +
    body.join('') +
    `</svg>`;

  return { svg, width, height };
}

/** Build the SVG markup for a single shape. */
function shapeMarkup(shape: Shape): string {
  const transform = `translate(${shape.x} ${shape.y}) rotate(${shape.rotation} ${shape.width / 2} ${shape.height / 2})`;
  const inner = shapeInner(shape);
  const label = shape.text ? labelMarkup(shape) : '';
  return `<g transform="${transform}" opacity="${shape.opacity}">${inner}${label}</g>`;
}

/** Build the primitive markup (geometry/icon/image) for a shape. */
function shapeInner(shape: Shape): string {
  if (shape.kind === 'group') return '';
  if (shape.kind === 'image' && shape.src) {
    return `<image href="${escapeXml(shape.src)}" width="${shape.width}" height="${shape.height}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  if (shape.kind === 'icon' && shape.libraryId) {
    const icon = getLibraryIcon(shape.libraryId);
    if (icon) {
      const scale = `scale(${shape.width / icon.viewSize} ${shape.height / icon.viewSize})`;
      return `<g transform="${scale}">${icon.body}</g>`;
    }
  }
  if (shape.kind === 'freehand' && shape.points) {
    return (
      `<path d="${freehandPath(shape.points, shape.width, shape.height)}" fill="none" ` +
      `stroke="${escapeXml(shape.stroke)}" stroke-width="${shape.strokeWidth}" ` +
      `stroke-linecap="round" stroke-linejoin="round"/>`
    );
  }

  const fill = shape.fill.type === 'none' ? 'none' : shape.fill.color;
  const dash = dashArray(shape.dash, shape.strokeWidth);
  const attrs =
    `fill="${escapeXml(fill)}" stroke="${escapeXml(shape.stroke)}" stroke-width="${shape.strokeWidth}"` +
    (dash ? ` stroke-dasharray="${dash}"` : '');

  const geom = geometryForShape(shape);
  if (geom.type === 'rect') {
    return `<rect width="${shape.width}" height="${shape.height}" rx="${geom.rx}" ry="${geom.rx}" ${attrs}/>`;
  }
  if (geom.type === 'ellipse') {
    return `<ellipse cx="${shape.width / 2}" cy="${shape.height / 2}" rx="${shape.width / 2}" ry="${shape.height / 2}" ${attrs}/>`;
  }
  return `<path d="${geom.d}" ${attrs}/>`;
}

/** Build multi-line centered text markup for a shape label. */
function labelMarkup(shape: Shape): string {
  const t = shape.typography;
  const lines = shape.text.split('\n');
  const lineHeight = t.fontSize * t.lineHeight;
  const anchor = t.align === 'left' ? 'start' : t.align === 'right' ? 'end' : 'middle';
  const x = t.align === 'left' ? 6 : t.align === 'right' ? shape.width - 6 : shape.width / 2;

  const blockHeight = lines.length * lineHeight;
  let top: number;
  if (t.verticalAlign === 'top') top = t.fontSize;
  else if (t.verticalAlign === 'bottom') top = shape.height - blockHeight + t.fontSize;
  else top = (shape.height - blockHeight) / 2 + t.fontSize;

  const tspans = lines
    .map((line, i) => `<tspan x="${x}" y="${top + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');

  return (
    `<text text-anchor="${anchor}" font-family="${escapeXml(t.fontFamily)}" ` +
    `font-size="${t.fontSize}" font-weight="${t.fontWeight}" font-style="${t.fontStyle}" ` +
    `text-decoration="${t.textDecoration}" fill="${escapeXml(t.color)}">${tspans}</text>`
  );
}

/** Build the SVG markup for a single edge, including arrow markers. */
function edgeMarkup(edge: Edge, page: Page): string {
  const routed = routeEdge(edge, page);
  const dash = edge.animated
    ? `${edge.strokeWidth * 4} ${edge.strokeWidth * 3}`
    : dashArray(edge.dash, edge.strokeWidth);
  const markers = arrowMarkers(edge);
  const markerEnd = edge.endArrow !== 'none' ? ` marker-end="url(#arrow_${edge.id}_end)"` : '';
  const markerStart = edge.startArrow !== 'none' ? ` marker-start="url(#arrow_${edge.id}_start)"` : '';

  const path =
    `<path d="${routed.path}" fill="none" stroke="${escapeXml(edge.stroke)}" ` +
    `stroke-width="${edge.strokeWidth}" stroke-linejoin="round" stroke-linecap="round"` +
    (dash ? ` stroke-dasharray="${dash}"` : '') +
    `${markerEnd}${markerStart}/>`;

  let label = '';
  if (edge.label) {
    const w = Math.max(edge.label.length * 7 + 12, 20);
    label =
      `<g transform="translate(${routed.mid.x} ${routed.mid.y})">` +
      `<rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="4" fill="#ffffff" opacity="0.9"/>` +
      `<text text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#1f2430">${escapeXml(edge.label)}</text>` +
      `</g>`;
  }

  return `<g opacity="${edge.opacity}"><defs>${markers}</defs>${path}${label}</g>`;
}

/** Build arrow marker defs for an edge. */
function arrowMarkers(edge: Edge): string {
  const defs: string[] = [];
  const shape = (style: string, color: string): string => {
    switch (style) {
      case 'triangle':
        return `<path d="M1,1 L11,6 L1,11 Z" fill="${color}"/>`;
      case 'arrow':
        return `<path d="M1,1 L11,6 L1,11" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
      case 'diamond':
        return `<path d="M1,6 L6,1 L11,6 L6,11 Z" fill="${color}"/>`;
      case 'circle':
        return `<circle cx="6" cy="6" r="4" fill="${color}"/>`;
      default:
        return '';
    }
  };
  const color = escapeXml(edge.stroke);
  if (edge.endArrow !== 'none') {
    defs.push(
      `<marker id="arrow_${edge.id}_end" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="userSpaceOnUse">${shape(edge.endArrow, color)}</marker>`,
    );
  }
  if (edge.startArrow !== 'none') {
    defs.push(
      `<marker id="arrow_${edge.id}_start" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto-start-reverse" markerUnits="userSpaceOnUse">${shape(edge.startArrow, color)}</marker>`,
    );
  }
  return defs.join('');
}
