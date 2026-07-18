/**
 * Converts a neutral `DiagramSpec` into concrete shapes and edges, laid out on
 * a simple layered grid, and inserts them onto the active page as a single
 * undoable history step.
 * @module services/ai/buildDiagram
 */
import type { DiagramNodeKind, DiagramSpec } from './diagramSpec';
import type { Point, Shape, ShapeKind } from '@/types';
import { createEdge, createShape } from '@/models/factory';
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';

interface KindStyle {
  kind: ShapeKind;
  width: number;
  height: number;
  colorIndex: number;
}

/** Map an abstract node role to a concrete shape kind, size, and swatch. */
const KIND_STYLES: Record<DiagramNodeKind, KindStyle> = {
  start: { kind: 'rounded-rectangle', width: 150, height: 60, colorIndex: 2 },
  end: { kind: 'rounded-rectangle', width: 150, height: 60, colorIndex: 6 },
  process: { kind: 'rectangle', width: 170, height: 68, colorIndex: 0 },
  decision: { kind: 'diamond', width: 160, height: 100, colorIndex: 3 },
  data: { kind: 'cylinder', width: 140, height: 96, colorIndex: 1 },
  actor: { kind: 'actor', width: 80, height: 120, colorIndex: 4 },
  note: { kind: 'sticky-note', width: 150, height: 100, colorIndex: 5 },
};

const GAP_X = 80;
const GAP_Y = 80;

/**
 * Assign a layer index (topological level) to every node. Nodes with no
 * incoming edges start at level 0; each edge pushes its target one level deeper.
 * Cycles are handled gracefully by capping iterations.
 */
function assignLevels(spec: DiagramSpec): Map<string, number> {
  const level = new Map<string, number>();
  for (const node of spec.nodes) level.set(node.id, 0);

  const maxIterations = spec.nodes.length + 1;
  for (let i = 0; i < maxIterations; i++) {
    let changed = false;
    for (const edge of spec.edges) {
      const from = level.get(edge.from) ?? 0;
      const to = level.get(edge.to) ?? 0;
      if (to < from + 1) {
        level.set(edge.to, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return level;
}

/**
 * Build shapes/edges from a spec and insert them at `origin` (world-space
 * top-left of the layout). Returns the ids of the created elements.
 */
export function buildDiagramFromSpec(spec: DiagramSpec, origin: Point): string[] {
  const project = useProjectStore.getState();
  const page = project.activePage();
  const layerId = page.layers[0]!.id;

  const levels = assignLevels(spec);
  const byLevel = new Map<number, string[]>();
  for (const node of spec.nodes) {
    const lvl = levels.get(node.id) ?? 0;
    const bucket = byLevel.get(lvl) ?? [];
    bucket.push(node.id);
    byLevel.set(lvl, bucket);
  }

  const horizontal = spec.direction === 'LR';
  const cellW = 190;
  const cellH = 150;

  const shapesById = new Map<string, Shape>();
  const shapes: Shape[] = [];

  for (const node of spec.nodes) {
    const style = KIND_STYLES[node.kind];
    const lvl = levels.get(node.id) ?? 0;
    const bucket = byLevel.get(lvl)!;
    const indexInLevel = bucket.indexOf(node.id);

    // `lvl` advances along the flow direction; `indexInLevel` spreads across it.
    const flow = lvl * (horizontal ? cellW + GAP_X : cellH + GAP_Y);
    const cross = indexInLevel * (horizontal ? cellH + GAP_Y : cellW + GAP_X);

    const centerX = origin.x + (horizontal ? flow : cross) + cellW / 2;
    const centerY = origin.y + (horizontal ? cross : flow) + cellH / 2;

    const shape = createShape(
      {
        kind: style.kind,
        x: centerX - style.width / 2,
        y: centerY - style.height / 2,
        width: style.width,
        height: style.height,
        text: node.label,
      },
      layerId,
      style.colorIndex,
    );
    shapes.push(shape);
    shapesById.set(node.id, shape);
  }

  const edges = spec.edges
    .map((edge) => {
      const source = shapesById.get(edge.from);
      const target = shapesById.get(edge.to);
      if (!source || !target) return null;
      return createEdge(
        {
          source: { shapeId: source.id },
          target: { shapeId: target.id },
          router: 'orthogonal',
          endArrow: 'triangle',
          label: edge.label ?? '',
        },
        layerId,
      );
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const ids = [...shapes.map((s) => s.id), ...edges.map((e) => e.id)];
  useHistoryStore.getState().run('Generate diagram', () => {
    const store = useProjectStore.getState();
    store.addShapes(shapes);
    for (const edge of edges) store.addEdge(edge);
    useEditorStore.getState().select(shapes.map((s) => s.id));
  });
  return ids;
}
