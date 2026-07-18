import { beforeEach, describe, expect, it } from 'vitest';
import { useHistoryStore } from './historyStore';
import { useProjectStore } from './projectStore';
import { createProject, createShape } from '@/models/factory';

describe('historyStore', () => {
  beforeEach(() => {
    const project = createProject();
    useProjectStore.getState().replaceProject(project);
    useHistoryStore.getState().clear();
  });

  it('records and reverses a mutation', () => {
    const store = useProjectStore.getState();
    const layerId = store.activePage().layers[0]!.id;
    const shape = createShape({ kind: 'rectangle', x: 0, y: 0, width: 10, height: 10 }, layerId);

    useHistoryStore.getState().run('Create', () => store.addShape(shape));
    expect(Object.keys(useProjectStore.getState().activePage().shapes)).toHaveLength(1);

    useHistoryStore.getState().undo();
    expect(Object.keys(useProjectStore.getState().activePage().shapes)).toHaveLength(0);

    useHistoryStore.getState().redo();
    expect(Object.keys(useProjectStore.getState().activePage().shapes)).toHaveLength(1);
  });

  it('does not record no-op commits', () => {
    useHistoryStore.getState().capture();
    useHistoryStore.getState().commit('noop');
    expect(useHistoryStore.getState().past).toHaveLength(0);
  });

  it('clears the redo stack on a new action', () => {
    const store = useProjectStore.getState();
    const layerId = store.activePage().layers[0]!.id;
    const shapeA = createShape({ kind: 'rectangle', x: 0, y: 0, width: 10, height: 10 }, layerId);
    const shapeB = createShape({ kind: 'ellipse', x: 0, y: 0, width: 10, height: 10 }, layerId);

    useHistoryStore.getState().run('Create A', () => store.addShape(shapeA));
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().future).toHaveLength(1);

    useHistoryStore.getState().run('Create B', () => store.addShape(shapeB));
    expect(useHistoryStore.getState().future).toHaveLength(0);
  });
});
