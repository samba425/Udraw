/**
 * Renders a single shape as SVG. Pure/memoized: it derives everything from
 * the shape model and emits no side effects.
 * @module components/canvas/ShapeView
 */
import { memo } from 'react';
import type { Shape } from '@/types';
import { freehandPath, geometryForShape } from '@/engine/renderer/shapePath';
import { dashArray, resolveFill } from '@/engine/renderer/style';
import { ShapeLabel } from './ShapeLabel';
import { IconShape } from './IconShape';

interface ShapeViewProps {
  shape: Shape;
  selected: boolean;
  onPointerDown: (event: React.PointerEvent, shapeId: string) => void;
  onDoubleClick: (shapeId: string) => void;
  onPointerEnter?: (shapeId: string) => void;
  onPointerLeave?: (shapeId: string) => void;
}

/** Render one shape (geometry + label) inside the world-space group. */
export const ShapeView = memo(function ShapeView({
  shape,
  selected,
  onPointerDown,
  onDoubleClick,
  onPointerEnter,
  onPointerLeave,
}: ShapeViewProps): React.JSX.Element | null {
  if (shape.hidden) return null;

  const geom = geometryForShape(shape);
  const gradientId = `grad_${shape.id}`;
  const filterId = `shadow_${shape.id}`;
  const fill = resolveFill(shape.fill, gradientId);
  const dash = dashArray(shape.dash, shape.strokeWidth);
  const hasShadow = shape.shadow.enabled;
  const hasLink = Boolean(shape.hyperlink?.trim());

  const commonProps = {
    fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    strokeDasharray: dash,
    filter: hasShadow ? `url(#${filterId})` : undefined,
  };

  return (
    <g
      transform={`translate(${shape.x} ${shape.y}) rotate(${shape.rotation} ${shape.width / 2} ${shape.height / 2})`}
      opacity={shape.opacity}
      style={{
        cursor: shape.locked ? 'default' : hasLink ? 'pointer' : 'move',
      }}
      onPointerDown={(e) => onPointerDown(e, shape.id)}
      onPointerEnter={() => onPointerEnter?.(shape.id)}
      onPointerLeave={() => onPointerLeave?.(shape.id)}
      onDoubleClick={() => onDoubleClick(shape.id)}
      data-shape-id={shape.id}
      role="img"
      aria-label={shape.text || shape.kind}
    >
      <defs>
        {shape.fill.type === 'gradient' && shape.fill.gradientColor && (
          <linearGradient
            id={gradientId}
            gradientTransform={`rotate(${shape.fill.gradientAngle ?? 0} 0.5 0.5)`}
          >
            <stop offset="0%" stopColor={shape.fill.color} />
            <stop offset="100%" stopColor={shape.fill.gradientColor} />
          </linearGradient>
        )}
        {hasShadow && (
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow
              dx={shape.shadow.offsetX}
              dy={shape.shadow.offsetY}
              stdDeviation={shape.shadow.blur / 2}
              floodColor={shape.shadow.color}
            />
          </filter>
        )}
      </defs>

      {shape.blur > 0 && (
        <defs>
          <filter id={`blur_${shape.id}`}>
            <feGaussianBlur stdDeviation={shape.blur} />
          </filter>
        </defs>
      )}

      <g filter={shape.blur > 0 ? `url(#blur_${shape.id})` : undefined}>
        {shape.kind === 'group' ? (
          <rect width={shape.width} height={shape.height} fill="transparent" stroke="none" />
        ) : shape.kind === 'image' && shape.src ? (
          <image href={shape.src} width={shape.width} height={shape.height} preserveAspectRatio="xMidYMid meet" />
        ) : shape.kind === 'icon' && shape.libraryId ? (
          <IconShape shape={shape} commonProps={commonProps} />
        ) : shape.kind === 'freehand' && shape.points ? (
          <path
            d={freehandPath(shape.points, shape.width, shape.height)}
            fill="none"
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={hasShadow ? `url(#${filterId})` : undefined}
          />
        ) : shape.kind === 'swimlane-pool' ? (
          <>
            <rect width={shape.width} height={shape.height} {...commonProps} />
            <rect width={shape.width} height={36} fill="#e2e8f0" stroke={shape.stroke} strokeWidth={shape.strokeWidth} />
            <line x1={0} y1={36} x2={shape.width} y2={36} stroke={shape.stroke} strokeWidth={shape.strokeWidth} />
          </>
        ) : shape.kind === 'swimlane-lane' ? (
          <>
            <rect width={shape.width} height={shape.height} {...commonProps} />
            <rect
              width={Number(shape.metadata.laneHeader ?? 120)}
              height={shape.height}
              fill="#e2e8f0"
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
            />
            <line
              x1={Number(shape.metadata.laneHeader ?? 120)}
              y1={0}
              x2={Number(shape.metadata.laneHeader ?? 120)}
              y2={shape.height}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
            />
          </>
        ) : geom.type === 'rect' ? (
          <rect width={shape.width} height={shape.height} rx={geom.rx} ry={geom.rx} {...commonProps} />
        ) : geom.type === 'ellipse' ? (
          <ellipse
            cx={shape.width / 2}
            cy={shape.height / 2}
            rx={shape.width / 2}
            ry={shape.height / 2}
            {...commonProps}
          />
        ) : (
          <path d={geom.d} {...commonProps} />
        )}
      </g>

      {shape.text && <ShapeLabel shape={shape} />}

      {hasLink && (
        <g transform={`translate(${shape.width - 14} 8)`} pointerEvents="none">
          <circle r={6} fill="var(--color-accent)" />
          <path
            d="M -2.5 1.5 L 1.5 -2.5 M -0.5 -2.5 h2 v2"
            stroke="#fff"
            strokeWidth={1.2}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {selected && (
        <rect
          width={shape.width}
          height={shape.height}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
          opacity={0.5}
        />
      )}
    </g>
  );
});
