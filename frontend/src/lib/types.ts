/**
 * Public props for the embeddable {@link DiagramEditor} component.
 * @module lib/types
 */
import type { CSSProperties } from 'react';
import type { Project, ThemeMode } from '@/types';
import type { DiagramEditorFeatures } from './runtimeConfig';

/** Props for {@link DiagramEditor}. */
export interface DiagramEditorProps {
  /** Initial diagram document. Updates when the prop reference changes. */
  initialProject?: Project;
  /** Called whenever the document changes (debounced by React batching). */
  onChange?: (project: Project) => void;
  /** View-only mode — pan/zoom only. */
  readOnly?: boolean;
  /** Backend base URL for AI generation (overrides `VITE_API_BASE_URL`). */
  apiBaseUrl?: string;
  /** Feature toggles. Unlisted features default to enabled except welcome/persistence in embed mode. */
  features?: DiagramEditorFeatures;
  /** Color theme. Default: `system`. */
  themeMode?: ThemeMode;
  /** Container height. Default: `100%`. */
  height?: CSSProperties['height'];
  /** Container width. Default: `100%`. */
  width?: CSSProperties['width'];
  /** Additional wrapper styles. */
  style?: CSSProperties;
  /** Optional CSS class on the root wrapper. */
  className?: string;
  /**
   * Standalone app mode — enables welcome dialog and IndexedDB autosave.
   * Used by the first-party SPA; embed consumers usually leave this false.
   */
  standalone?: boolean;
}
