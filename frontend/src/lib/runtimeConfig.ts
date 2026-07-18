/**
 * Runtime configuration for standalone app vs embedded {@link DiagramEditor}.
 * Set by the editor on mount; read by hooks and services.
 * @module lib/runtimeConfig
 */
import type { Project } from '@/types';

/** Feature flags for embedded / standalone editor instances. */
export interface DiagramEditorFeatures {
  /** Show AI generation panel. Default: true. */
  ai?: boolean;
  /** Enable F5 presentation mode. Default: true. */
  presentation?: boolean;
  /** JSON / YAML / Mermaid source editor. Default: true. */
  sourceEditor?: boolean;
  /** Canvas minimap. Default: true. */
  minimap?: boolean;
  /** Welcome / recovery dialog on startup. Default: false in embed, true in standalone. */
  welcome?: boolean;
  /** Autosave to IndexedDB. Default: false in embed, true in standalone. */
  persistence?: boolean;
}

/** Internal runtime configuration. */
export interface DiagramForgeRuntimeConfig {
  apiBaseUrl?: string;
  features: Required<DiagramEditorFeatures>;
  onChange?: (project: Project) => void;
}

const DEFAULT_FEATURES: Required<DiagramEditorFeatures> = {
  ai: true,
  presentation: true,
  sourceEditor: true,
  minimap: true,
  welcome: false,
  persistence: false,
};

const STANDALONE_FEATURES: Required<DiagramEditorFeatures> = {
  ai: true,
  presentation: true,
  sourceEditor: true,
  minimap: true,
  welcome: true,
  persistence: true,
};

let config: DiagramForgeRuntimeConfig = {
  features: { ...DEFAULT_FEATURES },
};

/** Read the active runtime configuration. */
export function getRuntimeConfig(): DiagramForgeRuntimeConfig {
  return config;
}

/** Whether a feature flag is enabled (defaults to true when unset). */
export function isFeatureEnabled(feature: keyof DiagramEditorFeatures): boolean {
  return config.features[feature] ?? true;
}

/** Apply runtime options for an editor instance. */
export function setRuntimeConfig(partial: {
  apiBaseUrl?: string;
  features?: DiagramEditorFeatures;
  onChange?: (project: Project) => void;
  standalone?: boolean;
}): void {
  const base = partial.standalone ? STANDALONE_FEATURES : DEFAULT_FEATURES;
  config = {
    apiBaseUrl: partial.apiBaseUrl ?? config.apiBaseUrl,
    onChange: partial.onChange ?? config.onChange,
    features: { ...base, ...partial.features },
  };
}

/** Reset to defaults (called when an embedded editor unmounts). */
export function resetRuntimeConfig(): void {
  config = { features: { ...DEFAULT_FEATURES } };
}
