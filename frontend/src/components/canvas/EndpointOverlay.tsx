/**
 * Draggable endpoint handles for a selected connector, enabling reconnect.
 * @module components/canvas/EndpointOverlay
 */
import { memo } from 'react';
import type { Edge, Page } from '@/types';
import { routeEdge } from '@/engine/routing/edgePath';

interface EndpointOverlayProps {
  edge: Edge;
  page: Page;
  zoom: number;
  onEndpointDown: (event: React.PointerEvent, edgeId: string, which: 'source' | 'target') => void;
}

/** Two grab handles at the ends of the selected connector. */
export const EndpointOverlay = memo(function EndpointOverlay({
  edge,
  page,
  zoom,
  onEndpointDown,
}: EndpointOverlayProps): React.JSX.Element {
  const routed = routeEdge(edge, page);
  const r = 5 / zoom;
  return (
    <g>
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
    </g>
  );
});
