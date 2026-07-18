/**
 * Central registry for library icon shapes. Shape libraries (AWS, Azure,
 * Cisco, Kubernetes, ...) register colored SVG icons here. Plugins can extend
 * the registry at runtime.
 * @module shapes/registry
 */
import type { ShapeKind } from '@/types';

/** A colored, self-contained SVG icon definition. */
export interface LibraryIcon {
  /** Fully-qualified id, e.g. `aws.ec2`. */
  id: string;
  /** Human-readable label shown in the sidebar. */
  label: string;
  /** Library/category key, e.g. `aws`. */
  category: string;
  /** The coordinate system size the `body` is authored against (square). */
  viewSize: number;
  /** Raw inner SVG markup (developer-authored, trusted). */
  body: string;
  /** Default keywords for search. */
  keywords?: string[];
  /** Default width/height when dropped on the canvas. */
  defaultSize?: { width: number; height: number };
  /**
   * When set, dropping this item creates a native editable shape of the given
   * kind (with `text` prefilled) instead of an `icon` shape. Used by the Basic
   * library so primitives remain fully style-editable.
   */
  shapeKind?: ShapeKind;
  /** Optional default text for `shapeKind`-based drops. */
  defaultText?: string;
  /** Optional default fill applied to `shapeKind`-based drops. */
  defaultFill?: string;
  /** Optional default stroke applied to `shapeKind`-based drops. */
  defaultStroke?: string;
}

const registry = new Map<string, LibraryIcon>();

/** Register one icon (idempotent by id). */
export function registerIcon(icon: LibraryIcon): void {
  registry.set(icon.id, icon);
}

/** Register many icons at once. */
export function registerIcons(icons: LibraryIcon[]): void {
  for (const icon of icons) registry.set(icon.id, icon);
}

/** Look up an icon by id. */
export function getLibraryIcon(id: string): LibraryIcon | undefined {
  return registry.get(id);
}

/** All registered icons. */
export function allIcons(): LibraryIcon[] {
  return [...registry.values()];
}

/** Icons belonging to a category. */
export function iconsByCategory(category: string): LibraryIcon[] {
  return [...registry.values()].filter((i) => i.category === category);
}

/** Distinct categories currently registered. */
export function iconCategories(): string[] {
  return [...new Set([...registry.values()].map((i) => i.category))];
}
