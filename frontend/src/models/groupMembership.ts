/**
 * Assign shapes to groups on drop and keep connector membership in sync.
 * @module models/groupMembership
 */
import type { Page, Point, Shape } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import {
  computeGroupBounds,
  descendants,
  isGroupShape,
  syncGroupBoundsPatches,
} from './group';
import { pointInRect } from '@/utils/geometry';

/** True when `shapeId` is the group or a nested descendant. */
export function isDescendantOf(page: Page, shapeId: string, ancestorId: string): boolean {
  if (shapeId === ancestorId) return true;
  let current = page.shapes[shapeId];
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = page.shapes[current.parentId];
  }
  return false;
}

/** Which shape id should be selected/focused for a click. */
export function selectionTarget(page: Page, shapeId: string, activeGroupId: string | null): string {
  if (activeGroupId && isDescendantOf(page, shapeId, activeGroupId)) return shapeId;
  let current = page.shapes[shapeId];
  let result = shapeId;
  const guard = new Set<string>();
  while (current?.parentId && !guard.has(current.parentId)) {
    guard.add(current.parentId);
    result = current.parentId;
    current = page.shapes[current.parentId];
  }
  return result;
}

/** Top-most group container under a world point (for drop-into-group). */
export function findGroupContainerAt(
  page: Page,
  point: Point,
  excludeShapeId?: string,
): Shape | undefined {
  for (let i = page.order.length - 1; i >= 0; i--) {
    const id = page.order[i]!;
    const shape = page.shapes[id];
    if (!shape || !isGroupShape(shape) || shape.hidden) continue;
    if (excludeShapeId && (id === excludeShapeId || isDescendantOf(page, excludeShapeId, id))) continue;
    if (pointInRect(point, { x: shape.x, y: shape.y, width: shape.width, height: shape.height })) {
      return shape;
    }
  }
  return undefined;
}

/** Tag/clear edge.groupId for connectors fully inside a group. */
export function syncEdgeGroupMembership(page: Page, groupId: string): Record<string, { groupId?: string }> {
  const members = new Set(descendants(page, groupId));
  const patches: Record<string, { groupId?: string }> = {};
  for (const edge of Object.values(page.edges)) {
    const from = edge.source.shapeId;
    const to = edge.target.shapeId;
    const internal = Boolean(from && to && members.has(from) && members.has(to));
    if (internal && edge.groupId !== groupId) patches[edge.id] = { groupId };
    if (!internal && edge.groupId === groupId) patches[edge.id] = { groupId: undefined };
  }
  return patches;
}

/** After dragging shapes, attach/detach group membership from drop position. */
export function applyGroupDropMembership(movedShapeIds: string[]): void {
  const store = useProjectStore.getState();
  const page = store.activePage();
  const movedGroups = new Set(movedShapeIds.filter((id) => isGroupShape(page.shapes[id])));
  const shapePatches: Record<string, Partial<Shape>> = {};
  const groupsToSync = new Set<string>();

  for (const id of movedShapeIds) {
    const shape = page.shapes[id];
    if (!shape || isGroupShape(shape)) continue;
    if ([...movedGroups].some((gid) => isDescendantOf(page, id, gid))) continue;

    const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
    const container = findGroupContainerAt(page, center, id);
    const nextParent = container?.id;
    if (nextParent === shape.parentId) continue;

    shapePatches[id] = { parentId: nextParent };
    if (shape.parentId) groupsToSync.add(shape.parentId);
    if (nextParent) groupsToSync.add(nextParent);
  }

  if (Object.keys(shapePatches).length === 0) return;

  store.updateShapes(shapePatches);
  const edgePatches: Record<string, { groupId?: string }> = {};
  let nextPage = store.activePage();
  for (const groupId of groupsToSync) {
    Object.assign(edgePatches, syncEdgeGroupMembership(nextPage, groupId));
  }
  if (Object.keys(edgePatches).length > 0) {
    store.updateEdges(edgePatches);
    nextPage = store.activePage();
  }
  const boundsPatches = syncGroupBoundsPatches(nextPage, [...groupsToSync]);
  if (Object.keys(boundsPatches).length > 0) store.updateShapes(boundsPatches);
}

/** Assign a newly created shape to a group (library/canvas drop). */
export function adoptShapeIntoGroup(shapeId: string, groupId: string): void {
  const store = useProjectStore.getState();
  store.updateShape(shapeId, { parentId: groupId });
  let page = store.activePage();
  store.updateEdges(syncEdgeGroupMembership(page, groupId));
  page = store.activePage();
  const bounds = computeGroupBounds(page, groupId);
  if (bounds) {
    store.updateShape(groupId, { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
  }
}

/** Group shows a dashed border when metadata.showBorder is true. */
export function groupShowsBorder(shape: Shape): boolean {
  return shape.kind === 'group' && shape.metadata.showBorder === true;
}

export const GROUP_BORDER_STROKE = '#6366f1';
