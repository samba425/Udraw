# Export & import

## Export

`services/export/index.ts` orchestrates all formats. The core is a pure SVG
serializer (`serializeSvg.ts`) that mirrors the live renderer to produce a
standalone SVG string with correct content bounds, gradients/shadows, shape
markup, edges, and arrow markers.

| Format | How |
| --- | --- |
| **SVG** | Serialize the active page to a standalone SVG document. |
| **PNG** | Serialize → rasterize via `raster.ts` (SVG → `Image` → `<canvas>`). |
| **PDF** | Rasterize to PNG and embed into a `jspdf` document sized to the diagram. |
| **JSON** | Serialize the whole `Project` via the file format module. |
| **ZIP** | Bundle the project JSON plus an SVG/PNG preview using `jszip`. |

PDF export deliberately embeds a rasterized image rather than depending on
`svg2pdf`/`dompurify`, avoiding a known vulnerable dependency chain.

Exports are triggered by emitting `export:request { format }` on the Event Bus;
`hooks/useFileActions.ts` handles the request and downloads the result via
`services/download.ts`. Plugin-contributed exporters are appended to the File
menu (see [plugin API](plugin-api.md)).

## Import

`services/import/index.ts` dispatches by file type:

| Input | Behavior |
| --- | --- |
| **JSON** | Parse + validate a `Project` and replace the current document. |
| **PNG / image** | Create an `image` shape sized to the intrinsic dimensions. |
| **SVG** | Sanitize, register as a custom library icon, and place on the canvas. |
| **draw.io XML** | Parse `mxCell`s into shapes/edges (hardened parser). |

Imports can be triggered from the toolbar (`import:request`) or by dropping a
file onto the canvas.

### Security

- **SVG sanitizer** (`sanitizeSvg.ts`) removes forbidden tags (`script`,
  `foreignObject`, event handlers), strips dangerous URIs (`javascript:`,
  external references), and extracts intrinsic dimensions. This is required
  before embedding untrusted SVG.
- **draw.io parser** (`drawio.ts`) rejects DTD/entity declarations and parses via
  `DOMParser` to prevent XXE, then maps draw.io styles to `ShapeKind`s.

## File format

`services/project/fileFormat.ts` defines the on-disk format: a signed envelope
(`DiagramFile`) containing the serializable `Project` (pages, layers, nodes,
edges, assets, theme, settings, version). `parseProject` accepts both the
envelope and a bare project for resilience.
