/**
 * The plugin manager. Holds registered plugins and their contributions and
 * exposes typed accessors for the UI. Contributions are collected as plugins
 * activate; `plugins:changed` fires whenever the set changes so React views
 * can refresh.
 * @module plugins/registry
 */
import { registerIcons } from '@/shapes/registry';
import { useProjectStore } from '@/state/projectStore';
import { editorBus } from '@/utils/eventBus';
import type {
  CommandContribution,
  ExporterContribution,
  ImporterContribution,
  MenuContribution,
  Plugin,
  PluginContext,
  ShortcutContribution,
  ToolbarContribution,
} from './types';

interface Contributions {
  commands: Map<string, CommandContribution>;
  toolbar: ToolbarContribution[];
  menu: MenuContribution[];
  shortcuts: ShortcutContribution[];
  exporters: ExporterContribution[];
  importers: ImporterContribution[];
}

/** Manages plugin lifecycle and contribution collection. */
class PluginManager {
  private plugins = new Map<string, Plugin>();
  private contributions: Contributions = {
    commands: new Map(),
    toolbar: [],
    menu: [],
    shortcuts: [],
    exporters: [],
    importers: [],
  };

  /** Build the activation context for a plugin (also used by importers). */
  buildContext(): PluginContext {
    return {
      registerShapes: (icons) => registerIcons(icons),
      registerCommand: (command) => this.contributions.commands.set(command.id, command),
      registerToolbarItem: (item) => this.contributions.toolbar.push(item),
      registerMenuItem: (item) => this.contributions.menu.push(item),
      registerShortcut: (shortcut) => this.contributions.shortcuts.push(shortcut),
      registerExporter: (exporter) => this.contributions.exporters.push(exporter),
      registerImporter: (importer) => this.contributions.importers.push(importer),
      getProject: () => useProjectStore.getState().project,
      getActivePage: () => useProjectStore.getState().activePage(),
      notify: (message, kind = 'info') => editorBus.emit('toast', { message, kind }),
    };
  }

  /** Register and activate a plugin (idempotent by id). */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) return;
    this.plugins.set(plugin.id, plugin);
    try {
      plugin.activate(this.buildContext());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      editorBus.emit('toast', { message: `Plugin “${plugin.name}” failed: ${message}`, kind: 'error' });
      return;
    }
    editorBus.emit('project:changed', { reason: 'plugin-registered' });
  }

  /** List all registered plugins. */
  list(): Plugin[] {
    return [...this.plugins.values()];
  }

  /** Run a command by id. */
  runCommand(id: string): void {
    this.contributions.commands.get(id)?.run();
  }

  /** Accessors for the UI. */
  toolbarItems(): ToolbarContribution[] {
    return this.contributions.toolbar;
  }
  menuItems(): MenuContribution[] {
    return this.contributions.menu;
  }
  shortcuts(): ShortcutContribution[] {
    return this.contributions.shortcuts;
  }
  exporters(): ExporterContribution[] {
    return this.contributions.exporters;
  }
  importers(): ImporterContribution[] {
    return this.contributions.importers;
  }
}

/** The shared plugin manager instance. */
export const pluginManager = new PluginManager();
