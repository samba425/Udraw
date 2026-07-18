/**
 * Pointer interaction state machine for the canvas: selection, marquee,
 * move, resize, rotate, shape creation, panning, connector creation, and
 * connector endpoint reconnection. All mutable drag state lives in refs so
 * React renders stay cheap. Window listeners use the stable "latest ref"
 * pattern so add/removeEventListener see identical references.
 * @module hooks/useCanvasInteractions
 */
import { useCallback, useRef, type RefObject } from 'react';
import type { EdgeEndpoint, Point, Rect, Shape, ShapeKind, ToolId } from '@/types';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { createEdge, createShape } from '@/models/factory';
import {
  boundingBox,
  rectFromPoints,
  rectsIntersect,
  screenToWorld,
  snapToStep,
} from '@/utils/geometry';
import { resizeRect, type ResizeHandle } from '@/engine/selection/handles';
import { hitTestShape } from '@/engine/selection/hitTest';
import { anchorPoint, nearestAnchor } from '@/engine/routing/anchors';
import { computeSnap, type SmartGuide } from '@/engine/snapping/snap';
import { isShapeLocked, layerMap } from '@/models/layers';
import { collectMovable, topAncestor } from '@/models/group';
import { useHistory } from './useHistory';
import { openHyperlink } from '@/utils/links';
import { applyFormatToShapes } from '@/engine/commands/formatPainter';

/** Tools that create a shape by click-drag. */
const CREATE_TOOLS: Partial<Record<ToolId, ShapeKind>> = {
  rectangle: 'rectangle',
  'rounded-rectangle': 'rounded-rectangle',
  ellipse: 'ellipse',
  diamond: 'diamond',
  triangle: 'triangle',
  hexagon: 'hexagon',
  text: 'text',
  'sticky-note': 'sticky-note',
  comment: 'comment',
};

/** A live connector preview segment rendered by the Canvas. */
export interface ConnectPreview {
  from: Point;
  to: Point;
}

type Interaction =
  | { mode: 'idle' }
  | { mode: 'pan'; startClient: Point; startCamera: Point }
  | { mode: 'marquee'; startWorld: Point; current: Rect }
  | { mode: 'move'; startWorld: Point; origins: Record<string, Point>; moved: boolean }
  | { mode: 'resize'; handle: ResizeHandle; original: Rect; id: string }
  | { mode: 'rotate'; center: Point; id: string; startAngle: number; original: number }
  | { mode: 'create'; startWorld: Point; kind: ShapeKind; id: string; moved: boolean }
  | { mode: 'connect'; source: EdgeEndpoint; from: Point }
  | { mode: 'reconnect'; edgeId: string; which: 'source' | 'target'; anchor: Point }
  | { mode: 'pen'; points: Point[] }
  | { mode: 'erase'; erased: Set<string> };

/** Callbacks the Canvas provides to render live overlays. */
export interface InteractionOverlays {
  setMarquee: (rect: Rect | null) => void;
  setConnectPreview: (preview: ConnectPreview | null) => void;
  setGuides: (guides: SmartGuide[]) => void;
  setPenPreview: (points: Point[] | null) => void;
  setConnectTargetId: (shapeId: string | null) => void;
  readOnly?: boolean;
}

/** Public API returned to the Canvas component. */
export interface CanvasInteractions {
  onSvgPointerDown: (event: React.PointerEvent) => void;
  onShapePointerDown: (event: React.PointerEvent, shapeId: string) => void;
  onEdgePointerDown: (event: React.PointerEvent, edgeId: string) => void;
  onResizeHandleDown: (event: React.PointerEvent, handle: ResizeHandle, shapeId: string) => void;
  onRotateHandleDown: (event: React.PointerEvent, shapeId: string) => void;
  onAnchorDown: (event: React.PointerEvent, shapeId: string, anchor: string) => void;
  onEndpointDown: (event: React.PointerEvent, edgeId: string, which: 'source' | 'target') => void;
}

/** Axis-aligned bounds of a shape. */
function shapeRect(shape: Shape): Rect {
  return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
}

/**
 * Wire canvas pointer interactions. `svgRef` converts client coordinates into
 * world coordinates; overlays render the live marquee and connector preview.
 */
