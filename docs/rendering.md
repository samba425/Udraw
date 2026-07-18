# Rendering pipeline

Rendering is SVG-first. The `Canvas` component (`components/canvas/Canvas.tsx`)
renders a single world-space `<g>` transformed by the camera:

```
transform = translate(camera.x, camera.y) scale(camera.zoom)
```

## Draw order

`page.order` is a single array of shape and edge ids, so z-order is explicit and
shared across shapes and connectors. The canvas maps over `page.order`, skips
hidden/culled elements, and renders `EdgeView` or `ShapeView` accordingly.

Overlays are drawn on top in the same world group: connector anchors, the
selection box + resize/rotate handles, edge endpoints, smart guides, the pen
preview, the connector preview, and the marquee. Strokes for chrome use
`1 / zoom` widths so they stay crisp at any zoom.

## Shape geometry

`engine/renderer/shapePath.ts` produces the geometry/path for each `ShapeKind`
(including `commentPath` and `freehandPath`). `ShapeView` chooses an SVG element
(`rect`, `ellipse`, `path`, `image`, or a library `icon`) based on kind and
applies fill, stroke, dash, shadow, blur, opacity, rotation, and text.

## Text editing

Inline text uses an HTML overlay (`TextEditorOverlay`) positioned over the shape
in screen space, rather than SVG text editing. Committing writes back to
`shape.text` through the history layer.

## Culling

For large diagrams (> 300 elements) the canvas builds a quadtree over element
AABBs and only renders ids intersecting the viewport rectangle (plus the current
selection). See [performance](performance.md).

## Grid

`Grid` renders an SVG pattern in screen space sized by `settings.gridSize` and
the camera, so the grid is stable while panning/zooming.

## Raster / vector export

Export reuses a pure serializer (`services/export/serializeSvg.ts`) that mirrors
the live renderer to produce a standalone SVG string, which is then rasterized to
PNG or embedded into a PDF. See [export & import](export-import.md).
