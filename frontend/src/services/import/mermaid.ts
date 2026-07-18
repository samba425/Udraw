/**
 * Parse a simple Mermaid flowchart into shapes and edges on the active page.
 * Supports `flowchart TD|LR|TB` with node definitions and `-->` / `-- label -->` edges.
 * @module services/import/mermaid
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
}

interface ParsedEdge {
  from: string;
  to: string;
  label?: string;
}

/** Strip mermaid node id prefix if present. */
function cleanId(raw: string): string {
  return raw.replace(/^n_/, '').trim();
}

/** Parse node lines like `  A["Label"]` or `  n_x["text"]`. */
function parseNode(line: string): ParsedNode | null {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*\[\s*"([^"]*)"\s*\]/);
  if (!m) return null;
  return { id: cleanId(m[1]!), label: m[2]! };
}

/** Parse edge lines like `  A --> B` or `  A -- "yes" --> B`. */
function parseEdgeLine(line: string): ParsedEdge | null {
  const labeled = line.match(/^\s*(\w+)\s*--\s*"([^"]*)"\s*-->\s*(\w+)/);
  if (labeled) {
    return { from: cleanId(labeled[1]!), to: cleanId(labeled[3]!), label: labeled[2] };
  }
  const plain = line.match(/^\s*(\w+)\s*-->\s*(\w+)/);
  if (plain) return { from: cleanId(plain[1]!), to: cleanId(plain[2]!) };
  return null;
}

/** Parse mermaid source into nodes and edges. */
export function parseMermaid(text: string): { nodes: ParsedNode[]; edges: ParsedEdge[] } {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const nodeIds = new Set<string>();

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) continue;
    const node = parseNode(line);
    if (node) {
      if (!nodeIds.has(node.id)) {
        nodes.push(node);
        nodeIds.add(node.id);
      }
      continue;
    }
    const edge = parseEdgeLine(line);
    if (edge) edges.push(edge);
  }
  return { nodes, edges };
}

/** Import mermaid text onto the active page with auto-layout. */
export function importMermaid(text: string): void {
  const { nodes, edges } = parseMermaid(text);
  if (nodes.length === 0) throw new Error('No Mermaid nodes found. Use flowchart TD with A["Label"] syntax.');

  const store = useProjectStore.getState();
  const page = store.activePage();
  const layerId = page.layers[0]!.id;

  const idMap = new Map<string, string>();
  const shapes: Shape[] = nodes.map((node, i) => {
    const shape = createShape(
      {
        kind: 'rounded-rectangle',
        x: 0,
        y: 0,
        width: 160,
        height: 64,
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
        {
          source: { shapeId: from },
          target: { shapeId: to },
          router: 'orthogonal',
          endArrow: 'triangle',
          label: e.label ?? '',
        },
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

  useHistoryStore.getState().run('Import Mermaid', () => {
    store.addShapes(shapes.map((s) => ({ ...s, ...layout[s.id] })));
    for (const edge of edgeList) store.addEdge(edge);
    useEditorStore.getState().select(shapes.map((s) => s.id));
  });
}