export function useCanvasInteractions(
  svgRef: RefObject<SVGSVGElement | null>,
  overlays: InteractionOverlays,
): CanvasInteractions {
  const { setMarquee, setConnectPreview, setGuides, setPenPreview, setConnectTargetId, readOnly = false } = overlays;
  const interaction = useRef<Interaction>({ mode: 'idle' });
  const listening = useRef(false);
  const history = useHistory();

  const clientToWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      const camera = useEditorStore.getState().camera;
      return screenToWorld(
        { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) },
        camera,
      );
    },
    [svgRef],
  );

  const maybeSnap = useCallback((value: number): number => {
    const { settings } = useProjectStore.getState().project;
    return settings.snapToGrid ? snapToStep(value, settings.gridSize) : value;
  }, []);

  /** Turn a freehand world-space stroke into a normalized `freehand` shape. */
  const finalizePen = useCallback(
    (points: Point[]): void => {
      if (points.length < 2) return;
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const width = Math.max(Math.max(...xs) - minX, 1);
      const height = Math.max(Math.max(...ys) - minY, 1);
      const normalized = points.map((p) => ({
        x: (p.x - minX) / width,
        y: (p.y - minY) / height,
      }));
      const project = useProjectStore.getState();
      const page = project.activePage();
      const shape = createShape(
        {
          kind: 'freehand',
          x: minX,
          y: minY,
          width,
          height,
          points: normalized,
          fill: { type: 'none', color: 'none' },
          stroke: '#1f2430',
          strokeWidth: 2,
        },
        page.layers[0]!.id,
      );
      history.run('Draw', () => {
        project.addShape(shape);
        useEditorStore.getState().select([shape.id]);
      });
    },
    [history],
  );

  const moveLogicRef = useRef<(event: PointerEvent) => void>(() => {});
  const upLogicRef = useRef<() => void>(() => {});
  const windowMove = useRef((event: PointerEvent) => moveLogicRef.current(event));
  const windowUp = useRef(() => upLogicRef.current());

  const startListening = useCallback((): void => {
    if (listening.current) return;
    window.addEventListener('pointermove', windowMove.current);
    window.addEventListener('pointerup', windowUp.current);
    listening.current = true;
  }, []);

  const stopListening = useCallback((): void => {
    if (!listening.current) return;
    window.removeEventListener('pointermove', windowMove.current);
    window.removeEventListener('pointerup', windowUp.current);
    listening.current = false;
  }, []);

  moveLogicRef.current = (event: PointerEvent): void => {
    const state = interaction.current;
    const editor = useEditorStore.getState();
    const project = useProjectStore.getState();

    if (state.mode === 'pan') {
      editor.setCamera({
        ...editor.camera,
        x: state.startCamera.x + (event.clientX - state.startClient.x),
        y: state.startCamera.y + (event.clientY - state.startClient.y),
      });
      return;
    }

    const world = clientToWorld(event.clientX, event.clientY);
    switch (state.mode) {
      case 'marquee': {
        state.current = rectFromPoints(state.startWorld, world);
        setMarquee(state.current);
        break;
      }
      case 'move': {
        const dx = world.x - state.startWorld.x;
        const dy = world.y - state.startWorld.y;
        const page = project.activePage();
        const patches: Record<string, Partial<Shape>> = {};
        for (const [id, origin] of Object.entries(state.origins)) {
          patches[id] = { x: maybeSnap(origin.x + dx), y: maybeSnap(origin.y + dy) };
        }

        const settings = project.project.settings;
        if (settings.snapToObjects) {
          const movingRects: Rect[] = [];
          const movingIds = new Set(Object.keys(state.origins));
          for (const [id, patch] of Object.entries(patches)) {
            const s = page.shapes[id];
            if (s) movingRects.push({ x: patch.x!, y: patch.y!, width: s.width, height: s.height });
          }
          const movingBox = boundingBox(movingRects);
          const statics: Rect[] = Object.values(page.shapes)
            .filter((s) => !s.hidden && !movingIds.has(s.id))
            .map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }));
          if (movingBox) {
            const zoom = useEditorStore.getState().camera.zoom;
            const snap = computeSnap(movingBox, statics, 6 / zoom);
            if (snap.dx || snap.dy) {
              for (const patch of Object.values(patches)) {
                patch.x = (patch.x ?? 0) + snap.dx;
                patch.y = (patch.y ?? 0) + snap.dy;
              }
            }
            setGuides(snap.guides);
          }
        }

        project.updateShapes(patches);
        state.moved = true;
        break;
      }
      case 'resize':
        project.updateShape(state.id, resizeRect(state.original, state.handle, world, maybeSnap));
        break;
      case 'rotate': {
        const angle = Math.atan2(world.y - state.center.y, world.x - state.center.x);
        const deg = state.original + (angle - state.startAngle) * (180 / Math.PI);
        project.updateShape(state.id, { rotation: Math.round(deg) });
        break;
      }
      case 'create': {
        const r = rectFromPoints(state.startWorld, world);
        project.updateShape(state.id, {
          x: r.x,
          y: r.y,
          width: Math.max(r.width, 1),
          height: Math.max(r.height, 1),
        });
        state.moved = true;
        break;
      }
      case 'connect':
        setConnectPreview({ from: state.from, to: world });
        {
          const exclude = state.source.shapeId ? new Set([state.source.shapeId]) : undefined;
          const hit = hitTestShape(project.activePage(), world, exclude);
          setConnectTargetId(hit?.id ?? null);
        }
        break;
      case 'reconnect':
        setConnectPreview({ from: state.anchor, to: world });
        {
          const edge = project.activePage().edges[state.edgeId];
          const otherId = state.which === 'source' ? edge?.target.shapeId : edge?.source.shapeId;
          const exclude = otherId ? new Set([otherId]) : undefined;
          const hit = hitTestShape(project.activePage(), world, exclude);
          setConnectTargetId(hit?.id ?? null);
        }
        break;
      case 'pen': {
        state.points.push(world);
        setPenPreview([...state.points]);
        break;
      }
      case 'erase': {
        const hit = hitTestShape(project.activePage(), world, state.erased);
        if (hit) {
          state.erased.add(hit.id);
          project.removeElements([hit.id]);
        }
        break;
      }
    }
  };

  upLogicRef.current = (): void => {
    const state = interaction.current;
    const editor = useEditorStore.getState();
    const project = useProjectStore.getState();
    const page = project.activePage();

    switch (state.mode) {
      case 'marquee': {
        const hits = Object.values(page.shapes)
          .filter((s) => !s.hidden && rectsIntersect(state.current, shapeRect(s)))
          .map((s) => s.id);
        editor.select(hits);
        break;
      }
      case 'move':
        if (state.moved) history.commit('Move');
        else history.cancel();
        break;
      case 'resize':
        history.commit('Resize');
        break;
      case 'rotate':
        history.commit('Rotate');
        break;
      case 'create': {
        const shape = page.shapes[state.id];
        if (shape && !state.moved) {
          project.updateShape(state.id, { width: 120, height: shape.kind === 'text' ? 40 : 80 });
        }
        editor.select([state.id]);
        editor.setTool('select');
        history.commit('Create');
        break;
      }
      case 'connect': {
        const world = lastPointer.current;
        const target = resolveEndpointAt(world, state.source.shapeId);
        if (world && isDistinct(state.source, target)) {
          const edge = createEdge(
            { source: state.source, target },
            page.layers[0]!.id,
          );
          history.run('Create connector', () => project.addEdge(edge));
          editor.setTool('select');
          editor.select([edge.id]);
        }
        setConnectPreview(null);
        setConnectTargetId(null);
        break;
      }
      case 'reconnect': {
        const world = lastPointer.current;
        const edge = page.edges[state.edgeId];
        if (edge && world) {
          const otherId = state.which === 'source' ? edge.target.shapeId : edge.source.shapeId;
          const target = resolveEndpointAt(world, otherId);
          history.run('Reconnect', () => project.updateEdge(state.edgeId, { [state.which]: target }));
        }
        setConnectPreview(null);
        setConnectTargetId(null);
        break;
      }
      case 'pen': {
        finalizePen(state.points);
        setPenPreview(null);
        break;
      }
      case 'erase': {
        if (state.erased.size > 0) history.commit('Erase');
        else history.cancel();
        break;
      }
    }

    interaction.current = { mode: 'idle' };
    setMarquee(null);
    setGuides([]);
    stopListening();
  };

  // Track the last pointer position in world space for pointerup resolution.
  const lastPointer = useRef<Point | null>(null);
  const trackedMove = useRef((event: PointerEvent) => {
    lastPointer.current = clientToWorldRef.current(event.clientX, event.clientY);
    moveLogicRef.current(event);
  });
  const clientToWorldRef = useRef(clientToWorld);
  clientToWorldRef.current = clientToWorld;
  windowMove.current = trackedMove.current;

  /** Resolve a drop point to a shape endpoint (nearest anchor) or floating point. */
  const resolveEndpointAt = useCallback(
    (world: Point | null, excludeShapeId?: string): EdgeEndpoint => {
      if (!world) return { point: { x: 0, y: 0 } };
      const page = useProjectStore.getState().activePage();
      const exclude = excludeShapeId ? new Set([excludeShapeId]) : undefined;
      const shape = hitTestShape(page, world, exclude);
      if (shape) return { shapeId: shape.id, anchor: nearestAnchor(shape, world).name };
      return { point: world };
    },
    [],
  );

  const onSvgPointerDown = useCallback(
    (event: React.PointerEvent) => {
      const editor = useEditorStore.getState();
      const project = useProjectStore.getState();
      const world = clientToWorld(event.clientX, event.clientY);
      lastPointer.current = world;

      if (readOnly) {
        interaction.current = {
          mode: 'pan',
          startClient: { x: event.clientX, y: event.clientY },
          startCamera: { x: editor.camera.x, y: editor.camera.y },
        };
        startListening();
        return;
      }

      if (editor.tool === 'pan' || event.button === 1) {
        interaction.current = {
          mode: 'pan',
          startClient: { x: event.clientX, y: event.clientY },
          startCamera: { x: editor.camera.x, y: editor.camera.y },
        };
        startListening();
        return;
      }

      const createKind = CREATE_TOOLS[editor.tool];
      if (createKind) {
        const page = project.activePage();
        const layerId = page.layers[0]!.id;
        const index = Object.keys(page.shapes).length;
        const shape = createShape(
          {
            kind: createKind,
            x: world.x,
            y: world.y,
            width: 1,
            height: 1,
            text: createKind === 'sticky-note' ? 'Note' : createKind === 'comment' ? 'Comment' : '',
            ...(createKind === 'comment'
              ? { fill: { type: 'solid' as const, color: '#fef9c3' }, stroke: '#ca8a04' }
              : {}),
          },
          layerId,
          index,
        );
        history.begin();
        project.addShape(shape);
        interaction.current = {
          mode: 'create',
          startWorld: world,
          kind: createKind,
          id: shape.id,
          moved: false,
        };
        startListening();
        return;
      }

      if (editor.tool === 'connector') {
        // Start a floating connector from empty space.
        interaction.current = { mode: 'connect', source: { point: world }, from: world };
        setConnectPreview({ from: world, to: world });
        startListening();
        return;
      }

      if (editor.tool === 'pen') {
        interaction.current = { mode: 'pen', points: [world] };
        setPenPreview([world]);
        startListening();
        return;
      }

      if (editor.tool === 'eraser') {
        const erased = new Set<string>();
        const hit = hitTestShape(project.activePage(), world);
        history.begin();
        if (hit) {
          erased.add(hit.id);
          project.removeElements([hit.id]);
        }
        interaction.current = { mode: 'erase', erased };
        startListening();
        return;
      }

      editor.clearSelection();
      const start = { x: world.x, y: world.y, width: 0, height: 0 };
      interaction.current = { mode: 'marquee', startWorld: world, current: start };
      setMarquee(start);
      startListening();
    },
    [clientToWorld, history, readOnly, setConnectPreview, setMarquee, setPenPreview, startListening],
  );

  const onShapePointerDown = useCallback(
    (event: React.PointerEvent, shapeId: string) => {
      event.stopPropagation();
      const editor = useEditorStore.getState();
      const project = useProjectStore.getState();
      const page = project.activePage();
      const shape = page.shapes[shapeId];
      if (!shape) return;

      lastPointer.current = clientToWorld(event.clientX, event.clientY);

      if ((event.metaKey || event.ctrlKey) && shape.hyperlink?.trim()) {
        openHyperlink(shape.hyperlink);
        return;
      }

      if (readOnly) return;

      if (editor.formatPainterActive && editor.formatPainterStyle) {
        const targetId = topAncestor(page, shapeId);
        applyFormatToShapes([targetId]);
        return;
      }

      // Eraser: delete the shape under the pointer and keep erasing on drag.
      if (editor.tool === 'eraser') {
        const erased = new Set<string>([topAncestor(page, shapeId)]);
        history.begin();
        project.removeElements([...erased]);
        interaction.current = { mode: 'erase', erased };
        startListening();
        return;
      }

      // Pen draws over everything, including shapes.
      if (editor.tool === 'pen') {
        const world = lastPointer.current;
        interaction.current = { mode: 'pen', points: [world] };
        setPenPreview([world]);
        startListening();
        return;
      }

      // With the connector tool, dragging from a shape starts an edge.
      if (editor.tool === 'connector') {
        const world = lastPointer.current;
        const near = nearestAnchor(shape, world);
        interaction.current = {
          mode: 'connect',
          source: { shapeId, anchor: near.name },
          from: near.point,
        };
        setConnectPreview({ from: near.point, to: world });
        startListening();
        return;
      }

      if (editor.tool !== 'select' || isShapeLocked(layerMap(page), shape)) return;

      // Clicking a grouped child selects/moves the outermost group instead.
      const targetId = topAncestor(page, shapeId);

      let selected = editor.selectedIds;
      if (event.shiftKey) {
        editor.toggleSelection(targetId);
        selected = useEditorStore.getState().selectedIds;
      } else if (!selected.includes(targetId)) {
        editor.select([targetId]);
        selected = [targetId];
      }

      const world = lastPointer.current;
      const origins = collectMovable(page, selected);
      interaction.current = { mode: 'move', startWorld: world, origins, moved: false };
      history.begin();
      startListening();
    },
    [clientToWorld, history, readOnly, setConnectPreview, setPenPreview, startListening],
  );

  const onEdgePointerDown = useCallback((event: React.PointerEvent, edgeId: string) => {
    event.stopPropagation();
    const editor = useEditorStore.getState();
    if (editor.tool !== 'select') return;
    if (event.shiftKey) editor.toggleSelection(edgeId);
    else editor.select([edgeId]);
  }, []);

  const onResizeHandleDown = useCallback(
    (event: React.PointerEvent, handle: ResizeHandle, shapeId: string) => {
      event.stopPropagation();
      const shape = useProjectStore.getState().activePage().shapes[shapeId];
      if (!shape) return;
      interaction.current = { mode: 'resize', handle, original: shapeRect(shape), id: shapeId };
      history.begin();
      startListening();
    },
    [history, startListening],
  );

  const onRotateHandleDown = useCallback(
    (event: React.PointerEvent, shapeId: string) => {
      event.stopPropagation();
      const shape = useProjectStore.getState().activePage().shapes[shapeId];
      if (!shape) return;
      const center = { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
      const world = clientToWorld(event.clientX, event.clientY);
      interaction.current = {
        mode: 'rotate',
        center,
        id: shapeId,
        startAngle: Math.atan2(world.y - center.y, world.x - center.x),
        original: shape.rotation,
      };
      history.begin();
      startListening();
    },
    [clientToWorld, history, startListening],
  );

  const onAnchorDown = useCallback(
    (event: React.PointerEvent, shapeId: string, anchor: string) => {
      event.stopPropagation();
      const shape = useProjectStore.getState().activePage().shapes[shapeId];
      if (!shape) return;
      const from = anchorPoint(shape, anchor);
      lastPointer.current = clientToWorld(event.clientX, event.clientY);
      interaction.current = { mode: 'connect', source: { shapeId, anchor }, from };
      setConnectPreview({ from, to: lastPointer.current });
      startListening();
    },
    [clientToWorld, setConnectPreview, startListening],
  );

  const onEndpointDown = useCallback(
    (event: React.PointerEvent, edgeId: string, which: 'source' | 'target') => {
      event.stopPropagation();
      const page = useProjectStore.getState().activePage();
      const edge = page.edges[edgeId];
      if (!edge) return;
      const other = which === 'source' ? edge.target : edge.source;
      const anchor =
        other.shapeId && page.shapes[other.shapeId]
          ? anchorPoint(page.shapes[other.shapeId]!, other.anchor)
          : (other.point ?? { x: 0, y: 0 });
      interaction.current = { mode: 'reconnect', edgeId, which, anchor };
      lastPointer.current = clientToWorld(event.clientX, event.clientY);
      setConnectPreview({ from: anchor, to: lastPointer.current });
      startListening();
    },
    [clientToWorld, setConnectPreview, startListening],
  );

  return {
    onSvgPointerDown,
    onShapePointerDown,
    onEdgePointerDown,
    onResizeHandleDown,
    onRotateHandleDown,
    onAnchorDown,
    onEndpointDown,
  };
}

/** True when the two endpoints refer to different shapes/points. */
function isDistinct(source: EdgeEndpoint, target: EdgeEndpoint): boolean {
  if (source.shapeId && target.shapeId) return source.shapeId !== target.shapeId;
  return true;
}
