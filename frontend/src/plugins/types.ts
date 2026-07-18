/**
 * Public plugin API types. A plugin is a plain object with an `activate`
 * function that receives a {@link PluginContext} and registers contributions
 * (shapes, commands, toolbar items, menu items, exporters, importers, and
 * keyboard shortcuts). Everything is framework-agnostic so plugins never need
 * to import React.
 * @module plugins/types
 */
import type { LibraryIcon } from '@/shapes/registry';
import type { Project, Page } from '@/types';

/** A command that can be invoked from menus, the toolbar, or shortcuts. */
export interface CommandContribution {
  id: string;
  title: string;
  /** Optional named lucide icon for UI affordances. */
  icon?: string;
  run: () => void;
}

/** A toolbar button contributed by a plugin. */
export interface ToolbarContribution {
  id: string;
  title: string;
  icon?: string;
  /** The command id to run when clicked. */
  command: string;
}

/** A context-menu item contributed by a plugin. */
export interface MenuContribution {
  id: string;
  title: string;
  command: string;
  /** Only show when at least one element is selected. */
  requiresSelection?: boolean;
}

/** A keyboard shortcut contributed by a plugin. */
export interface ShortcutContribution {
  /** Human-readable combo, e.g. `mod+shift+k`. `mod` == Ctrl/Cmd. */
  combo: string;
  command: string;
}

/** An exporter contributed by a plugin. */
export interface ExporterContribution {
  id: string;
  /** Menu label, e.g. `Export as Mermaid`. */
  title: string;
  /** File extension without a dot. */
  extension: string;
  /** Produce the file contents for a project/page. */
  serialize: (project: Project, page: Page) => string;
  mimeType?: string;
}

/** An importer contributed by a plugin. */
export interface ImporterContribution {
  id: string;
  title: string;
  /** Lowercase file extensions this importer accepts (no dot). */
  extensions: string[];
  /** Parse file text and apply results (via the context stores). */
  handle: (text: string, ctx: PluginContext) => void | Promise<void>;
}

/** The API surface handed to a plugin during activation. */
export interface PluginContext {
  /** Register one or more colored library icons. */
  registerShapes: (icons: LibraryIcon[]) => void;
  registerCommand: (command: CommandContribution) => void;
  registerToolbarItem: (item: ToolbarContribution) => void;
  registerMenuItem: (item: MenuContribution) => void;
  registerShortcut: (shortcut: ShortcutContribution) => void;
  registerExporter: (exporter: ExporterContribution) => void;
  registerImporter: (importer: ImporterContribution) => void;
  /** Read-only access to the current project and active page. */
  getProject: () => Project;
  getActivePage: () => Page;
  /** Show a toast notification. */
  notify: (message: string, kind?: 'info' | 'success' | 'error') => void;
}

/** A DiagramForge plugin. */
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  activate: (ctx: PluginContext) => void;
}
