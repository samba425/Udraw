/**
 * Ephemeral editor state: camera, active tool, selection, and UI toggles.
 * This state is not part of the persisted document.
 * @module state/editorStore
 */
import { create } from 'zustand';
import type { Camera, Point, Rect, Size, ThemeMode, ToolId } from '@/types';
import type { ShapeStylePatch } from '@/engine/commands/formatPainter';
import type { SourceFormat } from '@/services/sourceEditor';
import { clamp, worldToScreen } from '@/utils/geometry';
import { editorBus } from '@/utils/eventBus';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

interface EditorState {
  camera: Camera;
  tool: ToolId;
  selectedIds: string[];
  editingTextId: string | null;
  themeMode: ThemeMode;
  sidebarOpen: boolean;
  propertyPanelOpen: boolean;
  layersPanelOpen: boolean;
  minimapOpen: boolean;
  searchOpen: boolean;
  shortcutsOpen: boolean;
  templatesOpen: boolean;
  welcomeOpen: boolean;
  hoveredShapeId: string | null;
  connectTargetId: string | null;
  readOnly: boolean;
  presentationOpen: boolean;
  presentationIndex: number;
  presentationFlowActive: boolean;
  presentationFlowStep: number;
  presentationFlowPath: string[];
  formatPainterActive: boolean;
  formatPainterStyle: ShapeStylePatch | null;
  viewMode: 'canvas' | 'source' | 'split';
  sourceFormat: SourceFormat;
  /** When set, clicks select shapes inside this group instead of the container. */
  activeGroupId: string | null;

  setTool: (tool: ToolId) => void;
  setCamera: (camera: Camera) => void;
  panBy: (dx: number, dy: number) => void;
  /** Zoom by a delta factor keeping `screenPivot` stationary on screen. */
  zoomBy: (factor: number, screenPivot: Point) => void;
  setZoom: (zoom: number, screenPivot: Point) => void;
  /** Fit the given world-space bounds within the viewport. */
  fitToBounds: (bounds: Rect, viewport: Size, padding?: number) => void;
  /** Center the camera on a world-space point at the current zoom. */
  centerOn: (point: Point, viewport: Size) => void;

  select: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;

