/**
 * The persisted document store: the project, its pages, and all mutations.
 * Mutations are intentionally granular so the history layer (Command pattern)
 * can compose and reverse them.
 * @module state/projectStore
 */
import { create } from 'zustand';
import type { Edge, Layer, Page, Project, Shape } from '@/types';
import { createLayer, createPage, createProject } from '@/models/factory';
import { editorBus } from '@/utils/eventBus';

interface ProjectState {
  project: Project;
  activePageId: string;

  /** Selector: the currently active page. */
  activePage: () => Page;

  replaceProject: (project: Project, activePageId?: string) => void;
  setActivePage: (pageId: string) => void;
  renameProject: (name: string) => void;

  addShape: (shape: Shape) => void;
  addShapes: (shapes: Shape[]) => void;
  updateShape: (id: string, patch: Partial<Shape>) => void;
  updateShapes: (patches: Record<string, Partial<Shape>>) => void;
  removeElements: (ids: string[]) => void;

  addEdge: (edge: Edge) => void;
  updateEdge: (id: string, patch: Partial<Edge>) => void;

  moveElementsBy: (ids: string[], dx: number, dy: number) => void;
  reorder: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;

  addPage: () => string;
  duplicatePage: (pageId: string) => string;
  removePage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;

  addLayer: (name?: string) => string;
  renameLayer: (layerId: string, name: string) => void;
  removeLayer: (layerId: string) => void;
  setLayerVisible: (layerId: string, visible: boolean) => void;
  setLayerLocked: (layerId: string, locked: boolean) => void;
  reorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  setShapeLayer: (shapeId: string, layerId: string) => void;
}

/** Apply an immutable update to the active page. */
function withActivePage(project: Project, activePageId: string, fn: (p: Page) => Page): Project {
  const pages = project.pages.map((p) => (p.id === activePageId ? fn(p) : p));
  return { ...project, pages, updatedAt: Date.now() };
}

