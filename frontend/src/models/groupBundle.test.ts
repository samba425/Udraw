import { beforeEach, describe, expect, it } from 'vitest';
import { bundleFromSelection, cloneBundle, internalEdgesForShapes } from './groupBundle';
import { useProjectStore } from '@/state/projectStore';
import { createEdge, createProject, createShape } from '@/models/factory';

describe('groupBundle', () => {
  beforeEach(() => {
    useProjectStore.getState().replaceProject(createProject());
  });

  it('collects internal edges when bundling a group', () => {
    const store = useProjectStore.getState();
    const page = store.activePage();
    const layerId = page.layers[0]!.id;
    const a = createShape({ kind: 'rectangle', x: 0, y: 0, width: 40, height: 40, text: 'A' }, layerId);
    const b = createShape({ kind: 'rectangle', x: 120, y: 0, width: 40, height: 40, text: 'B' }, layerId);
    const group = createShape({ kind: 'group', x: 0, y: 0, width: 160, height: 40 }, layerId);
    store.addShapes([a, b, group]);
    store.updateShapes({
      [a.id]: { parentId: group.id },
      [b.id]: { parentId: group.id },
    });
    const edge = createEdge(
      { source: { shapeId: a.id }, target: { shapeId: b.id }, groupId: group.id },
      layerId,
    );
    store.addEdge(edge);

    const bundle = bundleFromSelection(store.activePage(), [group.id]);
    expect(bundle.shapes).toHaveLength(3);
    expect(bundle.edges).toHaveLength(1);
    expect(bundle.edges[0]!.id).toBe(edge.id);
  });

  it('clones a group with remapped ids and parent links', () => {
    const store = useProjectStore.getState();
    const page = store.activePage();
    const layerId = page.layers[0]!.id;
    const a = createShape({ kind: 'rectangle', x: 0, y: 0, width: 40, height: 40 }, layerId);
    const b = createShape({ kind: 'rectangle', x: 80, y: 0, width: 40, height: 40 }, layerId);
    const group = createShape({ kind: 'group', x: 0, y: 0, width: 120, height: 40 }, layerId);
    store.addShapes([a, b, group]);
    store.updateShapes({
      [a.id]: { parentId: group.id },
      [b.id]: { parentId: group.id },
    });
    const edge = createEdge({ source: { shapeId: a.id }, target: { shapeId: b.id }, groupId: group.id }, layerId);
    store.addEdge(edge);

    const bundle = bundleFromSelection(store.activePage(), [group.id]);
    const cloned = cloneBundle(bundle, { x: 10, y: 10 });
    expect(cloned.shapes).toHaveLength(3);
    expect(cloned.edges).toHaveLength(1);
    expect(cloned.selectIds).toHaveLength(1);

    const newGroup = cloned.shapes.find((s) => s.kind === 'group')!;
    const childA = cloned.shapes.find((s) => s.parentId === newGroup.id && s.x === 10)!;
    expect(childA).toBeDefined();
    expect(cloned.edges[0]!.source.shapeId).toBe(childA!.id);
    expect(cloned.edges[0]!.groupId).toBe(newGroup.id);
  });

  it('finds internal edges between selected shapes', () => {
    const store = useProjectStore.getState();
    const layerId = store.activePage().layers[0]!.id;
    const a = createShape({ kind: 'rectangle', x: 0, y: 0, width: 40, height: 40 }, layerId);
    const b = createShape({ kind: 'rectangle', x: 100, y: 0, width: 40, height: 40 }, layerId);
    store.addShapes([a, b]);
    const edge = createEdge({ source: { shapeId: a.id }, target: { shapeId: b.id } }, layerId);
    store.addEdge(edge);
    const found = internalEdgesForShapes(store.activePage(), new Set([a.id, b.id]));
    expect(found).toHaveLength(1);
  });
});
