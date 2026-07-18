/**
 * Hierarchical auto-layout for flowchart-style diagrams. Assigns shapes to
 * layers based on edge direction and spreads them on a grid. Works on the whole
 * page or a selected subset.
 * @module engine/layout/autoLayout
 */
import type { Page } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';

const CELL_W = 200;
const CELL_H = 140;
const GAP_X = 80;
const GAP_Y = 80;
const ORIGIN = { x: 80, y: 80 };

/** Assign topological levels to shape ids within a subgraph. */
function assignLevels(shapeIds: Set<string>, page: Page): Map<string, number> {
  const level = new Map<string, number>();
  for (const id of shapeIds) level.set(id, 0);

  const maxIter = shapeIds.size + 1;
  for (let i = 0; i < maxIter; i++) {
    let changed = false;
    for (const edge of Object.values(page.edges)) {
      const from = edge.source.shapeId;
      const to = edge.target.shapeId;
      if (!from || !to || !shapeIds.has(from) || !shapeIds.has(to)) continue;
      const fl = level.get(from) ?? 0;
      const tl = level.get(to) ?? 0;
      if (tl < fl + 1) {
        level.set(to, fl + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return level;
}

/**
 * Compute new positions for shapes. Returns a patch map of id → { x, y }.
 * Layout direction is top-to-bottom (TB).
 */
export function computeAutoLayout(
  page: Page,
  shapeIds?: string[],
): Record<string, { x: number; y: number }> {
  const ids =
    shapeIds && shapeIds.length > 0
      ? new Set(shapeIds.filter((id) => page.shapes[id]))
      : new Set(Object.keys(page.shapes));

  if (ids.size === 0) return {};

  const levels = assignLevels(ids, page);
  const byLevel = new Map<number, string[]>();
  for (const id of ids) {
    const lvl = levels.get(id) ?? 0;
    const bucket = byLevel.get(lvl) ?? [];
    bucket.push(id);
    byLevel.set(lvl, bucket);
  }

  const patches: Record<string, { x: number; y: number }> = {};
  for (const [lvl, bucket] of byLevel) {
    bucket.forEach((id, indexInLevel) => {
      const shape = page.shapes[id]!;
      const flow = lvl * (CELL_H + GAP_Y);
      const cross = indexInLevel * (CELL_W + GAP_X);
      patches[id] = {
        x: ORIGIN.x + cross + (CELL_W - shape.width) / 2,
        y: ORIGIN.y + flow + (CELL_H - shape.height) / 2,
      };
    });
  }
  return patches;
}

/** Apply auto-layout to the active page (or selection) as one undo step. */
export function applyAutoLayout(shapeIds?: string[]): void {
  const store = useProjectStore.getState();
  const page = store.activePage();
  const patches = computeAutoLayout(page, shapeIds);
  if (Object.keys(patches).length === 0) return;
  useHistoryStore.getState().run('Auto layout', () => store.updateShapes(patches));
}
