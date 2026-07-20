/**
 * Group membership, cloning, and transform helpers for shapes + connectors.
 * @module models/groupBundle
 */
import type { Edge, EdgeEndpoint, Page, Point, Rect, Shape } from '@/types';
import { createId } from '@/models/factory';
import { descendants, isGroupShape } from './group';

/** Shapes and edges collected from a selection (includes group descendants). */
export interface SelectionBundle {
  shapes: Shape[];
  edges: Edge[];
}

/** Edges whose endpoints both belong to `shapeIds`. */
export function internalEdgesForShapes(page: Page, shapeIds: Set<string>): Edge[] {
  return Object.values(page.edges).filter((edge) => {
    const from = edge.source.shapeId;
    const to = edge.target.shapeId;
    return Boolean(from && to && shapeIds.has(from) && shapeIds.has(to));
  });
}

/** Edges tagged as belonging to a group container. */
export function edgesForGroup(page: Page, groupId: string): Edge[] {
  return Object.values(page.edges).filter((e) => e.groupId === groupId);
}

/** All shape ids inside a group (descendants only, not the container). */
export function memberShapeIds(page: Page, groupId: string): string[] {
  return descendants(page, groupId);
}

/** Expand selected ids into a copy/paste bundle. */
export function bundleFromSelection(page: Page, selectedIds: string[]): SelectionBundle {
  const shapeMap = new Map<string, Shape>();
  const edgeMap = new Map<string, Edge>();

  for (const id of selectedIds) {
    const shape = page.shapes[id];
    if (shape) {
      if (isGroupShape(shape)) {
        shapeMap.set(shape.id, shape);
        for (const childId of memberShapeIds(page, shape.id)) {
          const child = page.shapes[childId];
          if (child) shapeMap.set(child.id, child);
        }
        for (const edge of edgesForGroup(page, shape.id)) {
          edgeMap.set(edge.id, edge);
        }
      } else {
        shapeMap.set(shape.id, shape);
      }
    }
    const edge = page.edges[id];
    if (edge) edgeMap.set(edge.id, edge);
  }

  if (shapeMap.size >= 2) {
    for (const edge of internalEdgesForShapes(page, new Set(shapeMap.keys()))) {
      edgeMap.set(edge.id, edge);
    }
  }

  return { shapes: [...shapeMap.values()], edges: [...edgeMap.values()] };
}

function remapEndpoint(
  endpoint: EdgeEndpoint,
  idMap: Map<string, string>,
  offset: Point,
): EdgeEndpoint {
  return {
    ...endpoint,
    shapeId: endpoint.shapeId ? idMap.get(endpoint.shapeId) : undefined,
    point: endpoint.point
      ? { x: endpoint.point.x + offset.x, y: endpoint.point.y + offset.y }
      : undefined,
  };
}

/** Deep-clone a bundle with new ids and optional positional offset. */
export function cloneBundle(
  bundle: SelectionBundle,
  offset: Point = { x: 0, y: 0 },
): { shapes: Shape[]; edges: Edge[]; selectIds: string[] } {
  const idMap = new Map<string, string>();
  for (const shape of bundle.shapes) idMap.set(shape.id, createId('shape'));
  for (const edge of bundle.edges) idMap.set(edge.id, createId('edge'));

  const oldShapeIds = new Set(bundle.shapes.map((s) => s.id));

  const shapes = bundle.shapes.map((shape) => ({
    ...structuredClone(shape),
    id: idMap.get(shape.id)!,
    x: shape.x + offset.x,
    y: shape.y + offset.y,
    parentId: shape.parentId && oldShapeIds.has(shape.parentId) ? idMap.get(shape.parentId) : undefined,
  }));

  const edges = bundle.edges.map((edge) => ({
    ...structuredClone(edge),
    id: idMap.get(edge.id)!,
    groupId: edge.groupId && oldShapeIds.has(edge.groupId) ? idMap.get(edge.groupId) : undefined,
    source: remapEndpoint(edge.source, idMap, offset),
    target: remapEndpoint(edge.target, idMap, offset),
    waypoints: edge.waypoints.map((wp) => ({ x: wp.x + offset.x, y: wp.y + offset.y })),
  }));

  const selectIds: string[] = [];
  for (const shape of shapes) {
    const old = bundle.shapes.find((o) => idMap.get(o.id) === shape.id);
    if (!old) continue;
    if (!old.parentId || !oldShapeIds.has(old.parentId)) selectIds.push(shape.id);
  }

  return { shapes, edges, selectIds };
}

