/**
 * Visual styling types for shapes and connectors.
 * @module types/style
 */

/** Text horizontal alignment. */
export type TextAlign = 'left' | 'center' | 'right';

/** Text vertical alignment. */
export type VerticalAlign = 'top' | 'middle' | 'bottom';

/** Typography settings applied to a shape's label. */
export interface Typography {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  align: TextAlign;
  verticalAlign: VerticalAlign;
  lineHeight: number;
}

/** Optional drop-shadow configuration. */
export interface ShadowStyle {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

/** Line dash presets for strokes and connectors. */
export type DashStyle = 'solid' | 'dashed' | 'dotted';

/** Fill can be a solid color or a linear gradient between two stops. */
export interface FillStyle {
  type: 'solid' | 'gradient' | 'none';
  color: string;
  gradientColor?: string;
  /** Gradient angle in degrees, 0 == left-to-right. */
  gradientAngle?: number;
}

/** Default typography used when a shape is created. */
export const DEFAULT_TYPOGRAPHY: Typography = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#1f2430',
  align: 'center',
  verticalAlign: 'middle',
  lineHeight: 1.3,
};

/** Default (disabled) shadow. */
export const DEFAULT_SHADOW: ShadowStyle = {
  enabled: false,
  color: 'rgba(15,23,42,0.35)',
  blur: 8,
  offsetX: 2,
  offsetY: 3,
};
