/**
 * Parse PlantUML activity diagrams into shapes and edges on the active page.
 * Supports `:Label;`, `start`/`stop`, and `A -> B` style arrows.
 * @module services/import/plantuml
 */
import type { Edge, Page, Shape } from '@/types';
import { createEdge, createShape } from '@/models/factory';
import { computeAutoLayout } from '@/engine/layout/autoLayout';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { useEditorStore } from '@/state/editorStore';

interface ParsedNode {
  id: string;
  label: string;
  kind: 'start' | 'stop' | 'activity';
}

interface ParsedEdge {
  from: string;
  to: string;
}

let nodeCounter = 0;

function nextId(label: string): string {
  nodeCounter += 1;
  return `p${nodeCounter}_${label.replace(/\W+/g, '_').slice(0, 20) || 'node'}`;
}

/** Parse PlantUML activity / simple arrow syntax. */
export function parsePlantUml(text: string): { nodes: ParsedNode[]; edges: ParsedEdge[] } {
  nodeCounter = 0;
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const idByLabel = new Map<string, string>();
  let lastId: string | null = null;

  const ensureNode = (label: string, kind: ParsedNode['kind'] = 'activity'): string => {
    const key = kind === 'activity' ? label : kind;
    const existing = idByLabel.get(key);
    if (existing) return existing;
    const id = nextId(key);
    idByLabel.set(key, id);
    nodes.push({ id, label: kind === 'activity' ? label : kind, kind });
    return id;
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('@') || line.startsWith('skinparam') || line.startsWith('title')) continue;

    if (/^start$/i.test(line)) {
      lastId = ensureNode('start', 'start');
      continue;
    }
    if (/^stop$/i.test(line) || /^end$/i.test(line)) {
      lastId = ensureNode('stop', 'stop');
      continue;
    }

    const activity = line.match(/^:(.+);$/);
    if (activity) {
      const label = activity[1]!.trim();
      const id = ensureNode(label);
      if (lastId) edges.push({ from: lastId, to: id });
      lastId = id;
      continue;
    }

    const arrow = line.match(/^(\w+)\s*[-=]+>\s*(\w+)(?:\s*:\s*(.+))?$/);
    if (arrow) {
      const from = ensureNode(arrow[1]!);
      const to = ensureNode(arrow[2]!);
      edges.push({ from, to });
      lastId = to;
      continue;
    }

    const classArrow = line.match(/^(\w+)\s*-->\s*(\w+)/);
    if (classArrow) {
      const from = ensureNode(classArrow[1]!);
      const to = ensureNode(classArrow[2]!);
      edges.push({ from, to });
      lastId = to;
    }
  }

  return { nodes, edges };
}

function shapeKindFor(node: ParsedNode): Shape['kind'] {
  if (node.kind === 'start' || node.kind === 'stop') return 'ellipse';
  return 'rounded-rectangle';
}

/** Import PlantUML text onto the active page with auto-layout. */
export function importPlantUml(text: string): void {
  const { nodes, edges } = parsePlantUml(text);
  if (nodes.length === 0) {
    throw new Error('No PlantUML nodes found. Use activity syntax like :Step; or A -> B.');
  }

  const store = useProjectStore.getState();
  const page = store.activePage();
  const layerId = page.layers[0]!.id;
  const idMap = new Map<string, string>();

  const shapes: Shape[] = nodes.map((node, i) => {
    const shape = createShape(
      {
        kind: shapeKindFor(node),
        x: 0,
        y: 0,
        width: node.kind === 'activity' ? 160 : 72,
        height: node.kind === 'activity' ? 64 : 72,
        text: node.label,
      },
      layerId,
      i,
    );
    idMap.set(node.id, shape.id);
    return shape;
  });

  const edgeList: Edge[] = edges
    .map((e) => {
      const from = idMap.get(e.from);
      const to = idMap.get(e.to);
      if (!from || !to) return null;
      return createEdge(
        { source: { shapeId: from }, target: { shapeId: to }, router: 'orthogonal', endArrow: 'triangle' },
        layerId,
      );
    })
    .filter((e): e is Edge => e !== null);

  const draftPage: Page = {
    ...page,
    shapes: Object.fromEntries(shapes.map((s) => [s.id, s])),
    edges: Object.fromEntries(edgeList.map((e) => [e.id, e])),
    order: [...shapes.map((s) => s.id), ...edgeList.map((e) => e.id)],
  };
  const layout = computeAutoLayout(draftPage);

  useHistoryStore.getState().run('Import PlantUML', () => {
    store.addShapes(shapes.map((s) => ({ ...s, ...layout[s.id] })));
    for (const edge of edgeList) store.addEdge(edge);
    useEditorStore.getState().select(shapes.map((s) => s.id));
  });
}
