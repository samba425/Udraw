/**
 * Renders a single connector (edge) including its path, arrowheads, label,
 * and optional flow animation.
 * @module components/canvas/EdgeView
 */
import { memo } from 'react';
import type { ArrowStyle, Edge, Page } from '@/types';
import { routeEdge } from '@/engine/routing/edgePath';
import { dashArray } from '@/engine/renderer/style';

interface EdgeViewProps {
  edge: Edge;
  page: Page;
  selected: boolean;
  flowHighlighted?: boolean;
  flowDimmed?: boolean;
  onPointerDown: (event: React.PointerEvent, edgeId: string) => void;
  onDoubleClick: (event: React.MouseEvent, edgeId: string) => void;
}

/** SVG marker refs for a given arrow style, or undefined for `none`. */
function markerUrl(style: ArrowStyle, edgeId: string, end: 'start' | 'end'): string | undefined {
  if (style === 'none') return undefined;
  return `url(#arrow_${edgeId}_${end})`;
}

/** Render one connector with arrowheads and label. */
export const EdgeView = memo(function EdgeView({
  edge,
  page,
  selected,
  flowHighlighted = false,
  flowDimmed = false,
  onPointerDown,
  onDoubleClick,
}: EdgeViewProps): React.JSX.Element | null {
  if (edge.hidden) return null;
  const routed = routeEdge(edge, page);
  const dash = dashArray(edge.dash, edge.strokeWidth);
  const labelOffset = edge.labelOffset ?? { x: 0, y: 0 };
  const opacity = flowDimmed ? edge.opacity * 0.2 : edge.opacity;

  return (
    <g
      opacity={opacity}
      onPointerDown={(e) => onPointerDown(e, edge.id)}
      onDoubleClick={(e) => onDoubleClick(e, edge.id)}
      data-edge-id={edge.id}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <ArrowMarker id={`arrow_${edge.id}_end`} style={edge.endArrow} color={edge.stroke} />
        <ArrowMarker id={`arrow_${edge.id}_start`} style={edge.startArrow} color={edge.stroke} reverse />
      </defs>

      {/* Wide invisible hit area for easier selection. */}
      <path d={routed.path} fill="none" stroke="transparent" strokeWidth={Math.max(edge.strokeWidth + 12, 14)} />

      <path
        d={routed.path}
        fill="none"
        stroke={flowHighlighted ? 'var(--color-accent, #7c3aed)' : edge.stroke}
        strokeWidth={flowHighlighted ? edge.strokeWidth + 2 : edge.strokeWidth}
        strokeDasharray={edge.animated ? `${edge.strokeWidth * 4} ${edge.strokeWidth * 3}` : dash}
        strokeLinejoin="round"
        strokeLinecap="round"
        markerEnd={markerUrl(edge.endArrow, edge.id, 'end')}
        markerStart={markerUrl(edge.startArrow, edge.id, 'start')}
      >
        {edge.animated && (
          <animate
            attributeName="stroke-dashoffset"
            from={edge.strokeWidth * 7}
            to="0"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {selected && (
        <path
          d={routed.path}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={edge.strokeWidth + 2}
          opacity={0.35}
          pointerEvents="none"
        />
      )}

      {edge.label && (
        <g
          transform={`translate(${routed.mid.x + labelOffset.x} ${routed.mid.y + labelOffset.y})`}
          pointerEvents="none"
        >
          <rect x={-labelWidth(edge.label) / 2} y={-11} width={labelWidth(edge.label)} height={22} rx={4} fill="var(--color-surface)" opacity={0.9} />
          <text textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="var(--color-text)">
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
});

function labelWidth(label: string): number {
  return Math.max(label.length * 7 + 12, 20);
}

interface ArrowMarkerProps {
  id: string;
  style: ArrowStyle;
  color: string;
  reverse?: boolean;
}

/** An SVG marker definition for a given arrow style. */
function ArrowMarker({ id, style, color, reverse }: ArrowMarkerProps): React.JSX.Element | null {
  if (style === 'none') return null;
  const orient = reverse ? 'auto-start-reverse' : 'auto';
  const tipX = style === 'circle' ? 10 : 11;
  const common = {
    id,
    markerWidth: 12,
    markerHeight: 12,
    refX: tipX,
    refY: 6,
    orient,
    markerUnits: 'userSpaceOnUse' as const,
  };
  return (
    <marker {...common}>
      {style === 'triangle' && <path d="M1,1 L11,6 L1,11 Z" fill={color} stroke="none" />}
      {style === 'arrow' && (
        <path d="M1,1 L11,6 L1,11" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      )}
      {style === 'diamond' && <path d="M1,6 L6,1 L11,6 L6,11 Z" fill={color} stroke="none" />}
      {style === 'circle' && <circle cx={6} cy={6} r={4} fill={color} stroke="none" />}
    </marker>
  );
}
