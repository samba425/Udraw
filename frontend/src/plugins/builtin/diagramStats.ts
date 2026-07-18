/**
 * Example plugin: adds a command + toolbar button + shortcut that reports the
 * number of shapes, connectors, layers, and pages via a toast. Serves as a
 * reference implementation of the plugin API.
 * @module plugins/builtin/diagramStats
 */
import type { Plugin } from '@/plugins/types';

export const diagramStatsPlugin: Plugin = {
  id: 'builtin.diagram-stats',
  name: 'Diagram Stats',
  version: '1.0.0',
  description: 'Reports counts of shapes, connectors, layers, and pages.',
  activate(ctx) {
    ctx.registerCommand({
      id: 'diagram-stats.show',
      title: 'Diagram statistics',
      icon: 'BarChart3',
      run: () => {
        const page = ctx.getActivePage();
        const project = ctx.getProject();
        const shapes = Object.values(page.shapes).filter((s) => s.kind !== 'group').length;
        const edges = Object.keys(page.edges).length;
        ctx.notify(
          `${shapes} shapes · ${edges} connectors · ${page.layers.length} layers · ${project.pages.length} pages`,
          'info',
        );
      },
    });
    ctx.registerToolbarItem({
      id: 'diagram-stats.toolbar',
      title: 'Diagram statistics',
      icon: 'BarChart3',
      command: 'diagram-stats.show',
    });
    ctx.registerShortcut({ combo: 'mod+shift+i', command: 'diagram-stats.show' });
  },
};
