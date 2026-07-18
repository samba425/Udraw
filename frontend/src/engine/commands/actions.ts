/**
 * High-level editor actions that operate on the current selection. Each action
 * reads the stores directly and records a single, reversible history step.
 * These are the shared implementations behind keyboard shortcuts, the context
 * menu, and toolbar buttons (DRY).
 * @module engine/commands/actions
 */
import type { Point, Shape } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { createId, createShape } from '@/models/factory';
import { descendants } from '@/models/group';
import { boundingBox } from '@/utils/geometry';
import { alignShapes, distributeShapes, type AlignMode, type DistributeMode } from '@/engine/alignment/align';
import type { LibraryIcon } from '@/shapes/registry';

/** The shapes currently selected on the active page. */
function selectedShapes(): Shape[] {
  const page = useProjectStore.getState().activePage();
  return useEditorStore
    .getState()
    .selectedIds.map((id) => page.shapes[id])
    .filter((s): s is Shape => Boolean(s));
}

/** Delete the current selection (shapes and edges). */
export function deleteSelection(): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  useHistoryStore.getState().run('Delete', () => {
    useProjectStore.getState().removeElements(ids);
    useEditorStore.getState().clearSelection();
  });
}

/** Duplicate the selected shapes with a small offset and select the copies. */
export function duplicateSelection(offset = 16): void {
  const shapes = selectedShapes();
  if (shapes.length === 0) return;
  const clones = shapes.map((s) => ({
    ...structuredClone(s),
    id: createId('shape'),
    x: s.x + offset,
    y: s.y + offset,
  }));
  useHistoryStore.getState().run('Duplicate', () => {
    useProjectStore.getState().addShapes(clones);
    useEditorStore.getState().select(clones.map((c) => c.id));
  });
}

/** Nudge the selection by a delta (used by arrow keys). */
export function nudgeSelection(dx: number, dy: number): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  useHistoryStore.getState().run('Nudge', () => {
    useProjectStore.getState().moveElementsBy(ids, dx, dy);
  });
}

/** Align the selection along an edge/center. */
export function alignSelection(mode: AlignMode): void {
  const shapes = selectedShapes();
  const patch = alignShapes(shapes, mode);
  if (Object.keys(patch).length === 0) return;
  useHistoryStore.getState().run('Align', () => useProjectStore.getState().updateShapes(patch));
}

/** Distribute the selection with equal spacing. */
export function distributeSelection(mode: DistributeMode): void {
  const shapes = selectedShapes();
  const patch = distributeShapes(shapes, mode);
  if (Object.keys(patch).length === 0) return;
  useHistoryStore.getState().run('Distribute', () => useProjectStore.getState().updateShapes(patch));
}

/** Change z-order for the (single) selection. */
export function reorderSelection(direction: 'front' | 'back' | 'forward' | 'backward'): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  useHistoryStore.getState().run('Reorder', () => {
    for (const id of ids) useProjectStore.getState().reorder(id, direction);
  });
}

/** Lock or unlock the selected shapes. */
export function setSelectionLocked(locked: boolean): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  const patches = Object.fromEntries(ids.map((id) => [id, { locked }]));
  useHistoryStore.getState().run(locked ? 'Lock' : 'Unlock', () =>
    useProjectStore.getState().updateShapes(patches),
  );
}

/** Show or hide the selected shapes. */
export function setSelectionHidden(hidden: boolean): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  const patches = Object.fromEntries(ids.map((id) => [id, { hidden }]));
  useHistoryStore.getState().run(hidden ? 'Hide' : 'Show', () =>
    useProjectStore.getState().updateShapes(patches),
  );
}

/**
 * Create a shape from a library icon at a world-space center point. Basic
 * primitives (icons that declare a `shapeKind`) become native editable shapes;
 * everything else becomes an `icon` shape referencing the library id. The new
 * shape is selected and recorded as a single history step.
 */
export function placeLibraryIcon(icon: LibraryIcon, center: Point): void {
  const project = useProjectStore.getState();
  const page = project.activePage();
  const layerId = page.layers[0]!.id;
  const index = Object.keys(page.shapes).length;
  const size = icon.defaultSize ?? { width: 96, height: 72 };
  const x = center.x - size.width / 2;
  const y = center.y - size.height / 2;

  const base = {
    x,
    y,
    width: size.width,
    height: size.height,
  };

  const shape = icon.shapeKind
    ? createShape(
        {
          ...base,
          kind: icon.shapeKind,
          text: icon.defaultText ?? '',
          ...(icon.defaultFill ? { fill: { type: 'solid' as const, color: icon.defaultFill } } : {}),
          ...(icon.defaultStroke ? { stroke: icon.defaultStroke } : {}),
        },
        layerId,
        index,
      )
    : createShape(
        {
          ...base,
          kind: 'icon',
          libraryId: icon.id,
          fill: { type: 'none', color: 'none' },
          stroke: 'none',
          strokeWidth: 0,
        },
        layerId,
        index,
      );

  useHistoryStore.getState().run('Add shape', () => {
    project.addShape(shape);
    useEditorStore.getState().select([shape.id]);
  });
}

/** Select every shape and edge on the active page. */
export function selectAll(): void {
  const page = useProjectStore.getState().activePage();
  useEditorStore.getState().select(page.order.filter((id) => !page.shapes[id]?.hidden));
}

/** Group the selected shapes under a new group container shape. */
export function groupSelection(): void {
  const shapes = selectedShapes();
  if (shapes.length < 2) return;
  const box = boundingBox(shapes.map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height })));
  if (!box) return;

  const page = useProjectStore.getState().activePage();
  const group = createShape(
    { kind: 'group', x: box.x, y: box.y, width: box.width, height: box.height, fill: { type: 'none', color: 'none' }, stroke: 'none', strokeWidth: 0 },
    page.layers[0]!.id,
  );

  useHistoryStore.getState().run('Group', () => {
    const store = useProjectStore.getState();
    store.addShape(group);
    const patches = Object.fromEntries(shapes.map((s) => [s.id, { parentId: group.id }]));
    store.updateShapes(patches);
    useEditorStore.getState().select([group.id]);
  });
}

/** Ungroup the selected group(s), detaching children and removing containers. */
export function ungroupSelection(): void {
  const page = useProjectStore.getState().activePage();
  const groups = useEditorStore
    .getState()
    .selectedIds.map((id) => page.shapes[id])
    .filter((s): s is Shape => s?.kind === 'group');
  if (groups.length === 0) return;

  useHistoryStore.getState().run('Ungroup', () => {
    const store = useProjectStore.getState();
    const freed: string[] = [];
    for (const group of groups) {
      const children = descendants(store.activePage(), group.id);
      const patches = Object.fromEntries(
        children
          .filter((id) => store.activePage().shapes[id]?.parentId === group.id)
          .map((id) => [id, { parentId: undefined }]),
      );
      store.updateShapes(patches);
      freed.push(...Object.keys(patches));
      store.removeElements([group.id]);
    }
    useEditorStore.getState().select(freed);
  });
}
