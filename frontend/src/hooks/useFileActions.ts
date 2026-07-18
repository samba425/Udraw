/**
 * Bridges file-related event-bus requests (export/import) to the services
 * layer, using the live project/page from the stores. Mounted once near the
 * editor root.
 * @module hooks/useFileActions
 */
import { useEffect } from 'react';
import { editorBus } from '@/utils/eventBus';
import { useProjectStore } from '@/state/projectStore';
import {
  exportJson,
  exportPdf,
  exportPng,
  exportSvg,
  exportZip,
  type ExportFormat,
} from '@/services/export';
import { importFile } from '@/services/import';

/** Accepted import file extensions/types. */
const IMPORT_ACCEPT = '.json,.dgm.json,.svg,.drawio,.xml,image/*';

/** Open a file picker and import the chosen file. */
function openImportPicker(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = IMPORT_ACCEPT;
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) void importFile(file);
  };
  input.click();
}

/** Perform an export of the current project/active page in the given format. */
async function runExport(format: ExportFormat): Promise<void> {
  const store = useProjectStore.getState();
  const project = store.project;
  const page = store.activePage();
  switch (format) {
    case 'svg':
      exportSvg(project, page);
      break;
    case 'png':
      await exportPng(project, page);
      break;
    case 'pdf':
      await exportPdf(project, page);
      break;
    case 'json':
      exportJson(project);
      break;
    case 'zip':
      await exportZip(project);
      break;
  }
}

/** Wire export/import bus events to the services layer. */
export function useFileActions(): void {
  useEffect(() => {
    const offExport = editorBus.on('export:request', ({ format }) => {
      runExport(format).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Export failed';
        editorBus.emit('toast', { message, kind: 'error' });
      });
    });
    const offImport = editorBus.on('import:request', () => openImportPicker());
    return () => {
      offExport();
      offImport();
    };
  }, []);
}
