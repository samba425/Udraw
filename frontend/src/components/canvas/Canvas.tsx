/**
 * The infinite SVG canvas. Renders the grid, edges, shapes, selection chrome,
 * connector anchors/preview, and the live marquee, delegating all pointer
 * logic to the interaction hook. Wheel zooms toward the cursor; the camera
 * transform is applied to a single world-space group.
 * @module components/canvas/Canvas
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Point, Rect, Size } from '@/types';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { editorBus } from '@/utils/eventBus';
import { contentBounds } from '@/services/export/serializeSvg';
import { edgeAABB, shapeAABB, visibleWorldRect } from '@/engine/spatial/viewport';
import { buildQuadtree, type QuadItem } from '@/engine/spatial/quadtree';
import {
  useCanvasInteractions,
  type ConnectPreview,
} from '@/hooks/useCanvasInteractions';
import type { SmartGuide } from '@/engine/snapping/snap';
import { isShapeVisible, layerMap } from '@/models/layers';
import { getLibraryIcon } from '@/shapes/registry';
import { placeLibraryIcon } from '@/engine/commands/actions';
import { ICON_DND_TYPE } from '@/components/sidebar/LibraryTile';
import { importFile } from '@/services/import';
import { screenToWorld } from '@/utils/geometry';
import { Grid } from './Grid';
import { ShapeView } from './ShapeView';
import { EdgeView } from './EdgeView';
import { SelectionOverlay } from './SelectionOverlay';
import { AnchorOverlay } from './AnchorOverlay';
import { EdgeRouteOverlay } from './EdgeRouteOverlay';
import { flowHighlightIds } from '@/engine/presentation/flowPath';
import { GroupBreadcrumb } from './GroupBreadcrumb';
import { isDescendantOf, findGroupContainerAt } from '@/models/groupMembership';

/**
 * Above this element count, the canvas culls off-screen elements to keep the
 * DOM small and rendering fast on large diagrams.
 */
const CULL_THRESHOLD = 300;

