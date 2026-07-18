/**
 * Core geometric primitives shared across the engine.
 * @module types/geometry
 */

/** A point in canvas (world) coordinates. */
export interface Point {
  x: number;
  y: number;
}

/** A width/height pair. */
export interface Size {
  width: number;
  height: number;
}

/** An axis-aligned bounding box in world coordinates. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The camera describes the current viewport transform. */
export interface Camera {
  /** Horizontal pan offset in screen pixels. */
  x: number;
  /** Vertical pan offset in screen pixels. */
  y: number;
  /** Zoom factor where 1 == 100%. */
  zoom: number;
}
