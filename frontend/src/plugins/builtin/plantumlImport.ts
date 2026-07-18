/**
 * Built-in PlantUML activity diagram importer.
 * @module plugins/builtin/plantumlImport
 */
import { importPlantUml } from '@/services/import/plantuml';
import type { Plugin } from '@/plugins/types';

const CMD_IMPORT = 'plantuml.import';

export const plantumlImportPlugin: Plugin = {
  id: 'builtin.plantuml-import',
  name: 'PlantUML Import',
  version: '1.0.0',
  description: 'Import PlantUML activity diagrams onto the canvas.',
  activate(ctx) {
    ctx.registerCommand({
      id: CMD_IMPORT,
      title: 'Import PlantUML',
      run: () => {
        const text = window.prompt(
          'Paste PlantUML source (activity :Step; syntax or A -> B arrows):',
        );
        if (!text?.trim()) return;
        try {
          importPlantUml(text.trim());
          ctx.notify('PlantUML diagram imported.', 'success');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'PlantUML import failed.';
          ctx.notify(message, 'error');
        }
      },
    });
    ctx.registerMenuItem({ id: 'plantuml-import', title: 'Import PlantUML...', command: CMD_IMPORT });
    ctx.registerImporter({
      id: 'plantuml',
      title: 'Import PlantUML',
      extensions: ['puml', 'plantuml', 'uml'],
      handle: (text) => {
        importPlantUml(text);
        ctx.notify('PlantUML diagram imported.', 'success');
      },
    });
  },
};
