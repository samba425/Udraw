/**
 * Helpers for layer resolution, including nested (parent) layers. A shape is
 * only visible/editable when all of its layer's ancestors are too.
 * @module models/layers
 */
import type { Layer, Page, Shape } from '@/types';

/** Build a quick id -> layer lookup for a page. */
export function layerMap(page: Page): Map<string, Layer> {
  return new Map(page.layers.map((l) => [l.id, l]));
}

/** Walk a layer and its ancestors, returning true if all are visible. */
export function isLayerVisible(map: Map<string, Layer>, layerId: string): boolean {
  let current = map.get(layerId);
  while (current) {
    if (!current.visible) return false;
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return true;
}

/** Walk a layer and its ancestors, returning true if any is locked. */
export function isLayerLocked(map: Map<string, Layer>, layerId: string): boolean {
  let current = map.get(layerId);
  while (current) {
    if (current.locked) return true;
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return false;
}

/** A shape is effectively hidden if it or its layer chain is hidden. */
export function isShapeVisible(map: Map<string, Layer>, shape: Shape): boolean {
  return !shape.hidden && isLayerVisible(map, shape.layerId);
}

/** A shape is effectively locked if it or its layer chain is locked. */
export function isShapeLocked(map: Map<string, Layer>, shape: Shape): boolean {
  return shape.locked || isLayerLocked(map, shape.layerId);
}
