# DiagramForge

An offline-first, open-source diagram editor — a draw.io / Lucidchart / Excalidraw
alternative built with a **custom SVG rendering engine**. No login, no cloud
account, and no paid SDKs. The editor is 100% functional in the browser; an
optional backend adds AI diagram generation and project sync.

![Tech](https://img.shields.io/badge/React-19-61dafb) ![TS](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Vite](https://img.shields.io/badge/Vite-7-646cff) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Live demo

**https://samba425.github.io/Udraw/**

Deployed from `main` via GitHub Actions (`.github/workflows/deploy-pages.yml`).

**One-time setup** (if the URL shows 404):

1. Open [github.com/samba425/Udraw/settings/pages](https://github.com/samba425/Udraw/settings/pages)
2. **Build and deployment → Source:** Deploy from a branch
3. **Branch:** `gh-pages` → folder **`/ (root)`** → Save
4. Wait ~1 minute for the site to go live

---

## Features

- **Infinite SVG canvas** with pan, wheel-zoom, grid, and snap.
- **Colored shape libraries**: Basic, Flowchart, UML, AWS, Azure, Network,
  Kubernetes, BPMN, Mind Map, Org Chart, Sticky Notes, Icons, and
  Custom SVG — searchable, with favorites and drag-and-drop.
- **Connectors**: straight, orthogonal, curved, and bezier routing with magnetic
  anchors, reconnection, arrow styles, dashed/animated lines, and labels.
- **Smart editing**: multi-select, marquee, resize, rotate, snapping, smart
  guides, align, distribute, and auto-center.
- **Layers & pages**: create/rename/lock/hide/reorder/nest layers; multiple
  pages with duplicate/rename/delete and thumbnails.
- **Unlimited undo/redo** via a Command-pattern history manager.
- **Clipboard**: copy, cut, paste (with offset), and duplicate.
- **Tools**: pointer, hand, shapes, connector, text, sticky note, comment,
  pen (freehand), eraser, and image import.
- **Import / export**: PNG, SVG, PDF, JSON, ZIP, and Mermaid; JSON, SVG,
  PNG image, draw.io XML, Mermaid, and PlantUML import.
- **Source editor**: canvas, split, and source-only views with JSON, YAML, and
  Mermaid DSL sync.
- **Share via URL**: `#d=` editable and `#dv=` view-only links (no server).
- **Templates & welcome**: flowchart, AWS, org chart, and retro starters.
- **Presentation mode**: F5 fullscreen slideshow through pages.
- **Format painter**, **hyperlinks**, and **swimlanes**.
- **Auto layout**: hierarchical layout for flowcharts and imports.
- **Persistence**: autosave to IndexedDB every 3s with crash recovery, plus
  Save As.
- **PWA**: installable offline app with service worker (production build).
- **Minimap** and **in-diagram search**.
- **Themes**: light / dark / system via CSS variables.
- **Plugin system**: register shapes, menus, toolbar items, exporters,
  importers, commands, and keyboard shortcuts.
- **AI generation** (optional): describe a flow in natural language and get a
  laid-out diagram. Works offline with a built-in heuristic generator, or via a
  configured backend AI provider.
- **Performance**: quadtree spatial index and viewport culling scale to
  10,000+ nodes.

## Tech stack

- **Frontend**: React 19, TypeScript 5 (strict, no `any`), Vite 7, Tailwind CSS 4,
  Zustand 5, React Router 7, React Hook Form 7, Framer Motion.
- **Rendering**: SVG-first, HTML overlays for text editing, Canvas only for raster export.
- **Storage**: IndexedDB (autosave), localStorage (favorites).
- **Backend (optional)**: Node 22 + Fastify (TypeScript), zod validation, rate limiting, CORS, helmet.
- **Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E).
- **Tooling**: ESLint 9 (flat config), Prettier, Docker multi-stage + docker-compose.

## Repository layout

```
frontend/   # the editor app (Vite + React)
backend/    # optional Fastify service (AI generate, project sync, health)
docker/     # Dockerfiles + nginx config
docs/       # architecture and subsystem documentation
docker-compose.yml
```

See [`docs/folder-structure.md`](docs/folder-structure.md) for the full `src/` tree.

---

## Getting started (local development)

Prerequisites: **Node.js 22+** and npm.

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The editor runs fully offline. No backend is required.

### Backend (optional)

```bash
cd backend
npm install
npm run dev          # http://localhost:8787
```

To point the frontend at the backend, set `VITE_API_BASE_URL` before building/running:

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8787 npm run dev
```

Without it, AI generation falls back to the offline heuristic generator.

---

## Run with Docker

```bash
docker compose up --build
```

- Frontend (nginx): http://localhost:8080
- Backend (Fastify): proxied at http://localhost:8080/api

Start the optional PostgreSQL service (reserved for future sync) with:

```bash
docker compose --profile db up --build
```

Both application images run as **non-root** with read-only root filesystems,
dropped capabilities, `no-new-privileges`, and container **healthchecks**.

### AI provider (optional)

Provider secrets stay server-side. Configure via the host environment:

```bash
export AI_PROVIDER=openai
export AI_API_KEY=...        # never committed or sent to the browser
export AI_MODEL=gpt-4o-mini
docker compose up --build
```

If unset, the backend uses its built-in offline heuristic generator.

---

## Scripts

### Frontend (`cd frontend`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build the production bundle |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (no emit) |
| `npm test` | Vitest unit + integration tests |
| `npm run test:e2e` | Playwright E2E (builds + previews first) |

### Backend (`cd backend`)

| Script | Description |
| --- | --- |
| `npm run dev` | Start Fastify with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | TypeScript (no emit) |
| `npm test` | Vitest API tests |

---

## Testing

```bash
cd frontend && npm run lint && npm run typecheck && npm test
cd backend  && npm run typecheck && npm test
```

E2E (requires browsers: `npx playwright install`):

```bash
cd frontend && npm run test:e2e
```

---

## Documentation

- **[Embed package](docs/embed-package.md)** — use DiagramForge in other React apps (`@diagramforge/react`)
- **[Developer guide](docs/developer-guide.md)** — full feature catalog, stack, architecture, and how everything works
- [Architecture](docs/architecture.md)
- [Folder structure](docs/folder-structure.md)
- [State management](docs/state-management.md)
- [Shape model](docs/shape-model.md)
- [Rendering pipeline](docs/rendering.md)
- [History system](docs/history.md)
- [Export & import](docs/export-import.md)
- [Performance](docs/performance.md)
- [Plugin API](docs/plugin-api.md)
- [Backend API](docs/backend-api.md)
- [Keyboard shortcuts](docs/keyboard-shortcuts.md)

## Design principles

SOLID · DRY · KISS · composition over inheritance · feature-based, clean
architecture · Command + Observer patterns · a typed Event Bus · no business
logic in components · strict TypeScript with no `any` · accessible (ARIA +
keyboard) · offline-first · zero paid dependencies.

## License

MIT.

## Author

**samba425** — [asiva325@gmail.com](mailto:asiva325@gmail.com)