/** Shape + edge ids affected by lock/hide/reorder on a group. */
export function expandCascadeIds(
  page: Page,
  ids: string[],
): { shapeIds: string[]; edgeIds: string[] } {
  const shapeIds = new Set<string>();
  const edgeIds = new Set<string>();

  for (const id of ids) {
    const shape = page.shapes[id];
    if (shape) {
      shapeIds.add(id);
      if (isGroupShape(shape)) {
        for (const childId of memberShapeIds(page, id)) shapeIds.add(childId);
        for (const edge of edgesForGroup(page, id)) edgeIds.add(edge.id);
      }
    }
    if (page.edges[id]) edgeIds.add(id);
  }

  return { shapeIds: [...shapeIds], edgeIds: [...edgeIds] };
}

/** Scale child shapes when the group bounding box is resized. */
export function scaleGroupChildren(
  snapshots: Record<string, { x: number; y: number; width: number; height: number }>,
  from: Rect,
  to: Rect,
): Record<string, Partial<Shape>> {
  const sx = from.width > 0 ? to.width / from.width : 1;
  const sy = from.height > 0 ? to.height / from.height : 1;
  const patches: Record<string, Partial<Shape>> = {};
  for (const [id, snap] of Object.entries(snapshots)) {
    patches[id] = {
      x: to.x + (snap.x - from.x) * sx,
      y: to.y + (snap.y - from.y) * sy,
      width: Math.max(snap.width * sx, 8),
      height: Math.max(snap.height * sy, 8),
    };
  }
  return patches;
}

/** Rotate child shapes around a world-space center. */
export function rotateGroupChildren(
  snapshots: Record<string, { x: number; y: number; width: number; height: number; rotation: number }>,
  center: Point,
  deltaDeg: number,
): Record<string, Partial<Shape>> {
  const rad = (deltaDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const patches: Record<string, Partial<Shape>> = {};

  for (const [id, snap] of Object.entries(snapshots)) {
    const cx = snap.x + snap.width / 2;
    const cy = snap.y + snap.height / 2;
    const dx = cx - center.x;
    const dy = cy - center.y;
    const nx = center.x + dx * cos - dy * sin;
    const ny = center.y + dx * sin + dy * cos;
    patches[id] = {
      x: nx - snap.width / 2,
      y: ny - snap.height / 2,
      rotation: Math.round(snap.rotation + deltaDeg),
    };
  }
  return patches;
}

/** Snapshot direct members of a group for resize/rotate. */
export function groupChildSnapshots(
  page: Page,
  groupId: string,
): Record<string, { x: number; y: number; width: number; height: number; rotation: number }> {
  const out: Record<string, { x: number; y: number; width: number; height: number; rotation: number }> = {};
  for (const id of memberShapeIds(page, groupId)) {
    const shape = page.shapes[id];
    if (!shape) continue;
    out[id] = {
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      rotation: shape.rotation,
    };
  }
  return out;
}

/** Move a block of related ids together in draw order. */
export function reorderBlock(
  order: string[],
  blockIds: Set<string>,
  direction: 'front' | 'back' | 'forward' | 'backward',
): string[] {
  const block = order.filter((id) => blockIds.has(id));
  if (block.length === 0) return order;
  const rest = order.filter((id) => !blockIds.has(id));
  const firstIdx = order.findIndex((id) => blockIds.has(id));

  if (direction === 'front') return [...rest, ...block];
  if (direction === 'back') return [...block, ...rest];
  if (direction === 'forward') {
    const after = order.slice(firstIdx + block.length);
    const anchor = after.find((id) => !blockIds.has(id));
    if (!anchor) return [...rest, ...block];
    const idx = rest.indexOf(anchor);
    return [...rest.slice(0, idx + 1), ...block, ...rest.slice(idx + 1)];
  }
  // backward
  const before = order.slice(0, firstIdx).reverse();
  const anchor = before.find((id) => !blockIds.has(id));
  if (!anchor) return [...block, ...rest];
  const idx = rest.indexOf(anchor);
  return [...rest.slice(0, idx), ...block, ...rest.slice(idx)];
}
