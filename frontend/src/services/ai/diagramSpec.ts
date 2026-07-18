/**
 * The neutral diagram specification exchanged with the optional backend AI
 * service (and produced locally when offline). Mirrors the backend contract in
 * `backend/src/diagramSpec.ts`.
 * @module services/ai/diagramSpec
 */

/** High-level node role used to pick a shape kind when building the diagram. */
export type DiagramNodeKind =
  | 'start'
  | 'end'
  | 'process'
  | 'decision'
  | 'data'
  | 'actor'
  | 'note';

/** A single node in a generated diagram. */
export interface DiagramNode {
  id: string;
  label: string;
  kind: DiagramNodeKind;
}

/** A directed connection between two nodes. */
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

/** A complete generated diagram specification. */
export interface DiagramSpec {
  title?: string;
  direction: 'TB' | 'LR';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

const NODE_KINDS: readonly DiagramNodeKind[] = [
  'start',
  'end',
  'process',
  'decision',
  'data',
  'actor',
  'note',
];

/**
 * Validate and normalize an untrusted value into a `DiagramSpec`. Throws when
 * the shape is fundamentally invalid. Applied to backend responses so malformed
 * payloads never reach the renderer.
 */
export function parseDiagramSpec(value: unknown): DiagramSpec {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Diagram spec must be an object');
  }
  const record = value as Record<string, unknown>;
  const rawNodes = Array.isArray(record.nodes) ? record.nodes : [];
  const nodes: DiagramNode[] = rawNodes
    .slice(0, 200)
    .map((raw): DiagramNode | null => {
      if (typeof raw !== 'object' || raw === null) return null;
      const n = raw as Record<string, unknown>;
      if (typeof n.id !== 'string' || !n.id) return null;
      const kind = NODE_KINDS.includes(n.kind as DiagramNodeKind)
        ? (n.kind as DiagramNodeKind)
        : 'process';
      return {
        id: n.id.slice(0, 64),
        label: typeof n.label === 'string' ? n.label.slice(0, 200) : '',
        kind,
      };
    })
    .filter((n): n is DiagramNode => n !== null);

  const ids = new Set(nodes.map((n) => n.id));
  const rawEdges = Array.isArray(record.edges) ? record.edges : [];
  const edges: DiagramEdge[] = rawEdges
    .slice(0, 400)
    .map((raw): DiagramEdge | null => {
      if (typeof raw !== 'object' || raw === null) return null;
      const e = raw as Record<string, unknown>;
      if (typeof e.from !== 'string' || typeof e.to !== 'string') return null;
      if (!ids.has(e.from) || !ids.has(e.to)) return null;
      return {
        from: e.from,
        to: e.to,
        ...(typeof e.label === 'string' ? { label: e.label.slice(0, 120) } : {}),
      };
    })
    .filter((e): e is DiagramEdge => e !== null);

  if (nodes.length === 0) throw new Error('Diagram spec has no valid nodes');

  return {
    ...(typeof record.title === 'string' ? { title: record.title.slice(0, 120) } : {}),
    direction: record.direction === 'LR' ? 'LR' : 'TB',
    nodes,
    edges,
  };
}
