/**
 * Helpers translating the style model into SVG attribute values.
 * @module engine/renderer/style
 */
import type { DashStyle, FillStyle } from '@/types';

/** Map a dash preset to an SVG `stroke-dasharray` value. */
export function dashArray(dash: DashStyle, strokeWidth: number): string | undefined {
  switch (dash) {
    case 'dashed':
      return `${strokeWidth * 3} ${strokeWidth * 2}`;
    case 'dotted':
      return `${strokeWidth} ${strokeWidth * 2}`;
    default:
      return undefined;
  }
}

/** Resolve the SVG `fill` attribute for a solid/none fill or gradient id. */
export function resolveFill(fill: FillStyle, gradientId: string): string {
  if (fill.type === 'none') return 'none';
  if (fill.type === 'gradient' && fill.gradientColor) return `url(#${gradientId})`;
  return fill.color;
}
