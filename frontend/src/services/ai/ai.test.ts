import { beforeEach, describe, expect, it } from 'vitest';
import { generateHeuristicDiagram } from './heuristic';
import { parseDiagramSpec } from './diagramSpec';
import { buildDiagramFromSpec } from './buildDiagram';
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { createProject } from '@/models/factory';

describe('heuristic generator', () => {
  it('produces sequential nodes and edges from arrows', () => {
    const spec = generateHeuristicDiagram('A -> B -> C');
    expect(spec.nodes).toHaveLength(3);
    expect(spec.edges).toHaveLength(2);
  });
});

describe('parseDiagramSpec', () => {
  it('drops edges referencing unknown nodes', () => {
    const spec = parseDiagramSpec({
      direction: 'TB',
      nodes: [{ id: 'a', label: 'A', kind: 'process' }],
      edges: [{ from: 'a', to: 'ghost' }],
    });
    expect(spec.edges).toHaveLength(0);
  });

  it('throws when there are no valid nodes', () => {
    expect(() => parseDiagramSpec({ nodes: [], edges: [] })).toThrow();
  });
});

describe('buildDiagramFromSpec', () => {
  beforeEach(() => {
    useProjectStore.getState().replaceProject(createProject());
    useHistoryStore.getState().clear();
    useEditorStore.getState().clearSelection();
  });

  it('adds shapes and edges to the active page as one history step', () => {
    const spec = generateHeuristicDiagram('Start -> Work -> Done');
    buildDiagramFromSpec(spec, { x: 0, y: 0 });

    const page = useProjectStore.getState().activePage();
    expect(Object.keys(page.shapes)).toHaveLength(3);
    expect(Object.keys(page.edges)).toHaveLength(2);

    useHistoryStore.getState().undo();
    const after = useProjectStore.getState().activePage();
    expect(Object.keys(after.shapes)).toHaveLength(0);
    expect(Object.keys(after.edges)).toHaveLength(0);
  });
});
