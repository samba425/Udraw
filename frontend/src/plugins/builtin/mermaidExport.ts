/**
 * Example plugin: contributes a Mermaid flowchart exporter. Demonstrates the
 * exporter contribution point — the new format automatically appears in the
 * export menu.
 * @module plugins/builtin/mermaidExport
 */
import { pageToMermaid } from '@/services/mermaid/pageMermaid';
import type { Page } from '@/types';
import type { Plugin } from '@/plugins/types';

export const mermaidExportPlugin: Plugin = {
  id: 'builtin.mermaid-export',
  name: 'Mermaid Export',
  version: '1.0.0',
  description: 'Export the active page as a Mermaid flowchart.',
  activate(ctx) {
    ctx.registerExporter({
      id: 'mermaid',
      title: 'Export as Mermaid',
      extension: 'mmd',
      mimeType: 'text/vnd.mermaid',
      serialize: (_project, page: Page) => pageToMermaid(page),
    });
  },
};
