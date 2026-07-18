import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteSelection,
  duplicateSelection,
  groupSelection,
  ungroupSelection,
} from './actions';
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { createProject, createShape } from '@/models/factory';

function seedTwoShapes(): string[] {
  const project = createProject();
  useProjectStore.getState().replaceProject(project);
  useHistoryStore.getState().clear();
  const store = useProjectStore.getState();
  const layerId = store.activePage().layers[0]!.id;
  const a = createShape({ kind: 'rectangle', x: 0, y: 0, width: 40, height: 40 }, layerId);
  const b = createShape({ kind: 'ellipse', x: 100, y: 100, width: 40, height: 40 }, layerId);
  store.addShapes([a, b]);
  return [a.id, b.id];
}

describe('selection actions', () => {
  beforeEach(() => {
    seedTwoShapes();
  });

  it('duplicates the selection with an offset', () => {
    const ids = seedTwoShapes();
    useEditorStore.getState().select(ids);
    duplicateSelection(16);
    const shapes = useProjectStore.getState().activePage().shapes;
    expect(Object.keys(shapes)).toHaveLength(4);
  });

  it('deletes the selection', () => {
    const ids = seedTwoShapes();
    useEditorStore.getState().select([ids[0]!]);
    deleteSelection();
    expect(Object.keys(useProjectStore.getState().activePage().shapes)).toHaveLength(1);
  });

  it('groups and ungroups shapes', () => {
    const ids = seedTwoShapes();
    useEditorStore.getState().select(ids);
    groupSelection();

    const afterGroup = useProjectStore.getState().activePage();
    const groups = Object.values(afterGroup.shapes).filter((s) => s.kind === 'group');
    expect(groups).toHaveLength(1);
    expect(afterGroup.shapes[ids[0]!]!.parentId).toBe(groups[0]!.id);

    ungroupSelection();
    const afterUngroup = useProjectStore.getState().activePage();
    expect(Object.values(afterUngroup.shapes).some((s) => s.kind === 'group')).toBe(false);
    expect(afterUngroup.shapes[ids[0]!]!.parentId).toBeUndefined();
  });

  it('undoes a group operation', () => {
    const ids = seedTwoShapes();
    useEditorStore.getState().select(ids);
    groupSelection();
    useHistoryStore.getState().undo();
    expect(Object.values(useProjectStore.getState().activePage().shapes).some((s) => s.kind === 'group')).toBe(false);
  });
});
