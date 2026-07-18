# Folder structure

```
drawIO/
├── frontend/
│   ├── src/
│   │   ├── app/                # App shell, routing, EditorLayout, theme provider
│   │   ├── components/
│   │   │   ├── ai/             # AI generator dialog
│   │   │   ├── canvas/         # Canvas, ShapeView, EdgeView, overlays, minimap, search
│   │   │   ├── toolbar/        # Toolbar, FileMenu
│   │   │   ├── sidebar/        # Shape library, tiles
│   │   │   ├── property-panel/ # Property editors
│   │   │   ├── layers/         # Layers panel
│   │   │   ├── pages/          # Pages bar
│   │   │   ├── menus/          # Context menu
│   │   │   └── ui/             # Reusable UI atoms (IconButton, Toaster)
│   │   ├── hooks/              # useCanvasInteractions, useKeyboardShortcuts, useAutosave, useFileActions, useHistory
│   │   ├── engine/
│   │   │   ├── commands/       # High-level reversible actions
│   │   │   ├── selection/      # Hit-testing, resize handles
│   │   │   ├── snapping/       # Grid + object snapping, smart guides
│   │   │   ├── alignment/      # Align + distribute
│   │   │   ├── routing/        # Connector paths + anchors
│   │   │   ├── renderer/       # Shape geometry / path generation
│   │   │   └── spatial/        # Quadtree + viewport culling
│   │   ├── models/             # Factory, layers, groups
│   │   ├── shapes/             # Shape registry + colored libraries + builders
│   │   ├── services/
│   │   │   ├── storage/        # IndexedDB autosave
│   │   │   ├── export/         # SVG serializer, raster, PNG/SVG/PDF/JSON/ZIP
│   │   │   ├── import/         # JSON/SVG/PNG + draw.io XML (sanitized)
│   │   │   ├── project/        # File format (de)serialization
│   │   │   └── ai/             # AIClient, heuristic, spec parser, diagram builder
│   │   ├── state/              # Zustand stores (project, editor, history, library)
│   │   ├── plugins/            # Plugin registry + built-in plugins
│   │   ├── themes/             # Theme provider / CSS variables
│   │   ├── utils/              # geometry, eventBus
│   │   ├── types/              # Domain types (shape, edge, page, project, ...)
│   │   ├── constants/          # Color palette
│   │   └── test/               # Vitest setup
│   ├── e2e/                    # Playwright specs
│   ├── public/
│   ├── vite.config.ts
│   └── playwright.config.ts
├── backend/
│   └── src/
│       ├── ai/                 # Heuristic generator + provider service
│       ├── routes/             # health, ai, projects
│       ├── store/              # In-memory project store
│       ├── app.ts              # Fastify factory (helmet, CORS, rate limit)
│       ├── server.ts           # Entrypoint
│       ├── config.ts           # Env-driven config
│       └── diagramSpec.ts      # zod DiagramSpec contract
├── docker/                     # Dockerfile.frontend, Dockerfile.backend, nginx.conf
├── docs/                       # This documentation
└── docker-compose.yml
```

## Conventions

- Files stay small and single-purpose; public functions carry JSDoc.
- The `@/` alias maps to `frontend/src`.
- Engine and domain modules never import React.
- Tests live next to the code they cover as `*.test.ts(x)`; E2E lives in `e2e/`.
