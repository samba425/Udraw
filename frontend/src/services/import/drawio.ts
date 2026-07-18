/**
 * Hardened importer for draw.io / diagrams.net `.drawio`/`.xml` files. Parses
 * the (uncompressed) mxGraphModel and converts mxCells into DiagramForge shapes
 * and edges.
 *
 * Security: DTD/entity declarations are rejected before parsing (XXE
 * hardening), and parsing uses the browser `DOMParser`, which performs no
 * network access and does not resolve external entities.
 * @module services/import/drawio
 */
import type { Edge, Shape, ShapeKind } from '@/types';
import { createEdge, createShape } from '@/models/factory';

/** Shapes + edges produced from a draw.io document. */
export interface DrawioResult {
  shapes: Shape[];
  edges: Edge[];
}

/** Parse a draw.io style string (`key=value;flag;`) into a map. */
function parseStyle(style: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of style.split(';')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq === -1) out[part.trim()] = 'true';
    else out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}

/** Map a draw.io style map to a DiagramForge shape kind. */
function kindFromStyle(style: Record<string, string>): ShapeKind {
  if ('ellipse' in style) return 'ellipse';
  if ('rhombus' in style) return 'diamond';
  if ('triangle' in style) return 'triangle';
  if ('hexagon' in style) return 'hexagon';
  if ('cylinder' in style || 'cylinder3' in style) return 'cylinder';
  if ('cloud' in style) return 'cloud';
  if ('parallelogram' in style) return 'parallelogram';
  if (style.shape === 'actor' || style.shape === 'umlActor') return 'actor';
  if (style.text === 'true' || style.shape === 'text') return 'text';
  if (style.rounded === '1') return 'rounded-rectangle';
  return 'rectangle';
}

/** Strip draw.io HTML labels down to plain text. */
function decodeLabel(value: string): string {
  if (!value) return '';
  const withBreaks = value.replace(/<br\s*\/?>/gi, '\n');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (doc.body.textContent ?? '').trim();
}

/**
 * Convert draw.io XML text into shapes and edges assigned to `layerId`.
 * Throws on unsafe or unsupported (compressed) documents.
 */
export function parseDrawio(xml: string, layerId: string): DrawioResult {
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) {
    throw new Error('Document contains a DOCTYPE/entity declaration and was rejected.');
  }

  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('File is not valid XML.');

  const model = doc.querySelector('mxGraphModel');
  if (!model) {
    // A <diagram> node with text content is a compressed payload we can't inflate.
    if (doc.querySelector('diagram')) {
      throw new Error('Compressed draw.io files are unsupported — re-export with "Uncompressed".');
    }
    throw new Error('No mxGraphModel found in document.');
  }

  const cells = Array.from(model.querySelectorAll('mxCell'));
  const idMap = new Map<string, string>();
  const shapes: Shape[] = [];

  let colorIndex = 0;
  for (const cell of cells) {
    if (cell.getAttribute('vertex') !== '1') continue;
    const geom = cell.querySelector('mxGeometry');
    if (!geom) continue;
    const style = parseStyle(cell.getAttribute('style') ?? '');
    const oldId = cell.getAttribute('id') ?? '';
    const x = parseFloat(geom.getAttribute('x') ?? '0') || 0;
    const y = parseFloat(geom.getAttribute('y') ?? '0') || 0;
    const width = parseFloat(geom.getAttribute('width') ?? '120') || 120;
    const height = parseFloat(geom.getAttribute('height') ?? '60') || 60;

    const shape = createShape(
      {
        kind: kindFromStyle(style),
        x,
        y,
        width,
        height,
        text: decodeLabel(cell.getAttribute('value') ?? ''),
        ...(style.fillColor && style.fillColor !== 'none'
          ? { fill: { type: 'solid' as const, color: style.fillColor } }
          : style.fillColor === 'none'
            ? { fill: { type: 'none' as const, color: 'none' } }
            : {}),
        ...(style.strokeColor && style.strokeColor !== 'none' ? { stroke: style.strokeColor } : {}),
        ...(style.dashed === '1' ? { dash: 'dashed' as const } : {}),
      },
      layerId,
      colorIndex++,
    );
    if (style.fontColor) shape.typography = { ...shape.typography, color: style.fontColor };
    idMap.set(oldId, shape.id);
    shapes.push(shape);
  }

  const edges: Edge[] = [];
  for (const cell of cells) {
    if (cell.getAttribute('edge') !== '1') continue;
    const style = parseStyle(cell.getAttribute('style') ?? '');
    const sourceOld = cell.getAttribute('source');
    const targetOld = cell.getAttribute('target');
    const sourceId = sourceOld ? idMap.get(sourceOld) : undefined;
    const targetId = targetOld ? idMap.get(targetOld) : undefined;

    const edge = createEdge(
      {
        source: sourceId ? { shapeId: sourceId } : { point: { x: 0, y: 0 } },
        target: targetId ? { shapeId: targetId } : { point: { x: 120, y: 120 } },
        router: style.edgeStyle === 'orthogonalEdgeStyle' ? 'orthogonal' : 'straight',
        label: decodeLabel(cell.getAttribute('value') ?? ''),
        ...(style.strokeColor ? { stroke: style.strokeColor } : {}),
        ...(style.dashed === '1' ? { dash: 'dashed' as const } : {}),
        ...(style.startArrow === 'none' ? { startArrow: 'none' as const } : {}),
        ...(style.endArrow === 'none' ? { endArrow: 'none' as const } : {}),
      },
      layerId,
    );
    edges.push(edge);
  }

  if (shapes.length === 0 && edges.length === 0) {
    throw new Error('No importable cells found in the draw.io document.');
  }

  return { shapes, edges };
}
