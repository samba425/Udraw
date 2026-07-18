/**
 * Barrel export for all domain types.
 * @module types
 */
export * from './geometry';
export * from './style';
export * from './shape';
export * from './edge';
export * from './project';

/** Editor tool identifiers used by the toolbar and canvas interactions. */
export type ToolId =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'rounded-rectangle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'text'
  | 'sticky-note'
  | 'comment'
  | 'connector'
  | 'pen'
  | 'eraser'
  | 'image';

/** Theme selection mode. */
export type ThemeMode = 'light' | 'dark' | 'system';
