/**
 * High-level import API. Accepts a user-selected `File`, detects its type, and
 * applies the result to the stores (replacing the project for JSON, or adding
 * shapes for images/SVG/draw.io). All parsing is client-side and hardened
 * against XXE and script injection.
 * @module services/import
 */
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { useLibraryStore } from '@/state/libraryStore';
import { editorBus } from '@/utils/eventBus';
import { createId, createShape } from '@/models/factory';
import { parseProject } from '@/services/project/fileFormat';
import { screenToWorld } from '@/utils/geometry';
import type { LibraryIcon } from '@/shapes/registry';
import { pluginManager } from '@/plugins/registry';
import { sanitizeSvg } from './sanitizeSvg';
import { parseDrawio } from './drawio';

/** Read a File as UTF-8 text. */
function readText(file: File): Promise<string> {
  return file.text();
}

/** Read a File as a data URL. */
function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/** Load an image data URL to discover its intrinsic size. */
function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 200, height: img.naturalHeight || 200 });
    img.onerror = () => resolve({ width: 200, height: 200 });
    img.src = dataUrl;
  });
}

/** The world-space center of the current viewport. */
function viewportCenter(): { x: number; y: number } {
  const camera = useEditorStore.getState().camera;
  const el = document.querySelector('[aria-label="Diagram canvas"]');
  const rect = el?.getBoundingClientRect();
  return screenToWorld({ x: (rect?.width ?? 800) / 2, y: (rect?.height ?? 600) / 2 }, camera);
}

/** Import a JSON project document, replacing the current project. */
async function importJsonProject(file: File): Promise<void> {
  const project = parseProject(await readText(file));
  useProjectStore.getState().replaceProject(project);
  useHistoryStore.getState().clear();
  editorBus.emit('toast', { message: `Opened “${project.name}”.`, kind: 'success' });
}

/** Import a raster image as an image shape. */
async function importImage(file: File): Promise<void> {
  const dataUrl = await readDataUrl(file);
  const { width, height } = await imageSize(dataUrl);
  const store = useProjectStore.getState();
  const page = store.activePage();
  const center = viewportCenter();
  const shape = createShape(
    {
      kind: 'image',
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
      src: dataUrl,
      fill: { type: 'none', color: 'none' },
      stroke: 'none',
      strokeWidth: 0,
    },
    page.layers[0]!.id,
  );
  useHistoryStore.getState().run('Import image', () => {
    store.addShape(shape);
    useEditorStore.getState().select([shape.id]);
  });
  editorBus.emit('toast', { message: 'Image imported.', kind: 'success' });
}

/** Import an SVG: sanitize, add to the Custom SVG library, and place it. */
async function importSvg(file: File): Promise<void> {
  const sanitized = sanitizeSvg(await readText(file));
  const icon: LibraryIcon = {
    id: createId('custom'),
    label: file.name.replace(/\.svg$/i, '').slice(0, 40) || 'Custom SVG',
    category: 'Custom SVG',
    viewSize: sanitized.viewSize,
    body: sanitized.body,
    defaultSize: { width: sanitized.width, height: sanitized.height },
    keywords: ['custom', 'svg'],
  };
  useLibraryStore.getState().addCustomIcon(icon);

  const store = useProjectStore.getState();
  const page = store.activePage();
  const center = viewportCenter();
  const shape = createShape(
    {
      kind: 'icon',
      libraryId: icon.id,
      x: center.x - icon.defaultSize!.width / 2,
      y: center.y - icon.defaultSize!.height / 2,
      width: icon.defaultSize!.width,
      height: icon.defaultSize!.height,
      fill: { type: 'none', color: 'none' },
      stroke: 'none',
      strokeWidth: 0,
    },
    page.layers[0]!.id,
  );
  useHistoryStore.getState().run('Import SVG', () => {
    store.addShape(shape);
    useEditorStore.getState().select([shape.id]);
  });
  editorBus.emit('toast', { message: 'SVG imported to Custom library.', kind: 'success' });
}

/** Import a draw.io/diagrams.net XML document, adding its cells. */
async function importDrawio(file: File): Promise<void> {
  const store = useProjectStore.getState();
  const page = store.activePage();
  const { shapes, edges } = parseDrawio(await readText(file), page.layers[0]!.id);
  useHistoryStore.getState().run('Import draw.io', () => {
    store.addShapes(shapes);
    for (const edge of edges) store.addEdge(edge);
    useEditorStore.getState().select(shapes.map((s) => s.id));
  });
  editorBus.emit('toast', {
    message: `Imported ${shapes.length} shapes and ${edges.length} connectors.`,
    kind: 'success',
  });
}

/**
 * Import a user-selected file, dispatching by extension/MIME type. Errors are
 * surfaced as toasts.
 */
export async function importFile(file: File): Promise<void> {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop() ?? '';
  try {
    // Plugin-contributed importers take precedence for their extensions.
    const importer = pluginManager.importers().find((i) => i.extensions.includes(ext));
    if (importer) {
      await importer.handle(await readText(file), pluginManager.buildContext());
      return;
    }

    if (name.endsWith('.drawio') || name.endsWith('.xml')) {
      await importDrawio(file);
    } else if (name.endsWith('.svg') || file.type === 'image/svg+xml') {
      await importSvg(file);
    } else if (file.type.startsWith('image/')) {
      await importImage(file);
    } else if (name.endsWith('.json') || file.type === 'application/json') {
      await importJsonProject(file);
    } else {
      throw new Error(`Unsupported file type: ${file.name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed.';
    editorBus.emit('toast', { message, kind: 'error' });
  }
}
