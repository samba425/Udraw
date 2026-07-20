/**
 * Helpers for shape grouping: resolving the top-most ancestor group of a
 * shape and collecting a group's descendants.
 * @module models/group
 */
import type { Page, Rect, Shape } from '@/types';
import { boundingBox } from '@/utils/geometry';

/** Return the top-most ancestor (the outermost group) of a shape id. */
export function topAncestor(page: Page, id: string): string {
  let current = page.shapes[id];
  let result = id;
  const guard = new Set<string>();
  while (current?.parentId && !guard.has(current.parentId)) {
    guard.add(current.parentId);
    result = current.parentId;
    current = page.shapes[current.parentId];
  }
  return result;
}

/** Return all descendant shape ids of a (group) shape. */
export function descendants(page: Page, id: string): string[] {
  const result: string[] = [];
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    for (const shape of Object.values(page.shapes)) {
      if (shape.parentId === current) {
        result.push(shape.id);
        stack.push(shape.id);
      }
    }
  }
  return result;
}

/** True when the shape is a group container. */
export function isGroupShape(shape: Shape | undefined): boolean {
  return shape?.kind === 'group';
}

/** Expand ids so moving a group also moves every descendant shape. */
export function expandMovableIds(page: Page, ids: string[]): string[] {
  const expanded = new Set<string>();
  for (const id of ids) {
    const shape = page.shapes[id];
    if (!shape) continue;
    expanded.add(id);
    for (const childId of descendants(page, id)) {
      if (page.shapes[childId]) expanded.add(childId);
    }
  }
  return [...expanded];
}

/** Union bounds of all descendants (used to resize the group container). */
export function computeGroupBounds(page: Page, groupId: string): Rect | null {
  const desc = descendants(page, groupId);
  const rects = desc
    .map((id) => page.shapes[id])
    .filter((s): s is Shape => Boolean(s))
    .map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }));
  return boundingBox(rects);
}

/** Group containers that should resize after their children move. */
export function groupsAffectedByMove(page: Page, movedIds: string[]): string[] {
  const groups = new Set<string>();
  for (const id of movedIds) {
    const shape = page.shapes[id];
    if (!shape) continue;
    if (isGroupShape(shape)) groups.add(id);
    let parentId = shape.parentId;
    while (parentId) {
      const parent = page.shapes[parentId];
      if (parent && isGroupShape(parent)) groups.add(parent.id);
      parentId = parent?.parentId;
    }
  }
  return [...groups];
}

/** Patches that sync group container bounds to fit their children. */
export function syncGroupBoundsPatches(page: Page, groupIds: string[]): Record<string, Partial<Shape>> {
  const patches: Record<string, Partial<Shape>> = {};
  for (const groupId of groupIds) {
    const bounds = computeGroupBounds(page, groupId);
    if (!bounds) continue;
    patches[groupId] = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }
  return patches;
}

/**
 * Build a map of `{ id -> {x,y} }` origins for a move, expanding any selected
 * group to include all of its descendants so the whole group moves together.
 */
export function collectMovable(page: Page, ids: string[]): Record<string, { x: number; y: number }> {
  const origins: Record<string, { x: number; y: number }> = {};
  const add = (shape: Shape): void => {
    if (!shape.locked) origins[shape.id] = { x: shape.x, y: shape.y };
  };
  for (const id of expandMovableIds(page, ids)) {
    const shape = page.shapes[id];
    if (shape) add(shape);
  }
  return origins;
}

/** Ids to delete when removing groups (includes all descendants + group edges). */
export function expandDeleteIds(page: Page, ids: string[]): string[] {
  const expanded = new Set<string>(ids);
  for (const id of ids) {
    if (isGroupShape(page.shapes[id])) {
      for (const childId of descendants(page, id)) expanded.add(childId);
      for (const edge of Object.values(page.edges)) {
        if (edge.groupId === id) expanded.add(edge.id);
      }
    }
  }
  return [...expanded];
}
