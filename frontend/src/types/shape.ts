/**
 * Shape (node) domain model. Implements the `BaseShape` contract from the
 * design document. Every drawable node on the canvas is a `Shape`.
 * @module types/shape
 */
import type { DashStyle, FillStyle, ShadowStyle, Typography } from './style';

/**
 * Identifies which renderer/geometry a shape uses. Extensible so plugins and
 * shape libraries (AWS, Azure, UML, ...) can register additional kinds.
 */
export type ShapeKind =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'ellipse'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'hexagon'
  | 'parallelogram'
  | 'cloud'
  | 'cylinder'
  | 'actor'
  | 'text'
  | 'sticky-note'
  | 'comment'
  | 'freehand'
  | 'image'
  | 'icon'
  | 'group';

/** Metadata is an open key/value bag stored per shape. */
export type ShapeMetadata = Record<string, string | number | boolean | null>;

/**
 * The `BaseShape` contract. All coordinates are in world space.
 */
export interface Shape {
  id: string;
  kind: ShapeKind;
  /** Optional library id, e.g. `aws.ec2`, used to render icon shapes. */
  libraryId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotation in degrees, clockwise, around the shape center. */
  rotation: number;
  opacity: number;
  fill: FillStyle;
  stroke: string;
  strokeWidth: number;
  dash: DashStyle;
  cornerRadius: number;
  shadow: ShadowStyle;
  blur: number;
  text: string;
  typography: Typography;
  locked: boolean;
  hidden: boolean;
  layerId: string;
  /** For grouped shapes, the id of the parent group shape. */
  parentId?: string;
  /** Data URL or asset id used by image shapes. */
  src?: string;
  /**
   * Freehand stroke points in shape-local coordinates (0..width, 0..height).
   * Only set for `freehand` shapes.
   */
  points?: Array<{ x: number; y: number }>;
  metadata: ShapeMetadata;
}

/** A subset used when creating shapes; the store fills in defaults. */
export type ShapeInit = Partial<Shape> &
  Pick<Shape, 'kind' | 'x' | 'y' | 'width' | 'height'>;
