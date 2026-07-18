# Shape model

All drawable nodes implement the `BaseShape` contract (`types/shape.ts`). Every
coordinate is in world space.

```ts
interface Shape {
  id: string;
  kind: ShapeKind;
  libraryId?: string;      // e.g. "aws.ec2" for icon shapes
  x: number; y: number;
  width: number; height: number;
  rotation: number;        // degrees, clockwise, around center
  opacity: number;
  fill: FillStyle;         // solid | gradient | none
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
  parentId?: string;       // set for grouped children
  src?: string;            // data URL for image shapes
  points?: { x: number; y: number }[]; // freehand strokes (local 0..1 space)
  metadata: ShapeMetadata; // open key/value bag
}
```

`ShapeKind` includes: `rectangle`, `rounded-rectangle`, `ellipse`, `circle`,
`diamond`, `triangle`, `hexagon`, `parallelogram`, `cloud`, `cylinder`, `actor`,
`text`, `sticky-note`, `comment`, `freehand`, `image`, `icon`, and `group`.

## Edges

`types/edge.ts` defines connectors. Endpoints attach to a shape (with an
optional named anchor) or to a floating world-space point:

```ts
interface Edge {
  id: string;
  source: EdgeEndpoint; target: EdgeEndpoint;
  router: 'straight' | 'orthogonal' | 'curved' | 'bezier';
  stroke: string; strokeWidth: number; dash: DashStyle;
  animated: boolean;
  startArrow: ArrowStyle; endArrow: ArrowStyle; // none|arrow|triangle|diamond|circle
  label: string; opacity: number;
  locked: boolean; hidden: boolean; layerId: string;
  waypoints: Point[];
}
```

## Factories

`models/factory.ts` builds fully-defaulted objects so stores and commands stay
free of duplicated defaults: `createShape`, `createEdge`, `createLayer`,
`createPage`, `createProject`, and `createId`. New shapes are assigned a colorful
swatch from `constants/palette.ts` — shapes are never plain white.

## Libraries & registry

`shapes/registry.ts` defines `LibraryIcon` (id, label, category, SVG preview,
default size, and optionally `shapeKind`/`defaultText`/`defaultFill`/
`defaultStroke`). Built-in libraries live in `shapes/libraries/` and register at
startup via `registerBuiltinLibraries()`. Icons that declare a `shapeKind`
become native editable shapes on drop; the rest become `icon` shapes that render
the library SVG.
