/**
 * Parse a simple Mermaid flowchart into shapes and edges on the active page.
 * @module services/import/mermaid
 */
import { applyMermaidToActivePage, parseMermaidFlowchart } from '@/services/mermaid/pageMermaid';

export { parseMermaidFlowchart as parseMermaid };

/** Import mermaid text onto the active page (replaces page content). */
export function importMermaid(text: string): void {
  const err = applyMermaidToActivePage(text);
  if (err) throw new Error(err);
}
