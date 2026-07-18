/**
 * Export the active diagram page to / from Mermaid flowchart text.
 * @module services/mermaid/pageMermaid
 */
import type { Edge, Page, Shape } from '@/types';
import { createEdge, createShape } from '@/models/factory';
import { computeAutoLayout } from '@/engine/layout/autoLayout';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { useEditorStore } from '@/state/editorStore';
import { editorBus } from '@/utils/eventBus';

interface ParsedNode {
  id: string;
  label: string;
}

interface ParsedEdge {
  from: string;
  to: string;
  label?: string;
}

/** Build a safe mermaid node id from a shape id. */
export function mermaidNodeId(id: string): string {
  return 'n_' + id.replace(/[^a-zA-Z0-9_]/g, '');
}

/** Escape a label for a mermaid quoted string. */
function mermaidLabel(text: string, fallback: string): string {
  const clean = (text || fallback).replace(/"/g, "'").replace(/\n/g, ' ');
  return clean.slice(0, 60);
}

/** Serialize a page to Mermaid flowchart source for the active page. */
export function pageToMermaid(page: Page): string {
  const lines: string[] = ['flowchart TD'];
  for (const shape of Object.values(page.shapes)) {
    if (shape.kind === 'group') continue;
    lines.push(`  ${mermaidNodeId(shape.id)}["${mermaidLabel(shape.text, shape.kind)}"]`);
  }
  for (const edge of Object.values(page.edges)) {
    if (!edge.source.shapeId || !edge.target.shapeId) continue;
    const arrow = edge.label ? `-- "${mermaidLabel(edge.label, '')}" -->` : '-->';
    lines.push(`  ${mermaidNodeId(edge.source.shapeId)} ${arrow} ${mermaidNodeId(edge.target.shapeId)}`);
  }
  return lines.join('\n');
}

/** Mermaid text for the currently active page. */
export function activePageToMermaid(): string {
  return pageToMermaid(useProjectStore.getState().activePage());
}

function cleanId(raw: string): string {
  return raw.replace(/^n_/, '').trim();
}

function parseNode(line: string): ParsedNode | null {
  const quoted = line.match(/^\s*([A-Za-z0-9_]+)\s*\[\s*"([^"]*)"\s*\]/);
  if (quoted) return { id: cleanId(quoted[1]!), label: quoted[2]! };
  const plain = line.match(/^\s*([A-Za-z0-9_]+)\s*\[([^\]]*)\]/);
  if (plain) return { id: cleanId(plain[1]!), label: plain[2]!.trim() };
  const simple = line.match(/^\s*([A-Za-z0-9_]+)\s*$/);
  if (simple) return { id: cleanId(simple[1]!), label: simple[1]! };
  return null;
}

function parseEdgeLine(line: string): ParsedEdge | null {
  const labeled = line.match(/^\s*(\w+)\s*--\s*"([^"]*)"\s*-->\s*(\w+)/);
  if (labeled) return { from: cleanId(labeled[1]!), to: cleanId(labeled[3]!), label: labeled[2] };
  const plain = line.match(/^\s*(\w+)\s*-->\s*(\w+)/);
  if (plain) return { from: cleanId(plain[1]!), to: cleanId(plain[2]!) };
  return null;
}

/** Parse mermaid flowchart text into nodes and edges. */
export function parseMermaidFlowchart(text: string): { nodes: ParsedNode[]; edges: ParsedEdge[] } {
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const nodeIds = new Set<string>();

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) continue;
    const edge = parseEdgeLine(line);
    if (edge) {
      edges.push(edge);
      if (!nodeIds.has(edge.from)) {
        nodes.push({ id: edge.from, label: edge.from });
        nodeIds.add(edge.from);
      }
      if (!nodeIds.has(edge.to)) {
        nodes.push({ id: edge.to, label: edge.to });
        nodeIds.add(edge.to);
      }
      continue;
    }
    const node = parseNode(line);
    if (node && !nodeIds.has(node.id)) {
      nodes.push(node);
      nodeIds.add(node.id);
    }
  }
  return { nodes, edges };
}

function buildFromMermaid(text: string, page: Page, layerId: string): { shapes: Shape[]; edges: Edge[] } {
  const { nodes, edges } = parseMermaidFlowchart(text);
  if (nodes.length === 0) throw new Error('No Mermaid nodes found. Use flowchart TD with A["Label"] or A --> B.');

  const idMap = new Map<string, string>();
  const shapes: Shape[] = nodes.map((node, i) => {
    const shape = createShape(
      { kind: 'rounded-rectangle', x: 0, y: 0, width: 160, height: 64, text: node.label },
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
  return {
    shapes: shapes.map((s) => ({ ...s, ...layout[s.id] })),
    edges: edgeList,
  };
}

/** Replace the active page content from Mermaid text. Returns error or null. */
export function applyMermaidToActivePage(text: string): string | null {
  try {
    const store = useProjectStore.getState();
    const page = store.activePage();
    const layerId = page.layers[0]!.id;
    const { shapes, edges } = buildFromMermaid(text, page, layerId);
    const removeIds = [...page.order];

    useHistoryStore.getState().run('Apply Mermaid', () => {
      if (removeIds.length > 0) store.removeElements(removeIds);
      store.addShapes(shapes);
      for (const edge of edges) store.addEdge(edge);
      useEditorStore.getState().select(shapes.map((s) => s.id));
    });
    editorBus.emit('zoom:fit', undefined);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid Mermaid source.';
  }
}
