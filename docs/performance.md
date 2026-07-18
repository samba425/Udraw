# Performance

The editor targets smooth interaction with **10,000+ nodes**.

## Immutable, granular state

Every mutation produces a new immutable `Project`, so React re-renders are driven
by reference equality and history snapshots are cheap. Mutations are granular
(`updateShapes`, `moveElementsBy`, …) to avoid rebuilding unrelated state.

## Spatial index (quadtree)

`engine/spatial/quadtree.ts` is a region quadtree indexing element AABBs by id.

- `buildQuadtree(items)` sizes the tree to the content and inserts all items.
- `query(rect)` returns ids intersecting a rectangle in ~O(log n + k).
- `queryPoint(p)` supports point hit queries.

Items straddling a quadrant boundary are retained at the parent node, so queries
remain correct (verified against a brute-force scan in tests).

## Viewport culling

`engine/spatial/viewport.ts` computes:

- `visibleWorldRect(camera, viewport, margin)` — the world rectangle currently on
  screen, expanded by a margin so off-screen elements render just before they
  scroll into view.
- `shapeAABB(shape)` — an axis-aligned box that accounts for rotation.
- `edgeAABB(edge, page)` — bounds from resolved endpoints and waypoints.

The `Canvas` builds the quadtree once per page change (memoized) and re-queries
it on every camera/viewport change. Below a threshold (300 elements) culling is
skipped entirely to avoid overhead on small diagrams. The current selection is
always included so overlays stay consistent.

```
page changes ──▶ rebuild quadtree (memoized)
camera/size ───▶ query visibleWorldRect ──▶ visible id set ──▶ render subset
```

## Other techniques

- **React memoization** and stable refs in `useCanvasInteractions` keep drag
  handling off the React render path (all transient drag state lives in refs).
- **HTML overlays** for text editing avoid expensive SVG text-editing reflows.
- **Chrome strokes** scale with `1/zoom` to avoid re-layout on zoom.

## Benchmark

`engine/spatial/quadtree.test.ts` builds a 10,000-item index and runs 200
windowed queries, asserting completion well under a second, and checks query
results against a brute-force scan for correctness.
