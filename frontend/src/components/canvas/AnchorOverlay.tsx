/**
 * Renders connection anchors on shapes while the connector tool is active,
 * so users can start edges from precise magnetic points.
 * @module components/canvas/AnchorOverlay
 */
import { memo } from 'react';
import type { Page, Shape } from '@/types';
import { DEFAULT_ANCHOR_NAMES, anchorPoint } from '@/engine/routing/anchors';

interface AnchorOverlayProps {
  page: Page;
  zoom: number;
  /** When set, only these shape ids show anchors. */
  shapeIds?: Set<string>;
  /** Push anchors outward from the shape edge (world units). Avoids overlap with resize handles. */
  outward?: number;
  onAnchorDown: (event: React.PointerEvent, shapeId: string, anchor: string) => void;
}

/** Offset an anchor point slightly outside the shape edge. */
function outwardPoint(shape: Shape, anchor: string, offset: number): { x: number; y: number } {
  const p = anchorPoint(shape, anchor);
  switch (anchor) {
    case 'top':
      return { x: p.x, y: p.y - offset };
    case 'bottom':
      return { x: p.x, y: p.y + offset };
    case 'left':
      return { x: p.x - offset, y: p.y };
    case 'right':
      return { x: p.x + offset, y: p.y };
    default:
      return p;
  }
}

/** Small magnetic connection points; drag from one to another shape to connect. */
export const AnchorOverlay = memo(function AnchorOverlay({
  page,
  zoom,
  shapeIds,
  outward = 0,
  onAnchorDown,
}: AnchorOverlayProps): React.JSX.Element {
  const r = 5 / zoom;
  return (
    <g aria-label="Connection points">
      {page.order.map((id) => {
        if (shapeIds && !shapeIds.has(id)) return null;
        const shape = page.shapes[id];
        if (!shape || shape.hidden || shape.locked) return null;
        return DEFAULT_ANCHOR_NAMES.map((name) => {
          const p = outward > 0 ? outwardPoint(shape, name, outward) : anchorPoint(shape, name);
          return (
            <circle
              key={`${id}_${name}`}
              cx={p.x}
              cy={p.y}
              r={r}
              fill="var(--color-accent)"
              stroke="var(--color-surface)"
              strokeWidth={1.5 / zoom}
              style={{ cursor: 'crosshair' }}
              aria-label={`Connect from ${name}`}
              onPointerDown={(e) => onAnchorDown(e, id, name)}
            />
          );
        });
      })}
    </g>
  );
});
