# Plugin API

Plugins extend the editor without modifying core code. A plugin is a plain
object with an `activate(ctx)` function that registers contributions. Plugins are
framework-agnostic and never import React.

## Registering a plugin

```ts
import { pluginManager } from '@/plugins/registry';
import type { Plugin } from '@/plugins/types';

const myPlugin: Plugin = {
  id: 'my.plugin',
  name: 'My Plugin',
  version: '1.0.0',
  activate(ctx) {
    ctx.registerCommand({
      id: 'my.hello',
      title: 'Say hello',
      run: () => ctx.notify(`Shapes: ${Object.keys(ctx.getActivePage().shapes).length}`),
    });
    ctx.registerToolbarItem({ id: 'my.hello.btn', title: 'Hello', command: 'my.hello' });
    ctx.registerShortcut({ combo: 'mod+shift+h', command: 'my.hello' });
  },
};

pluginManager.register(myPlugin);
```

Built-in plugins register in `plugins/index.ts` via `registerBuiltinPlugins()`,
called from `main.tsx`.

## Contribution types (`plugins/types.ts`)

| Contribution | Purpose |
| --- | --- |
| `CommandContribution` | Named action invoked by menus/toolbar/shortcuts. |
| `ToolbarContribution` | A toolbar button bound to a command. |
| `MenuContribution` | A context-menu item (optionally selection-gated). |
| `ShortcutContribution` | A `mod+shift+key` binding bound to a command. |
| `ExporterContribution` | A file exporter (`serialize(project, page) → string`). |
| `ImporterContribution` | A file importer for given extensions. |
| Library icons | `ctx.registerShapes([...])` adds colored library icons. |

## `PluginContext`

The context handed to `activate` exposes safe accessors and registrars:
`registerShapes`, `registerCommand`, `registerToolbarItem`, `registerMenuItem`,
`registerShortcut`, `registerExporter`, `registerImporter`, plus read-only
`getProject()` / `getActivePage()` and `notify(message, kind)`.

## How contributions surface

- **Toolbar**: `Toolbar` renders `pluginManager.toolbarItems()`.
- **Shortcuts**: `useKeyboardShortcuts` checks `pluginManager.shortcuts()` first.
- **Exporters**: appended to the File menu; run through the export pipeline.
- **Importers**: consulted by `services/import` based on file extension.

## Built-in examples

- `plugins/builtin/diagramStats.ts` — a command + toolbar item + shortcut that
  reports shape/connector/layer/page counts via a toast.
- `plugins/builtin/mermaidExport.ts` — an exporter that serializes the active
  page to a Mermaid `flowchart` definition.
