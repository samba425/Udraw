/**
 * Compute a step-through flow path for presentation mode (shapes + edges in order).
 * @module engine/presentation/flowPath
 */
import type { Page } from '@/types';

/** Ordered ids alternating source shapes and connecting edges along the main flow. */
export function computeFlowPath(page: Page): string[] {
  const edges = Object.values(page.edges).filter((e) => !e.hidden);
  if (edges.length === 0) {
    return page.order.filter((id) => page.shapes[id]);
  }

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const from = edge.source.shapeId;
    const to = edge.target.shapeId;
    if (!from || !to) continue;
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
    const list = outgoing.get(from) ?? [];
    list.push(edge.id);
    outgoing.set(from, list);
  }

  const roots = Object.keys(page.shapes).filter(
    (id) => !page.shapes[id]!.hidden && (incoming.get(id) ?? 0) === 0,
  );
  const startIds = roots.length > 0 ? roots : Object.keys(page.shapes).slice(0, 1);
  const path: string[] = [];
  const visitedEdges = new Set<string>();

  const walk = (shapeId: string): void => {
    if (path.includes(shapeId)) return;
    path.push(shapeId);
    const outs = outgoing.get(shapeId) ?? [];
    for (const edgeId of outs) {
      if (visitedEdges.has(edgeId)) continue;
      visitedEdges.add(edgeId);
      const edge = page.edges[edgeId];
      if (!edge) continue;
      path.push(edgeId);
      const next = edge.target.shapeId;
      if (next) walk(next);
    }
  };

  for (const root of startIds) walk(root);

  for (const edge of edges) {
    if (!visitedEdges.has(edge.id)) {
      path.push(edge.id);
      visitedEdges.add(edge.id);
    }
  }

  return path;
}

/** Ids that should be highlighted at the given flow step (inclusive). */
export function flowHighlightIds(path: string[], step: number): Set<string> {
  if (step < 0 || path.length === 0) return new Set();
  return new Set(path.slice(0, step + 1));
}
