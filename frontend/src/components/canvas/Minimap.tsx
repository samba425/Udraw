/**
 * A corner minimap giving an overview of the active page and the current
 * viewport. Clicking or dragging recenters the camera. Purely presentational —
 * it derives everything from the stores.
 * @module components/canvas/Minimap
 */
import { useMemo } from 'react';
import type { Rect } from '@/types';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { isShapeVisible, layerMap } from '@/models/layers';

const MM_WIDTH = 200;
const MM_HEIGHT = 140;

/** Union of two rects (either may be null). */
function union(a: Rect | null, b: Rect | null): Rect | null {
  if (!a) return b;
  if (!b) return a;
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** The overview minimap. */
export function Minimap(): React.JSX.Element | null {
  const minimapOpen = useEditorStore((s) => s.minimapOpen);
  const camera = useEditorStore((s) => s.camera);
  const project = useProjectStore((s) => s.project);
  const activePageId = useProjectStore((s) => s.activePageId);
  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0]!;

  const canvasEl = typeof document !== 'undefined' ? document.querySelector('[aria-label="Diagram canvas"]') : null;
  const rect = canvasEl?.getBoundingClientRect();
  const viewW = rect?.width ?? 800;
  const viewH = rect?.height ?? 600;

  const { shapeRects, viewport, scale, origin } = useMemo(() => {
    const layers = layerMap(page);
    const rects: Rect[] = [];
    for (const shape of Object.values(page.shapes)) {
      if (isShapeVisible(layers, shape)) {
        rects.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
      }
    }
    let content: Rect | null = null;
    for (const r of rects) content = union(content, r);

    const vp: Rect = {
      x: -camera.x / camera.zoom,
      y: -camera.y / camera.zoom,
      width: viewW / camera.zoom,
      height: viewH / camera.zoom,
    };
    const bounds = union(content, vp) ?? { x: 0, y: 0, width: 1000, height: 700 };
    const pad = Math.max(bounds.width, bounds.height) * 0.05 + 20;
    const padded: Rect = {
      x: bounds.x - pad,
      y: bounds.y - pad,
      width: bounds.width + pad * 2,
      height: bounds.height + pad * 2,
    };
    const s = Math.min(MM_WIDTH / padded.width, MM_HEIGHT / padded.height);
    return { shapeRects: rects, viewport: vp, scale: s, origin: { x: padded.x, y: padded.y } };
  }, [page, camera, viewW, viewH]);

  if (!minimapOpen) return null;

  const toMini = (x: number, y: number): { x: number; y: number } => ({
    x: (x - origin.x) * scale,
    y: (y - origin.y) * scale,
  });

  const recenter = (event: React.MouseEvent<SVGSVGElement>): void => {
    const box = event.currentTarget.getBoundingClientRect();
    const worldX = (event.clientX - box.left) / scale + origin.x;
    const worldY = (event.clientY - box.top) / scale + origin.y;
    useEditorStore.getState().centerOn({ x: worldX, y: worldY }, { width: viewW, height: viewH });
  };

  const vpTopLeft = toMini(viewport.x, viewport.y);

  return (
    <div
      className="pointer-events-auto absolute bottom-3 left-3 overflow-hidden rounded-lg border bordered shadow-lg surface"
      aria-label="Minimap"
    >
      <svg
        width={MM_WIDTH}
        height={MM_HEIGHT}
        className="block cursor-pointer"
        style={{ background: 'var(--color-canvas)' }}
        onMouseDown={recenter}
      >
        {shapeRects.map((r, i) => {
          const p = toMini(r.x, r.y);
          return (
            <rect
              key={i}
              x={p.x}
              y={p.y}
              width={Math.max(r.width * scale, 1)}
              height={Math.max(r.height * scale, 1)}
              fill="var(--color-accent)"
              opacity={0.5}
            />
          );
        })}
        <rect
          x={vpTopLeft.x}
          y={vpTopLeft.y}
          width={viewport.width * scale}
          height={viewport.height * scale}
          fill="none"
          stroke="var(--color-selection)"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
}
