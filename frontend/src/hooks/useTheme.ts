/**
 * Applies the selected theme mode to the document root by toggling the
 * `data-theme` attribute. Resolves `system` via `prefers-color-scheme`.
 * @module hooks/useTheme
 */
import { useEffect } from 'react';
import { useEditorStore } from '@/state/editorStore';
import type { ThemeMode } from '@/types';

/** Resolve a theme mode to a concrete `light`/`dark` value. */
export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

/** Hook that keeps `<html data-theme>` in sync with the store. */
export function useTheme(): void {
  const mode = useEditorStore((s) => s.themeMode);

  useEffect(() => {
    const apply = (): void => {
      document.documentElement.setAttribute('data-theme', resolveTheme(mode));
    };
    apply();

    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [mode]);
}
