/**
 * Draggable waypoint, label, and endpoint handles for a selected connector.
 * @module components/canvas/EdgeRouteOverlay
 */
import { memo } from 'react';
import type { Edge, Page } from '@/types';
import { routeEdge } from '@/engine/routing/edgePath';

interface EdgeRouteOverlayProps {
  edge: Edge;
  page: Page;
  zoom: number;
  onEndpointDown: (event: React.PointerEvent, edgeId: string, which: 'source' | 'target') => void;
  onWaypointDown: (event: React.PointerEvent, edgeId: string, index: number) => void;
  onLabelDown: (event: React.PointerEvent, edgeId: string) => void;
}

/** Waypoint, label, and endpoint grab handles for manual routing. */
export const EdgeRouteOverlay = memo(function EdgeRouteOverlay({
  edge,
  page,
  zoom,
  onEndpointDown,
  onWaypointDown,
  onLabelDown,
}: EdgeRouteOverlayProps): React.JSX.Element {
  const routed = routeEdge(edge, page);
  const r = 5 / zoom;
  const labelOffset = edge.labelOffset ?? { x: 0, y: 0 };
  const labelX = routed.mid.x + labelOffset.x;
  const labelY = routed.mid.y + labelOffset.y;

  return (
    <g>
      {edge.waypoints.map((wp, index) => (
        <rect
          key={index}
          x={wp.x - r}
          y={wp.y - r}
          width={r * 2}
          height={r * 2}
          fill="var(--color-surface)"
          stroke="var(--color-selection)"
          strokeWidth={2 / zoom}
          rx={1 / zoom}
          style={{ cursor: 'move' }}
          onPointerDown={(e) => onWaypointDown(e, edge.id, index)}
        />
      ))}

      <circle
        cx={routed.start.x}
        cy={routed.start.y}
        r={r}
        fill="var(--color-surface)"
        stroke="var(--color-selection)"
        strokeWidth={2 / zoom}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => onEndpointDown(e, edge.id, 'source')}
      />
      <circle
        cx={routed.end.x}
        cy={routed.end.y}
        r={r}
        fill="var(--color-surface)"
        stroke="var(--color-selection)"
        strokeWidth={2 / zoom}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => onEndpointDown(e, edge.id, 'target')}
      />

      {edge.label && (
        <circle
          cx={labelX}
          cy={labelY}
          r={r + 1 / zoom}
          fill="var(--color-accent)"
          fillOpacity={0.25}
          stroke="var(--color-accent)"
          strokeWidth={1.5 / zoom}
          style={{ cursor: 'move' }}
          onPointerDown={(e) => onLabelDown(e, edge.id)}
        />
      )}
    </g>
  );
});
