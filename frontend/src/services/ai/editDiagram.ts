/**
 * Natural-language diagram edits applied to the active page (offline heuristic).
 * @module services/ai/editDiagram
 */
import type { Edge, Page, Point, Shape } from '@/types';
import { createEdge, createShape } from '@/models/factory';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { useEditorStore } from '@/state/editorStore';
import { shapeCenter } from '@/engine/routing/anchors';

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Find a shape whose label best matches the query. */
function findShapeByLabel(page: Page, query: string): Shape | undefined {
  const q = normalize(query);
  const shapes = Object.values(page.shapes).filter((s) => !s.hidden && s.text?.trim());
  let best: Shape | undefined;
  let bestScore = 0;
  for (const shape of shapes) {
    const label = normalize(shape.text);
    if (label === q) return shape;
    if (label.includes(q) || q.includes(label)) {
      const score = Math.min(label.length, q.length);
      if (score > bestScore) {
        bestScore = score;
        best = shape;
      }
    }
  }
  return best;
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function shapeCenterPoint(shape: Shape): Point {
  return shapeCenter(shape);
}

function edgeBetween(page: Page, fromId: string, toId: string): Edge | undefined {
  return Object.values(page.edges).find(
    (e) => e.source.shapeId === fromId && e.target.shapeId === toId,
  );
}

/**
 * Apply a natural-language edit to the active page.
 * Returns null on success or an error message.
 */
export function applyNaturalLanguageEdit(prompt: string): string | null {
  const trimmed = prompt.trim();
  if (!trimmed) return 'Enter an edit instruction.';

  const between = trimmed.match(/(?:add|insert)\s+(.+?)\s+between\s+(.+?)\s+and\s+(.+)$/i);
  if (between) {
    const [, label, leftQ, rightQ] = between;
    return insertBetween(label!, leftQ!, rightQ!);
  }

  const after = trimmed.match(/(?:add|insert)\s+(.+?)\s+after\s+(.+)$/i);
  if (after) {
    const [, label, afterQ] = after;
    return insertAfter(label!, afterQ!);
  }

  const connect = trimmed.match(/connect\s+(.+?)\s+to\s+(.+)$/i);
  if (connect) {
    const [, fromQ, toQ] = connect;
    return connectShapes(fromQ!, toQ!);
  }

  const remove = trimmed.match(/(?:remove|delete)\s+(.+)$/i);
  if (remove) {
    return removeShape(remove[1]!);
  }

  return 'Try: "Add cache between API and DB", "Connect A to B", or "Delete old step".';
}

function insertBetween(label: string, leftQ: string, rightQ: string): string | null {
  const page = useProjectStore.getState().activePage();
  const left = findShapeByLabel(page, leftQ);
  const right = findShapeByLabel(page, rightQ);
  if (!left) return `Could not find a shape matching "${leftQ}".`;
  if (!right) return `Could not find a shape matching "${rightQ}".`;

  const layerId = page.layers[0]!.id;
  const pos = midpoint(shapeCenterPoint(left), shapeCenterPoint(right));
  const shape = createShape(
    {
      kind: 'rounded-rectangle',
      x: pos.x - 80,
      y: pos.y - 28,
      width: 160,
      height: 56,
      text: label.trim(),
    },
    layerId,
    Object.keys(page.shapes).length,
  );

  const direct = edgeBetween(page, left.id, right.id);
  const edges: Edge[] = [
    createEdge({ source: { shapeId: left.id }, target: { shapeId: shape.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
    createEdge({ source: { shapeId: shape.id }, target: { shapeId: right.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
  ];

  useHistoryStore.getState().run('AI edit', () => {
    const store = useProjectStore.getState();
    if (direct) store.removeElements([direct.id]);
    store.addShape(shape);
    for (const edge of edges) store.addEdge(edge);
    useEditorStore.getState().select([shape.id]);
  });
  return null;
}

function insertAfter(label: string, afterQ: string): string | null {
  const page = useProjectStore.getState().activePage();
  const after = findShapeByLabel(page, afterQ);
  if (!after) return `Could not find a shape matching "${afterQ}".`;

  const layerId = page.layers[0]!.id;
  const c = shapeCenterPoint(after);
  const shape = createShape(
    {
      kind: 'rectangle',
      x: c.x - 80,
      y: c.y + after.height / 2 + 60,
      width: 160,
      height: 56,
      text: label.trim(),
    },
    layerId,
    Object.keys(page.shapes).length,
  );
  const edge = createEdge(
    { source: { shapeId: after.id }, target: { shapeId: shape.id }, router: 'orthogonal', endArrow: 'triangle' },
    layerId,
  );

  useHistoryStore.getState().run('AI edit', () => {
    const store = useProjectStore.getState();
    store.addShape(shape);
    store.addEdge(edge);
    useEditorStore.getState().select([shape.id]);
  });
  return null;
}

function connectShapes(fromQ: string, toQ: string): string | null {
  const page = useProjectStore.getState().activePage();
  const from = findShapeByLabel(page, fromQ);
  const to = findShapeByLabel(page, toQ);
  if (!from) return `Could not find a shape matching "${fromQ}".`;
  if (!to) return `Could not find a shape matching "${toQ}".`;
  if (edgeBetween(page, from.id, to.id)) return 'Those shapes are already connected.';

  const edge = createEdge(
    { source: { shapeId: from.id }, target: { shapeId: to.id }, router: 'orthogonal', endArrow: 'triangle' },
    page.layers[0]!.id,
  );
  useHistoryStore.getState().run('AI edit', () => {
    useProjectStore.getState().addEdge(edge);
    useEditorStore.getState().select([edge.id]);
  });
  return null;
}

function removeShape(query: string): string | null {
  const page = useProjectStore.getState().activePage();
  const shape = findShapeByLabel(page, query);
  if (!shape) return `Could not find a shape matching "${query}".`;
  useHistoryStore.getState().run('AI edit', () => {
    useProjectStore.getState().removeElements([shape.id]);
    useEditorStore.getState().clearSelection();
  });
  return null;
}
