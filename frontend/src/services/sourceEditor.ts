/**
 * Bidirectional sync between the visual canvas and text source editors.
 * Supports JSON, YAML, and Mermaid DSL formats.
 * @module services/sourceEditor
 */
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { parseProject, serializeProject } from '@/services/project/fileFormat';
import { activePageToMermaid, applyMermaidToActivePage } from '@/services/mermaid/pageMermaid';
import type { Project } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { useEditorStore } from '@/state/editorStore';
import { editorBus } from '@/utils/eventBus';

export type SourceFormat = 'json' | 'yaml' | 'mermaid';

/** Serialize the live project to editable source text. */
export function projectToSourceText(format: SourceFormat = 'json', project?: Project): string {
  const p = project ?? useProjectStore.getState().project;
  switch (format) {
    case 'yaml': {
      const parsed = JSON.parse(serializeProject(p)) as unknown;
      return yamlDump(parsed, { lineWidth: 100, noRefs: true });
    }
    case 'mermaid':
      return activePageToMermaid();
    default:
      return serializeProject(p);
  }
}

/** Parse JSON source and replace the canvas project. */
export function applyJsonToCanvas(text: string): string | null {
  try {
    const project = parseProject(text);
    useProjectStore.getState().replaceProject(project);
    useHistoryStore.getState().clear();
    editorBus.emit('zoom:fit', undefined);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid diagram JSON.';
  }
}

/** Parse YAML source and replace the canvas project. */
export function applyYamlToCanvas(text: string): string | null {
  try {
    const data = yamlLoad(text);
    if (data === null || typeof data !== 'object') {
      return 'YAML must describe a diagram object.';
    }
    return applyJsonToCanvas(JSON.stringify(data));
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid diagram YAML.';
  }
}

/** Apply source text using the selected format. */
export function applySourceToCanvas(text: string, format: SourceFormat = 'json'): string | null {
  switch (format) {
    case 'yaml':
      return applyYamlToCanvas(text);
    case 'mermaid':
      return applyMermaidToActivePage(text);
    default:
      return applyJsonToCanvas(text);
  }
}

/** Switch to source-only view. */
export function openSourceView(): void {
  useEditorStore.getState().setViewMode('source');
}

/** Switch to split view (canvas + source). */
export function openSplitView(): void {
  useEditorStore.getState().setViewMode('split');
}

/** Switch back to canvas-only view. */
export function closeSourceView(text?: string, format?: SourceFormat): string | null {
  if (text !== undefined) {
    const err = applySourceToCanvas(text, format ?? useEditorStore.getState().sourceFormat);
    if (err) return err;
  }
  useEditorStore.getState().setViewMode('canvas');
  if (text !== undefined) {
    editorBus.emit('toast', { message: 'Canvas updated from source.', kind: 'success' });
  }
  return null;
}
