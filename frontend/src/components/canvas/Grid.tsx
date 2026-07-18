/**
 * Renders the infinite background grid via a tiling SVG pattern that follows
 * the camera. Two levels (minor/major) give depth without hurting perf.
 * @module components/canvas/Grid
 */
import { memo } from 'react';
import type { Camera } from '@/types';

interface GridProps {
  camera: Camera;
  size: number;
}

/** Infinite grid background bound to the current camera transform. */
export const Grid = memo(function Grid({ camera, size }: GridProps): React.JSX.Element {
  const step = size * camera.zoom;
  const major = step * 5;
  return (
    <>
      <defs>
        <pattern
          id="df-grid-minor"
          width={step}
          height={step}
          patternUnits="userSpaceOnUse"
          x={camera.x}
          y={camera.y}
        >
          <path
            d={`M ${step} 0 L 0 0 0 ${step}`}
            fill="none"
            stroke="var(--color-grid)"
            strokeWidth={1}
          />
        </pattern>
        <pattern
          id="df-grid-major"
          width={major}
          height={major}
          patternUnits="userSpaceOnUse"
          x={camera.x}
          y={camera.y}
        >
          <rect width={major} height={major} fill="url(#df-grid-minor)" />
          <path
            d={`M ${major} 0 L 0 0 0 ${major}`}
            fill="none"
            stroke="var(--color-grid-strong)"
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect x={0} y={0} width="100%" height="100%" fill="url(#df-grid-major)" />
    </>
  );
});
