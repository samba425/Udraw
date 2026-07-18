/**
 * Factory helpers that build fully-defaulted domain objects. Centralizing
 * construction keeps the store and commands free of duplicated defaults (DRY).
 * @module models/factory
 */
import { nanoid } from 'nanoid';
import {
  DEFAULT_SETTINGS,
  DEFAULT_SHADOW,
  DEFAULT_TYPOGRAPHY,
  FILE_FORMAT_VERSION,
  type Edge,
  type EdgeInit,
  type Layer,
  type Page,
  type Project,
  type Shape,
  type ShapeInit,
} from '@/types';
import { SHAPE_SWATCHES } from '@/constants/palette';

/** Generate a short unique id. */
export function createId(prefix = 'id'): string {
  return `${prefix}_${nanoid(10)}`;
}

/** Build a default layer. */
export function createLayer(name = 'Layer 1', order = 0): Layer {
  return { id: createId('layer'), name, visible: true, locked: false, order };
}

/**
 * Build a fully-defaulted shape from a partial init object. A colorful swatch
 * is applied so new shapes are never plain white.
 */
export function createShape(init: ShapeInit, layerId: string, colorIndex = 0): Shape {
  const swatch = SHAPE_SWATCHES[colorIndex % SHAPE_SWATCHES.length]!;
  return {
    id: init.id ?? createId('shape'),
    kind: init.kind,
    libraryId: init.libraryId,
    x: init.x,
    y: init.y,
    width: init.width,
    height: init.height,
    rotation: init.rotation ?? 0,
    opacity: init.opacity ?? 1,
    fill: init.fill ?? { type: 'solid', color: swatch.fill },
    stroke: init.stroke ?? swatch.stroke,
    strokeWidth: init.strokeWidth ?? 2,
    dash: init.dash ?? 'solid',
    cornerRadius: init.cornerRadius ?? (init.kind === 'rounded-rectangle' ? 12 : 0),
    shadow: init.shadow ?? { ...DEFAULT_SHADOW },
    blur: init.blur ?? 0,
    text: init.text ?? '',
    typography: init.typography ?? { ...DEFAULT_TYPOGRAPHY, color: swatch.text },
    locked: init.locked ?? false,
    hidden: init.hidden ?? false,
    layerId: init.layerId ?? layerId,
    parentId: init.parentId,
    src: init.src,
    points: init.points,
    metadata: init.metadata ?? {},
  };
}

/** Build a fully-defaulted edge from a partial init object. */
export function createEdge(init: EdgeInit, layerId: string): Edge {
  return {
    id: init.id ?? createId('edge'),
    source: init.source,
    target: init.target,
    router: init.router ?? 'orthogonal',
    stroke: init.stroke ?? '#475569',
    strokeWidth: init.strokeWidth ?? 2,
    dash: init.dash ?? 'solid',
    animated: init.animated ?? false,
    startArrow: init.startArrow ?? 'none',
    endArrow: init.endArrow ?? 'triangle',
    label: init.label ?? '',
    opacity: init.opacity ?? 1,
    locked: init.locked ?? false,
    hidden: init.hidden ?? false,
    layerId: init.layerId ?? layerId,
    waypoints: init.waypoints ?? [],
  };
}

/** Build an empty page with a single default layer. */
export function createPage(name = 'Page 1'): Page {
  const layer = createLayer('Layer 1', 0);
  return {
    id: createId('page'),
    name,
    shapes: {},
    edges: {},
    layers: [layer],
    order: [],
    background: '#ffffff',
  };
}

/** Build a new, empty project document. */
export function createProject(name = 'Untitled Diagram'): Project {
  const now = Date.now();
  return {
    version: FILE_FORMAT_VERSION,
    id: createId('project'),
    name,
    pages: [createPage('Page 1')],
    assets: [],
    settings: { ...DEFAULT_SETTINGS },
    theme: 'system',
    createdAt: now,
    updatedAt: now,
  };
}