/** Zustand store for the document. */
export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createProject(),
  activePageId: '',

  activePage: () => {
    const { project, activePageId } = get();
    return project.pages.find((p) => p.id === activePageId) ?? project.pages[0]!;
  },

  replaceProject: (project, activePageId) =>
    set({ project, activePageId: activePageId ?? project.pages[0]!.id }),

  setActivePage: (pageId) => set({ activePageId: pageId }),
  renameProject: (name) =>
    set((s) => ({ project: { ...s.project, name, updatedAt: Date.now() } })),

  addShape: (shape) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => ({
        ...p,
        shapes: { ...p.shapes, [shape.id]: shape },
        order: [...p.order, shape.id],
      })),
    })),

  addShapes: (shapes) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const next = { ...p.shapes };
        for (const shape of shapes) next[shape.id] = shape;
        return { ...p, shapes: next, order: [...p.order, ...shapes.map((sh) => sh.id)] };
      }),
    })),

  updateShape: (id, patch) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const shape = p.shapes[id];
        if (!shape) return p;
        return { ...p, shapes: { ...p.shapes, [id]: { ...shape, ...patch } } };
      }),
    })),

  updateShapes: (patches) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const next = { ...p.shapes };
        for (const [id, patch] of Object.entries(patches)) {
          const shape = next[id];
          if (shape) next[id] = { ...shape, ...patch };
        }
        return { ...p, shapes: next };
      }),
    })),

  removeElements: (ids) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const shapes = { ...p.shapes };
        const edges = { ...p.edges };
        const idSet = new Set(ids);
        for (const id of ids) {
          delete shapes[id];
          delete edges[id];
        }
        // Remove edges that referenced deleted shapes.
        for (const [edgeId, edge] of Object.entries(edges)) {
          if (
            (edge.source.shapeId && idSet.has(edge.source.shapeId)) ||
            (edge.target.shapeId && idSet.has(edge.target.shapeId))
          ) {
            delete edges[edgeId];
            idSet.add(edgeId);
          }
        }
        return {
          ...p,
          shapes,
          edges,
          order: p.order.filter((id) => !idSet.has(id)),
        };
      }),
    })),

  addEdge: (edge) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => ({
        ...p,
        edges: { ...p.edges, [edge.id]: edge },
        order: [...p.order, edge.id],
      })),
    })),

  updateEdge: (id, patch) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const edge = p.edges[id];
        if (!edge) return p;
        return { ...p, edges: { ...p.edges, [id]: { ...edge, ...patch } } };
      }),
    })),

  moveElementsBy: (ids, dx, dy) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const shapes = { ...p.shapes };
        for (const id of ids) {
          const shape = shapes[id];
          if (shape && !shape.locked) {
            shapes[id] = { ...shape, x: shape.x + dx, y: shape.y + dy };
          }
        }
        return { ...p, shapes };
      }),
    })),

  reorder: (id, direction) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const order = [...p.order];
        const index = order.indexOf(id);
        if (index === -1) return p;
        order.splice(index, 1);
        if (direction === 'front') order.push(id);
        else if (direction === 'back') order.unshift(id);
        else if (direction === 'forward') order.splice(Math.min(index + 1, order.length), 0, id);
        else order.splice(Math.max(index - 1, 0), 0, id);
        return { ...p, order };
      }),
    })),

  addPage: () => {
    const page = createPage(`Page ${get().project.pages.length + 1}`);
    set((s) => ({ project: { ...s.project, pages: [...s.project.pages, page] } }));
    editorBus.emit('project:changed', { reason: 'add-page' });
    return page.id;
  },

  duplicatePage: (pageId) => {
    const source = get().project.pages.find((p) => p.id === pageId);
    const clone = source
      ? { ...structuredClone(source), id: createPage().id, name: `${source.name} copy` }
      : createPage();
    set((s) => ({ project: { ...s.project, pages: [...s.project.pages, clone] } }));
    return clone.id;
  },

  removePage: (pageId) =>
    set((s) => {
      if (s.project.pages.length <= 1) return s;
      const pages = s.project.pages.filter((p) => p.id !== pageId);
      const activePageId = s.activePageId === pageId ? pages[0]!.id : s.activePageId;
      return { project: { ...s.project, pages }, activePageId };
    }),

  renamePage: (pageId, name) =>
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) => (p.id === pageId ? { ...p, name } : p)),
      },
    })),

  addLayer: (name) => {
    const layer: Layer = createLayer(
      name ?? `Layer ${get().activePage().layers.length + 1}`,
      get().activePage().layers.length,
    );
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => ({
        ...p,
        layers: [...p.layers, layer],
      })),
    }));
    return layer.id;
  },

  renameLayer: (layerId, name) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => ({
        ...p,
        layers: p.layers.map((l) => (l.id === layerId ? { ...l, name } : l)),
      })),
    })),

  removeLayer: (layerId) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        if (p.layers.length <= 1) return p;
        const fallback = p.layers.find((l) => l.id !== layerId)!;
        const shapes = { ...p.shapes };
        for (const [id, shape] of Object.entries(shapes)) {
          if (shape.layerId === layerId) shapes[id] = { ...shape, layerId: fallback.id };
        }
        return { ...p, layers: p.layers.filter((l) => l.id !== layerId), shapes };
      }),
    })),

  setLayerVisible: (layerId, visible) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => ({
        ...p,
        layers: p.layers.map((l) => (l.id === layerId ? { ...l, visible } : l)),
      })),
    })),

  setLayerLocked: (layerId, locked) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => ({
        ...p,
        layers: p.layers.map((l) => (l.id === layerId ? { ...l, locked } : l)),
      })),
    })),

  reorderLayer: (layerId, direction) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const layers = [...p.layers];
        const index = layers.findIndex((l) => l.id === layerId);
        const target = direction === 'up' ? index + 1 : index - 1;
        if (index === -1 || target < 0 || target >= layers.length) return p;
        [layers[index], layers[target]] = [layers[target]!, layers[index]!];
        return { ...p, layers: layers.map((l, i) => ({ ...l, order: i })) };
      }),
    })),

  setShapeLayer: (shapeId, layerId) =>
    set((s) => ({
      project: withActivePage(s.project, s.activePageId, (p) => {
        const shape = p.shapes[shapeId];
        if (!shape) return p;
        return { ...p, shapes: { ...p.shapes, [shapeId]: { ...shape, layerId } } };
      }),
    })),
}));

// Initialize the active page id from the initial project.
useProjectStore.setState((s) => ({ activePageId: s.project.pages[0]!.id }));
