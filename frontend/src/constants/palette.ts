/**
 * Color palettes used across the editor. All shapes ship in color by default.
 * @module constants/palette
 */

/** A named color swatch pairing a fill with a readable stroke. */
export interface Swatch {
  name: string;
  fill: string;
  stroke: string;
  text: string;
}

/**
 * Vibrant default swatches applied when shapes are created so the canvas is
 * colorful out of the box (per product requirement: "shapes all in color").
 */
export const SHAPE_SWATCHES: Swatch[] = [
  { name: 'Indigo', fill: '#e0e7ff', stroke: '#6366f1', text: '#312e81' },
  { name: 'Emerald', fill: '#d1fae5', stroke: '#10b981', text: '#065f46' },
  { name: 'Amber', fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
  { name: 'Rose', fill: '#ffe4e6', stroke: '#f43f5e', text: '#9f1239' },
  { name: 'Sky', fill: '#e0f2fe', stroke: '#0ea5e9', text: '#075985' },
  { name: 'Violet', fill: '#ede9fe', stroke: '#8b5cf6', text: '#5b21b6' },
  { name: 'Teal', fill: '#ccfbf1', stroke: '#14b8a6', text: '#115e59' },
  { name: 'Orange', fill: '#ffedd5', stroke: '#f97316', text: '#9a3412' },
  { name: 'Slate', fill: '#f1f5f9', stroke: '#64748b', text: '#1e293b' },
];

/** Broad color grid used by the property panel color pickers. */
export const COLOR_GRID: string[] = [
  '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#475569', '#1e293b', '#0f172a', '#000000',
  '#fee2e2', '#fecaca', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d', '#450a0a',
  '#ffedd5', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
  '#fef9c3', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
  '#dcfce7', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#cffafe', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
  '#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
  '#e0e7ff', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
  '#f3e8ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
  '#fce7f3', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
];

/** Deterministically pick a swatch for a new shape index. */
export function swatchForIndex(index: number): Swatch {
  return SHAPE_SWATCHES[index % SHAPE_SWATCHES.length]!;
}
