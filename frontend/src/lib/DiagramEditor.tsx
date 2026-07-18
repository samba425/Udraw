/**
 * Embeddable diagram editor — drop into any React 18+ / 19 app.
 * @module lib/DiagramEditor
 */
import { useEffect, useRef, useState } from 'react';
import { EditorLayout } from '@/app/EditorLayout';
import { registerBuiltinPlugins } from '@/plugins';
import { registerBuiltinLibraries } from '@/shapes/libraries';
import { createProject } from '@/models/factory';
import { resolveTheme } from '@/hooks/useTheme';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { useProjectStore } from '@/state/projectStore';
import { resetRuntimeConfig, setRuntimeConfig } from './runtimeConfig';
import type { DiagramEditorProps } from './types';
import '@/styles/index.css';

let bootstrapped = false;

function ensureBootstrapped(): void {
  if (bootstrapped) return;
  registerBuiltinLibraries();
  registerBuiltinPlugins();
  bootstrapped = true;
}

/**
 * Full DiagramForge editor as a React component.
 *
 * @example
 * ```tsx
 * import { DiagramEditor } from '@diagramforge/react';
 * import '@diagramforge/react/styles.css';
 *
 * export function Page() {
 *   return (
 *     <DiagramEditor
 *       height="80vh"
 *       onChange={(project) => console.log('saved', project.id)}
 *     />
 *   );
 * }
 * ```
 */
export function DiagramEditor({
  initialProject,
  onChange,
  readOnly = false,
  apiBaseUrl,
  features,
  themeMode = 'system',
  height = '100%',
  width = '100%',
  style,
  className,
  standalone = false,
}: DiagramEditorProps): React.JSX.Element {
  ensureBootstrapped();

  const rootRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(themeMode));

  useEffect(() => {
    setRuntimeConfig({ apiBaseUrl, features, onChange, standalone });
  }, [apiBaseUrl, features, onChange, standalone]);

  useEffect(() => {
    useEditorStore.getState().setThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const apply = (): void => {
      const resolved = resolveTheme(themeMode);
      setResolvedTheme(resolved);
      rootRef.current?.setAttribute('data-theme', resolved);
    };
    apply();
    if (themeMode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [themeMode]);

  useEffect(() => {
    const project = initialProject ?? createProject();
    useProjectStore.getState().replaceProject(project);
    useHistoryStore.getState().clear();
  }, [initialProject]);

  useEffect(() => {
    useEditorStore.getState().setReadOnly(readOnly);
  }, [readOnly]);

  useEffect(() => {
    if (standalone) {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }
  }, [standalone, resolvedTheme]);

  useEffect(() => {
    if (!onChange) return;
    return useProjectStore.subscribe((state, prev) => {
      if (state.project !== prev.project) {
        onChangeRef.current?.(state.project);
      }
    });
  }, [onChange]);

  useEffect(
    () => () => {
      resetRuntimeConfig();
      useProjectStore.getState().replaceProject(createProject());
      useHistoryStore.getState().clear();
      useEditorStore.getState().setReadOnly(false);
      useEditorStore.getState().clearSelection();
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      className={className ? `diagramforge-root ${className}` : 'diagramforge-root'}
      data-theme={resolvedTheme}
      style={{ height, width, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}
    >
      <EditorLayout />
    </div>
  );
}
