/**
 * Public API for embedding DiagramForge in other React applications.
 * @module lib
 *
 * @example
 * ```tsx
 * import { DiagramEditor, parseProject, serializeProject } from '@diagramforge/react';
 * import '@diagramforge/react/styles.css';
 * ```
 */

export { DiagramEditor } from './DiagramEditor';
export type { DiagramEditorProps } from './types';
export type { DiagramEditorFeatures } from './runtimeConfig';

// Domain types
export type {
  Project,
  Page,
  Layer,
  Shape,
  Edge,
  EdgeEndpoint,
  EdgeRouter,
  ArrowStyle,
  ToolId,
  ThemeMode,
  Camera,
  Point,
  Rect,
} from '@/types';

// File format
export { parseProject, serializeProject, FILE_SIGNATURE } from '@/services/project/fileFormat';
export type { DiagramFile } from '@/services/project/fileFormat';

// Export helpers
export { exportSvg, exportPng, exportPdf, exportJson, exportZip } from '@/services/export';
export type { ExportFormat, RasterExportOptions } from '@/services/export';

// Templates
export { DIAGRAM_TEMPLATES, loadTemplate } from '@/templates';
export type { DiagramTemplate } from '@/templates';

// Share URLs
export { encodeShareHash, decodeShareHash, buildShareUrl } from '@/services/share/urlShare';
export type { ShareLoadResult } from '@/services/share/urlShare';

// Source editor helpers
export { projectToSourceText, applySourceToCanvas } from '@/services/sourceEditor';
export type { SourceFormat } from '@/services/sourceEditor';

// Factory helpers for programmatic diagram building
export { createProject, createPage, createShape, createEdge, createLayer } from '@/models/factory';

// Plugins (advanced)
export { pluginManager } from '@/plugins/registry';
export type { Plugin } from '@/plugins/types';
