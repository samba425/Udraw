/**
 * Builders for compact, brand-colored library icons. Icons are authored
 * against a 48x48 view box. These helpers keep the individual library files
 * short and consistent (DRY).
 * @module shapes/libraries/builders
 */
import type { LibraryIcon } from '@/shapes/registry';
import type { ShapeKind } from '@/types';

/** Standard view size all library icons are authored against. */
export const VIEW = 48;

interface TileOptions {
  id: string;
  label: string;
  category: string;
  bg: string;
  /** Inner SVG markup drawn on top of the tile (white glyph, etc.). */
  glyph: string;
  keywords?: string[];
  size?: { width: number; height: number };
}

/**
 * A rounded brand-colored tile with a white glyph — the common shape for
 * cloud/service icons (AWS/Azure/K8s style).
 */
export function tile({ id, label, category, bg, glyph, keywords, size }: TileOptions): LibraryIcon {
  return {
    id,
    label,
    category,
    viewSize: VIEW,
    body: `<rect x="1" y="1" width="46" height="46" rx="8" fill="${bg}"/>${glyph}`,
    keywords: keywords ?? [label.toLowerCase()],
    defaultSize: size ?? { width: 72, height: 72 },
  };
}

/** A free-form icon (no tile background) authored directly as SVG markup. */
export function glyphIcon(
  id: string,
  label: string,
  category: string,
  body: string,
  opts: {
    keywords?: string[];
    size?: { width: number; height: number };
    shapeKind?: ShapeKind;
    defaultText?: string;
    defaultFill?: string;
    defaultStroke?: string;
  } = {},
): LibraryIcon {
  return {
    id,
    label,
    category,
    viewSize: VIEW,
    body,
    keywords: opts.keywords ?? [label.toLowerCase()],
    defaultSize: opts.size ?? { width: 96, height: 72 },
    shapeKind: opts.shapeKind,
    defaultText: opts.defaultText,
    defaultFill: opts.defaultFill,
    defaultStroke: opts.defaultStroke,
  };
}
