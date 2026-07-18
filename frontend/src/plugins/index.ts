/**
 * Plugin bootstrap. Registers the built-in example plugins. Third-party
 * plugins can call `pluginManager.register(plugin)` at runtime.
 * @module plugins
 */
import { pluginManager } from './registry';
import { diagramStatsPlugin } from './builtin/diagramStats';
import { mermaidExportPlugin } from './builtin/mermaidExport';
import { mermaidImportPlugin } from './builtin/mermaidImport';
import { plantumlImportPlugin } from './builtin/plantumlImport';

let registered = false;

/** Register the built-in plugins (idempotent). */
export function registerBuiltinPlugins(): void {
  if (registered) return;
  pluginManager.register(diagramStatsPlugin);
  pluginManager.register(mermaidExportPlugin);
  pluginManager.register(mermaidImportPlugin);
  pluginManager.register(plantumlImportPlugin);
  registered = true;
}

export { pluginManager } from './registry';
export type * from './types';
