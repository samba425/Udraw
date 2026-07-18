/**
 * Renders selection chrome: a bounding box plus resize and rotate handles.
 * Handle sizes are divided by the zoom so they stay constant on screen.
 * @module components/canvas/SelectionOverlay
 */
import { memo } from 'react';
import type { Shape } from '@/types';
import { RESIZE_HANDLES, HANDLE_CURSORS, handleAnchor, type ResizeHandle } from '@/engine/selection/handles';

interface SelectionOverlayProps {
  shapes: Shape[];
  zoom: number;
  /** When false, hide resize/rotate handles (e.g. while the connector tool is active). */
  showHandles?: boolean;
  onResizeHandleDown: (event: React.PointerEvent, handle: ResizeHandle, shapeId: string) => void;
  onRotateHandleDown: (event: React.PointerEvent, shapeId: string) => void;
}

/** Selection handles and bounding boxes for the current selection. */
export const SelectionOverlay = memo(function SelectionOverlay({
  shapes,
  zoom,
  showHandles = true,
  onResizeHandleDown,
  onRotateHandleDown,
}: SelectionOverlayProps): React.JSX.Element | null {
  if (shapes.length === 0) return null;
  const handleSize = 9 / zoom;
  // Groups show a bounding box but no resize/rotate handles (children own size).
  const single = shapes.length === 1 && shapes[0]!.kind !== 'group' ? shapes[0]! : null;

  return (
    <g pointerEvents="all">
      {shapes.map((shape) => (
        <rect
          key={`bbox_${shape.id}`}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          transform={`rotate(${shape.rotation} ${shape.x + shape.width / 2} ${shape.y + shape.height / 2})`}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={1.5 / zoom}
          pointerEvents="none"
        />
      ))}

      {showHandles && single && !single.locked && (
        <g
          transform={`rotate(${single.rotation} ${single.x + single.width / 2} ${single.y + single.height / 2})`}
        >
          {/* Rotate handle above the top edge. */}
          <line
            x1={single.x + single.width / 2}
            y1={single.y}
            x2={single.x + single.width / 2}
            y2={single.y - 24 / zoom}
            stroke="var(--color-selection)"
            strokeWidth={1.5 / zoom}
          />
          <circle
            cx={single.x + single.width / 2}
            cy={single.y - 24 / zoom}
            r={handleSize / 1.4}
            fill="var(--color-surface)"
            stroke="var(--color-selection)"
            strokeWidth={1.5 / zoom}
            style={{ cursor: 'grab' }}
            onPointerDown={(e) => onRotateHandleDown(e, single.id)}
          />

          {RESIZE_HANDLES.map((handle) => {
            const anchor = handleAnchor(handle);
            const cx = single.x + single.width * anchor.x;
            const cy = single.y + single.height * anchor.y;
            return (
              <rect
                key={handle}
                x={cx - handleSize / 2}
                y={cy - handleSize / 2}
                width={handleSize}
                height={handleSize}
                rx={1.5 / zoom}
                fill="var(--color-surface)"
                stroke="var(--color-selection)"
                strokeWidth={1.5 / zoom}
                style={{ cursor: HANDLE_CURSORS[handle] }}
                onPointerDown={(e) => onResizeHandleDown(e, handle, single.id)}
              />
            );
          })}
        </g>
      )}
    </g>
  );
});
