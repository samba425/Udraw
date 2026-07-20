# @samba425/diagramforge-react

**Embeddable, offline-first diagram editor for React** — a draw.io / Lucidchart alternative you can drop into any React 18+ or 19 app with a single component.

[![npm version](https://img.shields.io/npm/v/@samba425/diagramforge-react.svg)](https://www.npmjs.com/package/@samba425/diagramforge-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18%20%7C%2019-61dafb)](https://react.dev)

**Live demo:** [samba425.github.io/Udraw](https://samba425.github.io/Udraw/)  
**Source:** [github.com/samba425/Udraw](https://github.com/samba425/Udraw)

---

## Why use this?

| Need | How DiagramForge helps |
|------|------------------------|
| Add diagrams to your SaaS app | Embed the full editor with `<DiagramEditor />` — no iframe hacks |
| No vendor lock-in | Open source (MIT), JSON document format, export SVG/PNG/PDF |
| Works offline | 100% client-side rendering; optional AI backend is separate |
| Rich shape libraries | Flowchart, UML, AWS, Azure, K8s, BPMN, org charts, and more |
| Developer-friendly | TypeScript types, `onChange` callback, programmatic API for shapes/edges |

Built with a **custom SVG engine** (not a wrapper around draw.io). Your users get pan/zoom, connectors, layers, grouping, undo/redo, templates, presentation mode, and import/export — inside your product.

---

## Install

```bash
npm install @samba425/diagramforge-react
```

**Peer dependencies:** `react` and `react-dom` (^18 or ^19).

---

## Quick start

```tsx
import { DiagramEditor } from '@samba425/diagramforge-react';
import '@samba425/diagramforge-react/styles.css';

export function DiagramPage() {
  return (
    <DiagramEditor
      height="80vh"
      onChange={(project) => {
        console.log('Diagram updated:', project.name);
      }}
    />
  );
}
```

> **Required:** Always import `@samba425/diagramforge-react/styles.css`. The editor uses Tailwind + CSS theme variables and will look broken without it.

---

## `<DiagramEditor />` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialProject` | `Project` | empty diagram | Starting document. Remount or change `key` to load a new doc. |
| `onChange` | `(project: Project) => void` | — | Called whenever the document changes. Use to save to your API or state. |
| `readOnly` | `boolean` | `false` | View-only mode (pan and zoom). |
| `apiBaseUrl` | `string` | — | Backend URL for AI diagram generation. |
| `themeMode` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme. |
| `height` | CSS size | `'100%'` | Editor container height. |
| `width` | CSS size | `'100%'` | Editor container width. |
| `className` | `string` | — | CSS class on the root wrapper. |
| `style` | `CSSProperties` | — | Inline styles on the root wrapper. |
| `standalone` | `boolean` | `false` | Enables welcome dialog + IndexedDB autosave (first-party app mode). |
| `features` | `DiagramEditorFeatures` | see below | Toggle panels and behaviour. |

### Feature flags (`features`)

| Flag | Embed default | Description |
|------|---------------|-------------|
| `ai` | `true` | AI generation panel |
| `presentation` | `true` | F5 fullscreen slideshow |
| `sourceEditor` | `true` | JSON / YAML / Mermaid source view |
| `minimap` | `true` | Canvas minimap |
| `welcome` | `false` | Startup welcome / recovery dialog |
| `persistence` | `false` | Autosave to IndexedDB |

```tsx
<DiagramEditor
  features={{ ai: false, welcome: false, persistence: false }}
/>
```

---

## Common integration patterns

### Save to your backend

```tsx
import { DiagramEditor, serializeProject, type Project } from '@samba425/diagramforge-react';
import '@samba425/diagramforge-react/styles.css';

async function saveDiagram(project: Project) {
  await fetch('/api/diagrams/123', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: serializeProject(project),
  });
}

export function Editor() {
  return <DiagramEditor onChange={saveDiagram} height="100vh" />;
}
```

### Load existing diagram (controlled)

```tsx
import { useState } from 'react';
import { DiagramEditor, parseProject, type Project } from '@samba425/diagramforge-react';
import '@samba425/diagramforge-react/styles.css';

function ControlledEditor({ json }: { json: string }) {
  const [project, setProject] = useState(() => parseProject(json));

  return (
    <DiagramEditor
      key={project.id}
      initialProject={project}
      onChange={setProject}
      height="80vh"
    />
  );
}
```

### Read-only viewer

```tsx
<DiagramEditor
  initialProject={loadedProject}
  readOnly
  features={{ ai: false, sourceEditor: false }}
  height="600px"
/>
```

### Dark theme

```tsx
<DiagramEditor themeMode="dark" height="80vh" />
```

### Minimal embed (no AI, no autosave)

```tsx
<DiagramEditor
  height="calc(100vh - 64px)"
  features={{ ai: false, welcome: false, persistence: false }}
  onChange={(p) => localStorage.setItem('diagram', JSON.stringify(p))}
/>
```

---

## Build diagrams in code

Create shapes and edges programmatically, then pass as `initialProject`:

```tsx
import {
  DiagramEditor,
  createProject,
  createPage,
  createShape,
  createEdge,
  createLayer,
} from '@samba425/diagramforge-react';
import '@samba425/diagramforge-react/styles.css';

const layer = createLayer('Main');
const page = createPage('Page 1', [layer.id]);
page.layers = [layer];

const boxA = createShape(
  { kind: 'rectangle', x: 80, y: 80, width: 160, height: 72, text: 'Start' },
  layer.id,
);
const boxB = createShape(
  { kind: 'rectangle', x: 320, y: 80, width: 160, height: 72, text: 'End' },
  layer.id,
);
page.shapes[boxA.id] = boxA;
page.shapes[boxB.id] = boxB;
page.order.push(boxA.id, boxB.id);

const edge = createEdge(
  { source: { shapeId: boxA.id }, target: { shapeId: boxB.id } },
  page.id,
);
page.edges[edge.id] = edge;
page.order.push(edge.id);

const project = createProject({ name: 'My flow', pages: [page] });

export function App() {
  return <DiagramEditor initialProject={project} height="80vh" />;
}
```

---

## Export & share

```tsx
import {
  exportSvg,
  exportPng,
  exportJson,
  buildShareUrl,
  loadTemplate,
} from '@samba425/diagramforge-react';

// From a Project object and active page:
await exportPng(project, pageId, { scale: 2 });
await exportSvg(project, pageId);
exportJson(project);

// Shareable URL (no server required):
const url = buildShareUrl(project, { viewOnly: false });

// Built-in templates: 'flowchart' | 'aws' | 'org-chart' | 'retro' | ...
const project = loadTemplate('flowchart');
```

---

## Optional AI generation

The editor includes an AI panel. By default it uses a **built-in offline heuristic** generator. For LLM-powered diagrams, run the optional [backend server](https://github.com/samba425/Udraw/tree/main/backend) and point the editor at it:

```tsx
<DiagramEditor apiBaseUrl="https://your-api.example.com" />
```

Or set `VITE_API_BASE_URL` in your Vite app.

---

## Exported API

```ts
// Component
export { DiagramEditor };
export type { DiagramEditorProps, DiagramEditorFeatures };

// Document types
export type { Project, Page, Layer, Shape, Edge, ToolId, ThemeMode, Camera, Point, Rect };

// File format
export { parseProject, serializeProject, FILE_SIGNATURE };

// Export
export { exportSvg, exportPng, exportPdf, exportJson, exportZip };

// Templates & share
export { DIAGRAM_TEMPLATES, loadTemplate };
export { encodeShareHash, decodeShareHash, buildShareUrl };

// Source editor (JSON / YAML / Mermaid)
export { projectToSourceText, applySourceToCanvas };

// Factories
export { createProject, createPage, createShape, createEdge, createLayer };

// Plugins (advanced)
export { pluginManager };
export type { Plugin };
```

Full TypeScript declarations ship in `dist/index.d.ts`.

---

## What’s included in the editor

- **Infinite SVG canvas** — pan, wheel zoom, grid, snap, smart guides
- **Shape libraries** — Basic, Flowchart, UML, AWS, Azure, Network, Kubernetes, BPMN, Mind Map, Org Chart, Sticky Notes, Icons
- **Connectors** — straight, orthogonal, curved, bezier; arrows, labels, animated lines
- **Grouping** — group/ungroup, named groups, enter group (double-click), drag shapes into groups
- **Layers & pages** — multi-page documents with layer visibility and lock
- **Undo / redo**, clipboard, duplicate, align & distribute
- **Import / export** — PNG, SVG, PDF, JSON, ZIP; import draw.io XML, Mermaid, PlantUML
- **Presentation mode** (F5), minimap, in-diagram search
- **Themes** — light / dark / system

---

## Keyboard shortcuts (built-in)

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `H` | Pan tool |
| `R` / `O` / `D` | Rectangle / Ellipse / Diamond |
| `C` | Connector |
| `Ctrl+G` | Group selection |
| `Ctrl+Shift+G` | Ungroup |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Ctrl+C` / `Ctrl+V` | Copy / Paste |
| `Delete` | Delete selection |
| `F5` | Presentation mode |

See the full list in the app via **?** or the [keyboard shortcuts doc](https://github.com/samba425/Udraw/blob/main/docs/keyboard-shortcuts.md).

---

## Framework notes

### Vite

Works out of the box. Import the CSS as shown above.

### Next.js (App Router)

Use a client component:

```tsx
'use client';

import dynamic from 'next/dynamic';

const DiagramEditor = dynamic(
  () => import('@samba425/diagramforge-react').then((m) => m.DiagramEditor),
  { ssr: false },
);

import '@samba425/diagramforge-react/styles.css';
```

### Create React App

Same as Quick start — import CSS in your root component or `index.tsx`.

---

## Limitations (v0.1)

- **One editor instance per page** — uses global Zustand stores; multiple `<DiagramEditor />` on the same page is not yet supported.
- **Bundle size** — full editor bundle (~1.6 MB ESM); code-split if needed.
- **SSR** — client-only; disable SSR where you embed (see Next.js example).

---

## Example app

Clone the repo and run the embed example:

```bash
git clone https://github.com/samba425/Udraw.git
cd Udraw/frontend && npm run build:lib
cd ../examples/embed-react && npm install && npm run dev
# → http://localhost:5199
```

---

## Documentation

| Topic | Link |
|-------|------|
| Embed guide | [docs/embed-package.md](https://github.com/samba425/Udraw/blob/main/docs/embed-package.md) |
| Developer guide | [docs/developer-guide.md](https://github.com/samba425/Udraw/blob/main/docs/developer-guide.md) |
| Architecture | [docs/architecture.md](https://github.com/samba425/Udraw/blob/main/docs/architecture.md) |
| Plugin API | [docs/plugin-api.md](https://github.com/samba425/Udraw/blob/main/docs/plugin-api.md) |
| Backend API (AI) | [docs/backend-api.md](https://github.com/samba425/Udraw/blob/main/docs/backend-api.md) |

---

## Contributing & support

- **Issues:** [github.com/samba425/Udraw/issues](https://github.com/samba425/Udraw/issues)
- **License:** [MIT](https://github.com/samba425/Udraw/blob/main/LICENSE)

---

## Author

[samba425](https://github.com/samba425) — built as an open-source alternative to proprietary diagram tools.