/** Root canvas surface. */
export function Canvas({ readOnly: readOnlyOverride }: { readOnly?: boolean } = {}): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [connectPreview, setConnectPreview] = useState<ConnectPreview | null>(null);
  const [guides, setGuides] = useState<SmartGuide[]>([]);
  const [penPreview, setPenPreview] = useState<Point[] | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });

  const camera = useEditorStore((s) => s.camera);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const tool = useEditorStore((s) => s.tool);
  const hoveredShapeId = useEditorStore((s) => s.hoveredShapeId);
  const connectTargetId = useEditorStore((s) => s.connectTargetId);
  const readOnlyStore = useEditorStore((s) => s.readOnly);
  const presentationFlowActive = useEditorStore((s) => s.presentationFlowActive);
  const presentationFlowStep = useEditorStore((s) => s.presentationFlowStep);
  const presentationFlowPath = useEditorStore((s) => s.presentationFlowPath);
  const activeGroupId = useEditorStore((s) => s.activeGroupId);
  const readOnly = readOnlyOverride ?? readOnlyStore;
  const setHoveredShapeId = useEditorStore((s) => s.setHoveredShapeId);
  const zoomBy = useEditorStore((s) => s.zoomBy);

  const project = useProjectStore((s) => s.project);
  const activePageId = useProjectStore((s) => s.activePageId);
  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0]!;

  const interactions = useCanvasInteractions(svgRef, {
    setMarquee,
    setConnectPreview,
    setGuides,
    setPenPreview,
    setConnectTargetId: useEditorStore.getState().setConnectTargetId,
    readOnly,
  });
  const selectedSet = new Set(selectedIds);
  const layers = layerMap(page);
  const flowHighlight = presentationFlowActive
    ? flowHighlightIds(presentationFlowPath, presentationFlowStep)
    : null;

  const anchorShapeIds = useMemo(() => {
    if (tool === 'connector') return undefined;
    const ids = new Set(selectedIds);
    if (hoveredShapeId) ids.add(hoveredShapeId);
    return ids.size > 0 ? ids : null;
  }, [tool, selectedIds, hoveredShapeId]);

  // Track the on-screen viewport size for culling.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = (): void => {
      const rect = el.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * A spatial index over the current page, rebuilt only when the page changes.
   * Used to answer viewport-culling queries in roughly O(log n + k) instead of
   * scanning every element on each camera change.
   */
  const spatialIndex = useMemo(() => {
    if (page.order.length <= CULL_THRESHOLD) return null;
    const items: QuadItem[] = [];
    for (const id of page.order) {
      const shape = page.shapes[id];
      if (shape) {
        items.push({ id, bounds: shapeAABB(shape) });
        continue;
      }
      const edge = page.edges[id];
      if (edge) items.push({ id, bounds: edgeAABB(edge, page) });
    }
    return buildQuadtree(items);
  }, [page]);

  /**
   * Set of element ids to render. `null` means render everything (small
   * diagrams); otherwise only elements intersecting the viewport are included,
   * plus the current selection so overlays stay consistent.
   */
  const visibleIds = useMemo<Set<string> | null>(() => {
    if (!spatialIndex || viewport.width === 0) return null;
    const view = visibleWorldRect(camera, viewport);
    const set = spatialIndex.query(view);
    for (const id of selectedIds) set.add(id);
    return set;
  }, [spatialIndex, camera, viewport, selectedIds]);

  useEffect(() => {
    return editorBus.on('zoom:fit', () => {
      const bounds = contentBounds(page);
      const rect = svgRef.current?.getBoundingClientRect();
      if (!bounds || !rect) return;
      useEditorStore.getState().fitToBounds(bounds, { width: rect.width, height: rect.height });
    });
  }, [page]);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const pivot = { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
      zoomBy(Math.exp(-event.deltaY * 0.0015), pivot);
    },
    [zoomBy],
  );

  const onShapeEnter = useCallback(
    (id: string) => setHoveredShapeId(id),
    [setHoveredShapeId],
  );

  const onShapeLeave = useCallback(
    (id: string) => {
      if (useEditorStore.getState().hoveredShapeId === id) setHoveredShapeId(null);
    },
    [setHoveredShapeId],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    const types = event.dataTransfer.types;
    if (types.includes(ICON_DND_TYPE) || types.includes('Files')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    // File dropped from the OS — import it.
    if (event.dataTransfer.files.length > 0) {
      event.preventDefault();
      void importFile(event.dataTransfer.files[0]!);
      return;
    }
    const iconId = event.dataTransfer.getData(ICON_DND_TYPE);
    if (!iconId) return;
    event.preventDefault();
    const icon = getLibraryIcon(iconId);
    if (!icon) return;
    const rect = svgRef.current?.getBoundingClientRect();
    const cam = useEditorStore.getState().camera;
    const world = screenToWorld(
      { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) },
      cam,
    );
    placeLibraryIcon(icon, world, { parentGroupId: findGroupContainerAt(useProjectStore.getState().activePage(), world)?.id });
  }, []);

  const selectedShapes = selectedIds
    .map((id) => page.shapes[id])
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const selectedEdge = selectedIds.length === 1 ? page.edges[selectedIds[0]!] : undefined;

  const shapeDimmed = useCallback(
    (shapeId: string): boolean => {
      if (!activeGroupId) return false;
      return shapeId !== activeGroupId && !isDescendantOf(page, shapeId, activeGroupId);
    },
    [activeGroupId, page],
  );

  const cursor = readOnly
    ? tool === 'pan'
      ? 'grab'
      : 'default'
    : tool === 'pan'
      ? 'grab'
      : tool === 'select'
        ? 'default'
        : 'crosshair';

  return (
    <div className="relative h-full w-full">
      {!readOnly && <GroupBreadcrumb />}
      <svg
      ref={svgRef}
      className="h-full w-full touch-none select-none"
      style={{ background: 'var(--color-canvas)', cursor }}
      onPointerDown={interactions.onSvgPointerDown}
      onWheel={onWheel}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="application"
      aria-label="Diagram canvas"
    >
      <Grid camera={camera} size={project.settings.gridSize} />

      <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.zoom})`}>
        {page.order.map((id) => {
          if (visibleIds && !visibleIds.has(id)) return null;
          const edge = page.edges[id];
          if (edge) {
            const inFlow = flowHighlight?.has(id) ?? false;
            return (
              <EdgeView
                key={id}
                edge={edge}
                page={page}
                selected={selectedSet.has(id)}
                flowHighlighted={inFlow}
                flowDimmed={Boolean(flowHighlight && !inFlow)}
                onPointerDown={interactions.onEdgePointerDown}
                onDoubleClick={interactions.onEdgeDoubleClick}
              />
            );
          }
          const shape = page.shapes[id];
          if (shape) {
            if (!isShapeVisible(layers, shape)) return null;
            const inFlow = flowHighlight?.has(id) ?? false;
            const dimmed = Boolean(flowHighlight && !inFlow) || shapeDimmed(id);
            return (
              <ShapeView
                key={id}
                shape={shape}
                selected={selectedSet.has(id)}
                flowHighlighted={inFlow}
                flowDimmed={dimmed}
                onPointerDown={interactions.onShapePointerDown}
                onDoubleClick={interactions.onShapeDoubleClick}
                onPointerEnter={onShapeEnter}
                onPointerLeave={onShapeLeave}
              />
            );
          }
          return null;
        })}

        {(tool === 'connector' || anchorShapeIds) && (
          <AnchorOverlay
            page={page}
            zoom={camera.zoom}
            shapeIds={anchorShapeIds ?? undefined}
            outward={10 / camera.zoom}
            onAnchorDown={interactions.onAnchorDown}
          />
        )}

        {connectTargetId && page.shapes[connectTargetId] && (
          <rect
            x={page.shapes[connectTargetId]!.x - 6 / camera.zoom}
            y={page.shapes[connectTargetId]!.y - 6 / camera.zoom}
            width={page.shapes[connectTargetId]!.width + 12 / camera.zoom}
            height={page.shapes[connectTargetId]!.height + 12 / camera.zoom}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2 / camera.zoom}
            rx={4 / camera.zoom}
            pointerEvents="none"
            opacity={0.85}
          />
        )}

        <SelectionOverlay
          shapes={selectedShapes}
          zoom={camera.zoom}
          showHandles={tool === 'select'}
          onResizeHandleDown={interactions.onResizeHandleDown}
          onRotateHandleDown={interactions.onRotateHandleDown}
        />

        {selectedEdge && tool === 'select' && !readOnly && (
          <EdgeRouteOverlay
            edge={selectedEdge}
            page={page}
            zoom={camera.zoom}
            onEndpointDown={interactions.onEndpointDown}
            onWaypointDown={interactions.onWaypointDown}
            onLabelDown={interactions.onLabelDown}
          />
        )}

        {guides.map((guide, i) =>
          guide.orientation === 'v' ? (
            <line
              key={`g${i}`}
              x1={guide.position}
              y1={guide.from}
              x2={guide.position}
              y2={guide.to}
              stroke="#ec4899"
              strokeWidth={1 / camera.zoom}
              pointerEvents="none"
            />
          ) : (
            <line
              key={`g${i}`}
              x1={guide.from}
              y1={guide.position}
              x2={guide.to}
              y2={guide.position}
              stroke="#ec4899"
              strokeWidth={1 / camera.zoom}
              pointerEvents="none"
            />
          ),
        )}

        {penPreview && penPreview.length > 1 && (
          <polyline
            points={penPreview.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#1f2430"
            strokeWidth={2 / camera.zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}

        {connectPreview && (
          <line
            x1={connectPreview.from.x}
            y1={connectPreview.from.y}
            x2={connectPreview.to.x}
            y2={connectPreview.to.y}
            stroke="var(--color-accent)"
            strokeWidth={2 / camera.zoom}
            strokeDasharray={`${5 / camera.zoom} ${4 / camera.zoom}`}
            pointerEvents="none"
          />
        )}

        {marquee && (
          <rect
            x={marquee.x}
            y={marquee.y}
            width={marquee.width}
            height={marquee.height}
            fill="var(--color-selection)"
            fillOpacity={0.08}
            stroke="var(--color-selection)"
            strokeWidth={1 / camera.zoom}
            strokeDasharray={`${4 / camera.zoom} ${3 / camera.zoom}`}
            pointerEvents="none"
          />
        )}
      </g>
    </svg>
    </div>
  );
}
