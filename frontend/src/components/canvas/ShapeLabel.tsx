/**
 * Renders a shape's multi-line text label using SVG `foreignObject` so we get
 * native wrapping, alignment, and rich typography without manual layout math.
 * @module components/canvas/ShapeLabel
 */
import { memo } from 'react';
import type { Shape } from '@/types';

interface ShapeLabelProps {
  shape: Shape;
}

/** Render the shape label centered per its typography settings. */
export const ShapeLabel = memo(function ShapeLabel({
  shape,
}: ShapeLabelProps): React.JSX.Element {
  const t = shape.typography;
  const justify =
    t.align === 'left' ? 'flex-start' : t.align === 'right' ? 'flex-end' : 'center';
  const align =
    t.verticalAlign === 'top'
      ? 'flex-start'
      : t.verticalAlign === 'bottom'
        ? 'flex-end'
        : 'center';

  return (
    <foreignObject
      x={0}
      y={0}
      width={shape.width}
      height={shape.height}
      pointerEvents="none"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: align,
          justifyContent: justify,
          textAlign: t.align,
          padding: '4px 6px',
          boxSizing: 'border-box',
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          fontWeight: t.fontWeight,
          fontStyle: t.fontStyle,
          textDecoration: t.textDecoration,
          lineHeight: t.lineHeight,
          color: t.color,
          overflow: 'hidden',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {shape.text}
      </div>
    </foreignObject>
  );
});
