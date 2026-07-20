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
import { createShape } from '@/models/factory';
import { descendants } from '@/models/group';
import { GROUP_BORDER_STROKE } from '@/models/groupMembership';
import { adoptShapeIntoGroup } from '@/models/groupMembership';
import { bundleFromSelection, cloneBundle, edgesForGroup, expandCascadeIds, internalEdgesForShapes, reorderBlock } from '@/models/groupBundle';
import { boundingBox } from '@/utils/geometry';
import { editorBus } from '@/utils/eventBus';
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

/** Duplicate the selected shapes (and group contents) with a small offset. */
export function duplicateSelection(offset = 16): void {
  const page = useProjectStore.getState().activePage();
  const ids = useEditorStore.getState().selectedIds;
  const bundle = bundleFromSelection(page, ids);
  if (bundle.shapes.length === 0) return;
  const cloned = cloneBundle(bundle, { x: offset, y: offset });
  useHistoryStore.getState().run('Duplicate', () => {
    const store = useProjectStore.getState();
    store.addShapes(cloned.shapes);
    store.addEdges(cloned.edges);
    useEditorStore.getState().select(cloned.selectIds);
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

/** Change z-order for the selection; groups move with all members + edges. */
export function reorderSelection(direction: 'front' | 'back' | 'forward' | 'backward'): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  useHistoryStore.getState().run('Reorder', () => {
    const store = useProjectStore.getState();
    const page = store.activePage();
    const { shapeIds, edgeIds } = expandCascadeIds(page, ids);
    const blockIds = new Set([...shapeIds, ...edgeIds]);
    const nextOrder = reorderBlock(page.order, blockIds, direction);
    store.setPageOrder(nextOrder);
  });
}

/** Lock or unlock the selected shapes (cascades into groups). */
export function setSelectionLocked(locked: boolean): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  const page = useProjectStore.getState().activePage();
  const { shapeIds, edgeIds } = expandCascadeIds(page, ids);
  const shapePatches = Object.fromEntries(shapeIds.map((id) => [id, { locked }]));
  const edgePatches = Object.fromEntries(edgeIds.map((id) => [id, { locked }]));
  useHistoryStore.getState().run(locked ? 'Lock' : 'Unlock', () => {
    const store = useProjectStore.getState();
    store.updateShapes(shapePatches);
    store.updateEdges(edgePatches);
  });
}

/** Show or hide the selected shapes (cascades into groups). */
export function setSelectionHidden(hidden: boolean): void {
  const ids = useEditorStore.getState().selectedIds;
  if (ids.length === 0) return;
  const page = useProjectStore.getState().activePage();
  const { shapeIds, edgeIds } = expandCascadeIds(page, ids);
  const shapePatches = Object.fromEntries(shapeIds.map((id) => [id, { hidden }]));
  const edgePatches = Object.fromEntries(edgeIds.map((id) => [id, { hidden }]));
  useHistoryStore.getState().run(hidden ? 'Hide' : 'Show', () => {
    const store = useProjectStore.getState();
    store.updateShapes(shapePatches);
    store.updateEdges(edgePatches);
  });
}

/**
 * Create a shape from a library icon at a world-space center point. Basic
 * primitives (icons that declare a `shapeKind`) become native editable shapes;
 * everything else becomes an `icon` shape referencing the library id. The new
 * shape is selected and recorded as a single history step.
 */
export function placeLibraryIcon(icon: LibraryIcon, center: Point, options?: { parentGroupId?: string }): void {
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
          fill: icon.defaultFill
            ? { type: 'solid' as const, color: icon.defaultFill }
            : { type: 'none' as const, color: 'none' },
          stroke: icon.defaultStroke ?? '#475569',
          strokeWidth: icon.defaultStroke ? 2 : 1.5,
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
    if (options?.parentGroupId) adoptShapeIntoGroup(shape.id, options.parentGroupId);
    useEditorStore.getState().select([shape.id]);
  });
}

/** Select every shape and edge on the active page. */
export function selectAll(): void {
  const page = useProjectStore.getState().activePage();
  useEditorStore.getState().select(page.order.filter((id) => !page.shapes[id]?.hidden));
}

/** Group the selected shapes under a new group container shape. */
export function groupSelection(options?: { name?: string; showBorder?: boolean; prompt?: boolean }): void {
  const shapes = selectedShapes().filter((s) => s.kind !== 'group');
  if (shapes.length < 2) {
    editorBus.emit('toast', {
      message: 'Select at least 2 shapes to group (Ctrl+G).',
      kind: 'info',
    });
    return;
  }
  const box = boundingBox(shapes.map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height })));
  if (!box) return;

  let name = options?.name ?? 'Group';
  let showBorder = options?.showBorder ?? false;
  if (options?.prompt !== false) {
    const prompted = window.prompt('Group name (optional)', 'Group');
    if (prompted === null) return;
    name = prompted.trim();
    showBorder = window.confirm('Show a dashed border around this group?');
  }

  const page = useProjectStore.getState().activePage();
  const group = createShape(
    {
      kind: 'group',
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      text: name.trim(),
      fill: { type: 'none', color: 'none' },
      stroke: showBorder ? GROUP_BORDER_STROKE : 'none',
      strokeWidth: showBorder ? 1.5 : 0,
      dash: showBorder ? 'dashed' : 'solid',
      metadata: { showBorder },
    },
    page.layers[0]!.id,
  );

  useHistoryStore.getState().run('Group', () => {
    const store = useProjectStore.getState();
    store.addShape(group);
    const patches = Object.fromEntries(shapes.map((s) => [s.id, { parentId: group.id }]));
    store.updateShapes(patches);
    const shapeIds = new Set(shapes.map((s) => s.id));
    for (const edge of internalEdgesForShapes(store.activePage(), shapeIds)) {
      store.updateEdge(edge.id, { groupId: group.id });
    }
    useEditorStore.getState().select([group.id]);
  });
  const edgeCount = internalEdgesForShapes(page, new Set(shapes.map((s) => s.id))).length;
  editorBus.emit('toast', {
    message: edgeCount > 0 ? `Grouped ${shapes.length} shapes and ${edgeCount} connectors.` : `Grouped ${shapes.length} shapes.`,
    kind: 'success',
  });
}

/** True when the current selection includes at least one group. */
export function selectionHasGroup(): boolean {
  const page = useProjectStore.getState().activePage();
  return useEditorStore.getState().selectedIds.some((id) => page.shapes[id]?.kind === 'group');
}

/** Ungroup the selected group(s), detaching children and removing containers. */
export function ungroupSelection(): void {
  const page = useProjectStore.getState().activePage();
  const groups = useEditorStore
    .getState()
    .selectedIds.map((id) => page.shapes[id])
    .filter((s): s is Shape => s?.kind === 'group');
  if (groups.length === 0) {
    editorBus.emit('toast', { message: 'Select a group to ungroup (Ctrl+Shift+G).', kind: 'info' });
    return;
  }

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
      for (const edge of edgesForGroup(store.activePage(), group.id)) {
        store.updateEdge(edge.id, { groupId: undefined });
      }
      freed.push(...Object.keys(patches));
      store.removeElements([group.id]);
    }
    useEditorStore.getState().select(freed);
  });
  editorBus.emit('toast', { message: 'Group dissolved.', kind: 'success' });
}
