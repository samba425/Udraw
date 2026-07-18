/**
 * Connector (edge) domain model.
 * @module types/edge
 */
import type { DashStyle } from './style';
import type { Point } from './geometry';

/** Router determines how the edge path is computed between endpoints. */
export type EdgeRouter = 'straight' | 'orthogonal' | 'curved' | 'bezier';

/** Arrowhead marker styles. */
export type ArrowStyle = 'none' | 'arrow' | 'triangle' | 'diamond' | 'circle';

/**
 * An edge endpoint attaches either to a shape (optionally to a named anchor)
 * or to a fixed world-space point (a floating endpoint).
 */
export interface EdgeEndpoint {
  shapeId?: string;
  /** Named connection point on the shape (e.g. `top`, `right`, `0.5:0`). */
  anchor?: string;
  /** Absolute point used when the endpoint is not attached to a shape. */
  point?: Point;
}

/** A connector between two endpoints. */
export interface Edge {
  id: string;
  source: EdgeEndpoint;
  target: EdgeEndpoint;
  router: EdgeRouter;
  stroke: string;
  strokeWidth: number;
  dash: DashStyle;
  animated: boolean;
  startArrow: ArrowStyle;
  endArrow: ArrowStyle;
  label: string;
  opacity: number;
  locked: boolean;
  hidden: boolean;
  layerId: string;
  /** Optional user-defined waypoints for manual routing. */
  waypoints: Point[];
}

/** Subset used when creating edges. */
export type EdgeInit = Partial<Edge> & Pick<Edge, 'source' | 'target'>;
