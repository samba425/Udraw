# State management

State is split into three Zustand stores plus a typed Event Bus. This keeps the
persisted document separate from ephemeral UI state and from history.

## `projectStore` (persisted document)

`state/projectStore.ts` holds the `Project` and the active page id, and exposes
granular, immutable mutations so the history layer can compose and reverse them:

- Shapes: `addShape`, `addShapes`, `updateShape`, `updateShapes`, `removeElements`
- Edges: `addEdge`, `updateEdge`
- Transforms: `moveElementsBy`, `reorder`
- Pages: `addPage`, `duplicatePage`, `removePage`, `renamePage`
- Layers: `addLayer`, `renameLayer`, `removeLayer`, `setLayerVisible`,
  `setLayerLocked`, `reorderLayer`, `setShapeLayer`
- `replaceProject`, `setActivePage`, `renameProject`
- Selector: `activePage()`

Mutations use `withActivePage()` to produce a new immutable page and bump
`updatedAt`, which drives autosave.

## `editorStore` (ephemeral UI)

`state/editorStore.ts` holds non-persisted state: `camera`, active `tool`,
`selectedIds`, `editingTextId`, `themeMode`, and panel toggles (`sidebarOpen`,
`propertyPanelOpen`, `layersPanelOpen`, `minimapOpen`, `searchOpen`). It also
owns camera math: `panBy`, `zoomBy`, `setZoom`, `fitToBounds`, and `centerOn`
(keeping a pivot point stationary during zoom).

## `historyStore` (undo/redo)

`state/historyStore.ts` implements the Command pattern. See
[history](history.md). All document mutations should be wrapped in
`historyStore.run(label, fn)` (or the `begin`/`commit`/`cancel` pair for drags).

## `libraryStore` (favorites + custom SVG)

`state/libraryStore.ts` persists favorite icon ids and imported custom SVG icons
to localStorage, re-registering custom icons on rehydration.

## Event Bus

`utils/eventBus.ts` is a small typed pub/sub used to decouple modules from React.
Events include `selection:changed`, `project:changed`, `history:changed`,
`zoom:fit`, `export:request`, `import:request`, `ai:open`, and `toast`.

## Data flow

```
User input → component → editorStore/engine action → historyStore.run → projectStore mutation
                                                   ↘ editorBus.emit(...) → subscribers (Toaster, Canvas, hooks)
```
