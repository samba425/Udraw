/**
 * Viewport culling helpers. Computes the world-space rectangle currently
 * visible on screen and the axis-aligned bounds of a shape (accounting for
 * rotation), so the renderer can skip elements outside the viewport.
 * @module engine/spatial/viewport
 */
import type { Camera, Edge, Page, Rect, Shape, Size } from '@/types';
import { anchorPoint } from '@/engine/routing/anchors';

/**
 * The world-space rectangle visible for a given camera and viewport size,
 * expanded by `margin` screen pixels so elements just off-screen still render
 * during panning.
 */
export function visibleWorldRect(camera: Camera, viewport: Size, margin = 200): Rect {
  const marginWorld = margin / camera.zoom;
  return {
    x: -camera.x / camera.zoom - marginWorld,
    y: -camera.y / camera.zoom - marginWorld,
    width: viewport.width / camera.zoom + marginWorld * 2,
    height: viewport.height / camera.zoom + marginWorld * 2,
  };
}

/** Axis-aligned bounding box of a shape, expanded to cover any rotation. */
export function shapeAABB(shape: Shape): Rect {
  if (!shape.rotation) {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  }
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const rad = (shape.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const w = shape.width * cos + shape.height * sin;
  const h = shape.width * sin + shape.height * cos;
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
}

/** Axis-aligned bounding box of an edge from its resolved endpoints. */
export function edgeAABB(edge: Edge, page: Page): Rect {
  const points = [edge.source, edge.target].map((ep) => {
    if (ep.shapeId && page.shapes[ep.shapeId]) {
      return anchorPoint(page.shapes[ep.shapeId]!, ep.anchor);
    }
    return ep.point ?? { x: 0, y: 0 };
  });
  for (const wp of edge.waypoints) points.push(wp);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}
