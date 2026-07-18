/**
 * Project, page, and layer domain models plus the serializable file format.
 * @module types/project
 */
import type { Edge } from './edge';
import type { Shape } from './shape';

/** Current on-disk/serialized schema version. */
export const FILE_FORMAT_VERSION = 1;

/** A layer groups shapes/edges and controls visibility and locking. */
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  /** Parent layer id for nested layers, if any. */
  parentId?: string;
  /** Ordering index within its parent; lower renders first (behind). */
  order: number;
}

/** A page is an independent canvas with its own shapes, edges, and layers. */
export interface Page {
  id: string;
  name: string;
  shapes: Record<string, Shape>;
  edges: Record<string, Edge>;
  layers: Layer[];
  /** Draw order of shape/edge ids (z-index, lower is behind). */
  order: string[];
  background: string;
}

/** Persisted binary/image asset referenced by shapes. */
export interface Asset {
  id: string;
  name: string;
  mimeType: string;
  /** Data URL for the asset payload. */
  dataUrl: string;
}

/** Editor-wide settings persisted with the project. */
export interface ProjectSettings {
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
}

/** Default project settings. */
export const DEFAULT_SETTINGS: ProjectSettings = {
  gridSize: 20,
  showGrid: true,
  snapToGrid: true,
  snapToObjects: true,
};

/** The full serializable project document. */
export interface Project {
  version: number;
  id: string;
  name: string;
  pages: Page[];
  assets: Asset[];
  settings: ProjectSettings;
  theme: string;
  createdAt: number;
  updatedAt: number;
}
