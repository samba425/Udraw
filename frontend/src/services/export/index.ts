/**
 * High-level export API. Produces SVG, PNG, PDF, JSON, and ZIP-project
 * downloads from the current project/page. All work happens client-side.
 * @module services/export
 */
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import type { Page, Project } from '@/types';
import { serializeProject } from '@/services/project/fileFormat';
import { downloadBlob, downloadText, safeFileName } from '@/services/download';
import { pluginManager } from '@/plugins/registry';
import { serializePageToSvg } from './serializeSvg';
import { rasterizeToBlob, rasterizeToDataUrl } from './raster';

/** Supported export formats. */
export type ExportFormat = 'svg' | 'png' | 'pdf' | 'json' | 'zip';

/** Options shared across raster exports. */
export interface RasterExportOptions {
  scale?: number;
  background?: string;
}

/** Export a single page as an SVG file. */
export function exportSvg(project: Project, page: Page): void {
  const { svg } = serializePageToSvg(project, page);
  downloadText(svg, `${fileBase(project, page)}.svg`, 'image/svg+xml');
}

/** Export a single page as a PNG file. */
export async function exportPng(
  project: Project,
  page: Page,
  options: RasterExportOptions = {},
): Promise<void> {
  const { svg, width, height } = serializePageToSvg(project, page, {
    background: options.background,
  });
  const blob = await rasterizeToBlob(svg, width, height, {
    scale: options.scale ?? 2,
    type: 'image/png',
  });
  downloadBlob(blob, `${fileBase(project, page)}.png`);
}

/** Export a single page as a PDF (rasterized image embedded at page size). */
export async function exportPdf(
  project: Project,
  page: Page,
  options: RasterExportOptions = {},
): Promise<void> {
  const { svg, width, height } = serializePageToSvg(project, page, {
    background: options.background ?? '#ffffff',
  });
  const { dataUrl } = await rasterizeToDataUrl(svg, width, height, {
    scale: options.scale ?? 2,
    background: options.background ?? '#ffffff',
  });
  const orientation = width >= height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: [width, height] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
  pdf.save(`${fileBase(project, page)}.pdf`);
}

/** Export the whole project as a JSON document. */
export function exportJson(project: Project): void {
  downloadText(serializeProject(project), `${safeFileName(project.name)}.dgm.json`, 'application/json');
}

/**
 * Export the whole project as a ZIP bundle containing the JSON document plus a
 * rendered SVG for every page (handy for sharing/printing).
 */
export async function exportZip(project: Project): Promise<void> {
  const zip = new JSZip();
  zip.file(`${safeFileName(project.name)}.dgm.json`, serializeProject(project));
  const svgFolder = zip.folder('pages');
  project.pages.forEach((page, i) => {
    const { svg } = serializePageToSvg(project, page);
    svgFolder?.file(`${String(i + 1).padStart(2, '0')}-${safeFileName(page.name, 'page')}.svg`, svg);
  });
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  downloadBlob(blob, `${safeFileName(project.name)}.zip`);
}

/** Run a plugin-contributed exporter by id, downloading its output. */
export function exportWithPlugin(exporterId: string, project: Project, page: Page): void {
  const exporter = pluginManager.exporters().find((e) => e.id === exporterId);
  if (!exporter) throw new Error(`Unknown exporter: ${exporterId}`);
  const content = exporter.serialize(project, page);
  downloadText(
    content,
    `${fileBase(project, page)}.${exporter.extension}`,
    exporter.mimeType ?? 'text/plain',
  );
}

/** Build a `project-page` file base name. */
function fileBase(project: Project, page: Page): string {
  const proj = safeFileName(project.name);
  const pg = safeFileName(page.name, 'page');
  return project.pages.length > 1 ? `${proj}-${pg}` : proj;
}
