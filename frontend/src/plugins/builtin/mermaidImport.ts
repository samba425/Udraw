/**
 * Built-in Mermaid flowchart importer. Accepts `.mmd` files or pasted source
 * via the Import Mermaid command.
 * @module plugins/builtin/mermaidImport
 */
import { importMermaid } from '@/services/import/mermaid';
import type { Plugin } from '@/plugins/types';

const CMD_IMPORT = 'mermaid.import';

/** Run Mermaid import from a pasted dialog. */
function importFromPrompt(notify: (message: string, kind?: 'info' | 'success' | 'error') => void): void {
  const text = window.prompt(
    'Paste Mermaid flowchart source (flowchart TD with A["Label"] and A --> B):',
  );
  if (!text?.trim()) return;
  try {
    importMermaid(text.trim());
    notify('Mermaid diagram imported.', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mermaid import failed.';
    notify(message, 'error');
  }
}

export const mermaidImportPlugin: Plugin = {
  id: 'builtin.mermaid-import',
  name: 'Mermaid Import',
  version: '1.0.0',
  description: 'Import Mermaid flowcharts onto the canvas.',
  activate(ctx) {
    ctx.registerCommand({
      id: CMD_IMPORT,
      title: 'Import Mermaid',
      run: () => importFromPrompt(ctx.notify),
    });
    ctx.registerMenuItem({
      id: 'mermaid-import',
      title: 'Import Mermaid...',
      command: CMD_IMPORT,
    });
    ctx.registerImporter({
      id: 'mermaid',
      title: 'Import Mermaid',
      extensions: ['mmd', 'mermaid'],
      handle: (text) => {
        importMermaid(text);
        ctx.notify('Mermaid diagram imported.', 'success');
      },
    });
  },
};
