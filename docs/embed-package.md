# Embedding DiagramForge in Other Projects

DiagramForge ships as an npm package **`@diagramforge/react`** so you can drop the
full editor into any React 18+ or 19 application.

## Install

```bash
# From npm (after publish)
npm install @diagramforge/react

# Local development (monorepo)
cd frontend && npm run build:lib
cd ../examples/embed-react && npm install
```

## Quick start

```tsx
import { DiagramEditor } from '@diagramforge/react';
import '@diagramforge/react/styles.css';

export function DiagramPage() {
  return (
    <DiagramEditor
      height="80vh"
      onChange={(project) => {
        console.log('Diagram updated', project.name);
      }}
    />
  );
}
```

**Important:** always import `@diagramforge/react/styles.css` — the editor uses
Tailwind + CSS theme variables.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `initialProject` | `Project` | empty diagram | Starting document |
| `onChange` | `(project) => void` | — | Fired on every document change |
| `readOnly` | `boolean` | `false` | View-only (pan/zoom) |
| `apiBaseUrl` | `string` | env var | Backend URL for AI generation |
| `themeMode` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `height` / `width` | CSS size | `'100%'` | Container dimensions |
| `standalone` | `boolean` | `false` | Enable welcome + IndexedDB autosave |
| `features` | object | see below | Toggle panels / behaviour |

### Feature flags (`features`)

| Flag | Default (embed) | Description |
| --- | --- | --- |
| `ai` | `true` | AI generation panel |
| `presentation` | `true` | F5 slideshow mode |
| `sourceEditor` | `true` | JSON/YAML/Mermaid source view |
| `minimap` | `true` | Canvas minimap |
| `welcome` | `false` | Startup welcome dialog |
| `persistence` | `false` | IndexedDB autosave |

## Controlled document sync

```tsx
import { useState } from 'react';
import { DiagramEditor, parseProject, type Project } from '@diagramforge/react';

function ControlledEditor({ json }: { json: string }) {
  const [project, setProject] = useState(() => parseProject(json));

  return (
    <DiagramEditor
      key={project.id}
      initialProject={project}
      onChange={setProject}
    />
  );
}
```

## Exported helpers

```ts
import {
  DiagramEditor,
  parseProject,
  serializeProject,
  createProject,
  createShape,
  createEdge,
  exportSvg,
  exportPng,
  exportJson,
  buildShareUrl,
  projectToSourceText,
  loadTemplate,
} from '@diagramforge/react';
```

## Build the library

From `frontend/`:

```bash
npm run build:lib
```

Outputs:

| File | Purpose |
| --- | --- |
| `dist/diagramforge.js` | ESM bundle |
| `dist/diagramforge.umd.cjs` | UMD bundle |
| `dist/diagramforge.css` | Required styles |
| `dist/index.d.ts` | TypeScript declarations |

## Example app

See [`examples/embed-react/`](../examples/embed-react/):

```bash
cd frontend && npm run build:lib
cd ../examples/embed-react
npm install
npm run dev    # http://localhost:5199
```

## Limitations (v0.1)

- **One editor instance per page** — global Zustand stores; multiple embeds not yet supported.
- **Bundle size** — full editor bundle (~same as standalone app).

## Publishing to npm

```bash
cd frontend
npm run build:lib
npm publish --access public
```
