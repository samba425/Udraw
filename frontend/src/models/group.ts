/**
 * Helpers for shape grouping: resolving the top-most ancestor group of a
 * shape and collecting a group's descendants.
 * @module models/group
 */
import type { Page, Shape } from '@/types';

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

/**
 * Build a map of `{ id -> {x,y} }` origins for a move, expanding any selected
 * group to include all of its descendants so the whole group moves together.
 */
export function collectMovable(page: Page, ids: string[]): Record<string, { x: number; y: number }> {
  const origins: Record<string, { x: number; y: number }> = {};
  const add = (shape: Shape): void => {
    if (!shape.locked) origins[shape.id] = { x: shape.x, y: shape.y };
  };
  for (const id of ids) {
    const shape = page.shapes[id];
    if (!shape) continue;
    add(shape);
    for (const childId of descendants(page, id)) {
      const child = page.shapes[childId];
      if (child) add(child);
    }
  }
  return origins;
}
