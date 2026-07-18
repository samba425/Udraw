/**
 * A simple, dependency-free region quadtree for indexing axis-aligned bounding
 * boxes by id. Used to accelerate viewport culling and marquee/point hit
 * queries on large diagrams (thousands of nodes) where a linear scan per frame
 * becomes a bottleneck.
 * @module engine/spatial/quadtree
 */
import type { Point, Rect } from '@/types';
import { pointInRect, rectsIntersect } from '@/utils/geometry';

/** An indexed item: an id paired with its world-space bounds. */
export interface QuadItem {
  id: string;
  bounds: Rect;
}

const DEFAULT_CAPACITY = 8;
const DEFAULT_MAX_DEPTH = 8;

/** A region quadtree over a fixed world-space boundary. */
export class Quadtree {
  private items: QuadItem[] = [];
  private children: Quadtree[] | null = null;

  constructor(
    private readonly boundary: Rect,
    private readonly capacity: number = DEFAULT_CAPACITY,
    private readonly maxDepth: number = DEFAULT_MAX_DEPTH,
    private readonly depth: number = 0,
  ) {}

  /** Insert an item. Items outside the boundary are still stored at the root. */
  insert(item: QuadItem): void {
    if (this.children) {
      const child = this.childFor(item.bounds);
      if (child) {
        child.insert(item);
        return;
      }
    }

    this.items.push(item);
    if (
      !this.children &&
      this.items.length > this.capacity &&
      this.depth < this.maxDepth
    ) {
      this.subdivide();
    }
  }

  /** Collect ids of all items whose bounds intersect `range`. */
  query(range: Rect, out: Set<string> = new Set()): Set<string> {
    if (!rectsIntersect(range, this.boundary)) return out;
    for (const item of this.items) {
      if (rectsIntersect(range, item.bounds)) out.add(item.id);
    }
    if (this.children) {
      for (const child of this.children) child.query(range, out);
    }
    return out;
  }

  /** Collect ids of all items whose bounds contain `point`. */
  queryPoint(point: Point, out: Set<string> = new Set()): Set<string> {
    if (!pointInRect(point, this.boundary)) return out;
    for (const item of this.items) {
      if (pointInRect(point, item.bounds)) out.add(item.id);
    }
    if (this.children) {
      for (const child of this.children) child.queryPoint(point, out);
    }
    return out;
  }

  /** Split this node into four quadrants and redistribute items. */
  private subdivide(): void {
    const { x, y, width, height } = this.boundary;
    const hw = width / 2;
    const hh = height / 2;
    const nextDepth = this.depth + 1;
    this.children = [
      new Quadtree({ x, y, width: hw, height: hh }, this.capacity, this.maxDepth, nextDepth),
      new Quadtree({ x: x + hw, y, width: hw, height: hh }, this.capacity, this.maxDepth, nextDepth),
      new Quadtree({ x, y: y + hh, width: hw, height: hh }, this.capacity, this.maxDepth, nextDepth),
      new Quadtree({ x: x + hw, y: y + hh, width: hw, height: hh }, this.capacity, this.maxDepth, nextDepth),
    ];

    // Keep items that straddle a quadrant boundary at this node; push the rest down.
    const retained: QuadItem[] = [];
    for (const item of this.items) {
      const child = this.childFor(item.bounds);
      if (child) child.insert(item);
      else retained.push(item);
    }
    this.items = retained;
  }

  /** Return the single child fully containing `bounds`, or null if it straddles. */
  private childFor(bounds: Rect): Quadtree | null {
    if (!this.children) return null;
    for (const child of this.children) {
      if (
        bounds.x >= child.boundary.x &&
        bounds.y >= child.boundary.y &&
        bounds.x + bounds.width <= child.boundary.x + child.boundary.width &&
        bounds.y + bounds.height <= child.boundary.y + child.boundary.height
      ) {
        return child;
      }
    }
    return null;
  }
}

/** Build a quadtree sized to fit all items (with a small margin). */
export function buildQuadtree(items: QuadItem[], capacity = DEFAULT_CAPACITY): Quadtree {
  if (items.length === 0) {
    return new Quadtree({ x: 0, y: 0, width: 1, height: 1 }, capacity);
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { bounds } of items) {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }
  const margin = 10;
  const tree = new Quadtree(
    {
      x: minX - margin,
      y: minY - margin,
      width: maxX - minX + margin * 2,
      height: maxY - minY + margin * 2,
    },
    capacity,
  );
  for (const item of items) tree.insert(item);
  return tree;
}
