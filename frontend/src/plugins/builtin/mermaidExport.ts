/**
 * Example plugin: contributes a Mermaid flowchart exporter. Demonstrates the
 * exporter contribution point — the new format automatically appears in the
 * export menu.
 * @module plugins/builtin/mermaidExport
 */
import type { Page } from '@/types';
import type { Plugin } from '@/plugins/types';

/** Build a safe mermaid node id from a shape id. */
function nodeId(id: string): string {
  return 'n_' + id.replace(/[^a-zA-Z0-9_]/g, '');
}

/** Escape a label for a mermaid quoted string. */
function label(text: string, fallback: string): string {
  const clean = (text || fallback).replace(/"/g, "'").replace(/\n/g, ' ');
  return clean.slice(0, 60);
}

/** Serialize a page to a Mermaid `flowchart` definition. */
function toMermaid(page: Page): string {
  const lines: string[] = ['flowchart TD'];
  for (const shape of Object.values(page.shapes)) {
    if (shape.kind === 'group') continue;
    lines.push(`  ${nodeId(shape.id)}["${label(shape.text, shape.kind)}"]`);
  }
  for (const edge of Object.values(page.edges)) {
    if (!edge.source.shapeId || !edge.target.shapeId) continue;
    const arrow = edge.label ? `-- "${label(edge.label, '')}" -->` : '-->';
    lines.push(`  ${nodeId(edge.source.shapeId)} ${arrow} ${nodeId(edge.target.shapeId)}`);
  }
  return lines.join('\n');
}

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
      serialize: (_project, page) => toMermaid(page),
    });
  },
};