  setEditingText: (id: string | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleSidebar: () => void;
  togglePropertyPanel: () => void;
  toggleLayersPanel: () => void;
  toggleMinimap: () => void;
  setSearchOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setTemplatesOpen: (open: boolean) => void;
  setWelcomeOpen: (open: boolean) => void;
  setHoveredShapeId: (id: string | null) => void;
  setConnectTargetId: (id: string | null) => void;
  setReadOnly: (readOnly: boolean) => void;
  setPresentationOpen: (open: boolean) => void;
  setPresentationIndex: (index: number) => void;
  setPresentationFlowActive: (active: boolean) => void;
  setPresentationFlowStep: (step: number) => void;
  setPresentationFlowPath: (path: string[]) => void;
  setFormatPainterActive: (active: boolean) => void;
  setFormatPainterStyle: (style: ShapeStylePatch | null) => void;
  setViewMode: (mode: 'canvas' | 'source' | 'split') => void;
  setSourceFormat: (format: SourceFormat) => void;
  setActiveGroupId: (groupId: string | null) => void;
}

/** Zustand store for ephemeral editor/UI state. */
export const useEditorStore = create<EditorState>((set, get) => ({
  camera: { x: 0, y: 0, zoom: 1 },
  tool: 'select',
  selectedIds: [],
  editingTextId: null,
  themeMode: 'system',
  sidebarOpen: true,
  propertyPanelOpen: true,
  layersPanelOpen: false,
  minimapOpen: true,
  searchOpen: false,
  shortcutsOpen: false,
  templatesOpen: false,
  welcomeOpen: false,
  hoveredShapeId: null,
  connectTargetId: null,
  readOnly: false,
  presentationOpen: false,
  presentationIndex: 0,
  presentationFlowActive: false,
  presentationFlowStep: 0,
  presentationFlowPath: [],
  formatPainterActive: false,
  formatPainterStyle: null,
  viewMode: 'canvas',
  sourceFormat: 'json',
  activeGroupId: null,

  setTool: (tool) => set({ tool }),
  setCamera: (camera) => set({ camera }),
  panBy: (dx, dy) =>
    set((s) => ({ camera: { ...s.camera, x: s.camera.x + dx, y: s.camera.y + dy } })),

  zoomBy: (factor, screenPivot) => {
    const { camera } = get();
    const nextZoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    applyZoom(set, camera, nextZoom, screenPivot);
  },
  setZoom: (zoom, screenPivot) => {
    const { camera } = get();
    const nextZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    applyZoom(set, camera, nextZoom, screenPivot);
  },

  fitToBounds: (bounds, viewport, padding = 60) => {
    if (bounds.width <= 0 || bounds.height <= 0) {
      set({ camera: { x: viewport.width / 2 - bounds.x, y: viewport.height / 2 - bounds.y, zoom: 1 } });
      return;
    }
    const zoom = clamp(
      Math.min(
        (viewport.width - padding * 2) / bounds.width,
        (viewport.height - padding * 2) / bounds.height,
      ),
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const cx = bounds.x + bounds.width / 2;
    const cy = bounds.y + bounds.height / 2;
    set({ camera: { zoom, x: viewport.width / 2 - cx * zoom, y: viewport.height / 2 - cy * zoom } });
  },

  centerOn: (point, viewport) => {
    const { camera } = get();
    set({
      camera: {
        ...camera,
        x: viewport.width / 2 - point.x * camera.zoom,
        y: viewport.height / 2 - point.y * camera.zoom,
      },
    });
  },

  select: (ids) => {
    set({ selectedIds: ids });
    editorBus.emit('selection:changed', { ids });
  },
  addToSelection: (id) => {
    const ids = get().selectedIds.includes(id)
      ? get().selectedIds
      : [...get().selectedIds, id];
    set({ selectedIds: ids });
    editorBus.emit('selection:changed', { ids });
  },
  toggleSelection: (id) => {
    const current = get().selectedIds;
    const ids = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    set({ selectedIds: ids });
    editorBus.emit('selection:changed', { ids });
  },
  clearSelection: () => {
    if (get().selectedIds.length === 0) return;
    set({ selectedIds: [] });
    editorBus.emit('selection:changed', { ids: [] });
  },

  setEditingText: (id) => set({ editingTextId: id }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  togglePropertyPanel: () => set((s) => ({ propertyPanelOpen: !s.propertyPanelOpen })),
  toggleLayersPanel: () => set((s) => ({ layersPanelOpen: !s.layersPanelOpen })),
  toggleMinimap: () => set((s) => ({ minimapOpen: !s.minimapOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setTemplatesOpen: (open) => set({ templatesOpen: open }),
  setWelcomeOpen: (open) => set({ welcomeOpen: open }),
  setHoveredShapeId: (id) => set({ hoveredShapeId: id }),
  setConnectTargetId: (id) => set({ connectTargetId: id }),
  setReadOnly: (readOnly) => set({ readOnly }),
  setPresentationOpen: (open) =>
    set(
      open
        ? { presentationOpen: true }
        : { presentationOpen: false, presentationFlowActive: false, presentationFlowStep: 0, presentationFlowPath: [] },
    ),
  setPresentationIndex: (index) => set({ presentationIndex: index }),
  setPresentationFlowActive: (active) => set({ presentationFlowActive: active, presentationFlowStep: 0 }),
  setPresentationFlowStep: (step) => set({ presentationFlowStep: step }),
  setPresentationFlowPath: (path) => set({ presentationFlowPath: path }),
  setFormatPainterActive: (active) => set({ formatPainterActive: active }),
  setFormatPainterStyle: (style) => set({ formatPainterStyle: style }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSourceFormat: (format) => set({ sourceFormat: format }),
  setActiveGroupId: (groupId) => set({ activeGroupId: groupId }),
}));

/** Recompute the camera so a zoom keeps the pivot point fixed on screen. */
function applyZoom(
  set: (partial: Partial<EditorState>) => void,
  camera: Camera,
  nextZoom: number,
  screenPivot: Point,
): void {
  const worldPivot = {
    x: (screenPivot.x - camera.x) / camera.zoom,
    y: (screenPivot.y - camera.y) / camera.zoom,
  };
  const nextScreen = worldToScreen(worldPivot, { ...camera, zoom: nextZoom });
  set({
    camera: {
      zoom: nextZoom,
      x: camera.x + (screenPivot.x - nextScreen.x),
      y: camera.y + (screenPivot.y - nextScreen.y),
    },
  });
}
