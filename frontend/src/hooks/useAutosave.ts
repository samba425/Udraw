/**
 * Autosave + recovery. On mount, restores the most recent project from
 * IndexedDB; thereafter it debounces document changes and persists them every
 * ~3 seconds (per the design spec). Fully offline.
 * @module hooks/useAutosave
 */
import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { loadLastProject, saveProject } from '@/services/storage/db';

const AUTOSAVE_DELAY_MS = 3000;

/** Status surfaced to the UI (status bar). */
export type SaveStatus = 'idle' | 'saving' | 'saved';

/** Restore on mount and autosave on change. Returns the current save status. */
export function useAutosave(): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const restored = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore the last project once on startup (skip if a share URL already loaded).
  useEffect(() => {
    if (window.location.hash.startsWith('#d=')) {
      restored.current = true;
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const project = await loadLastProject();
        if (!cancelled && project) {
          useProjectStore.getState().replaceProject(project);
        }
      } finally {
        restored.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced autosave whenever the document changes.
  useEffect(() => {
    const unsubscribe = useProjectStore.subscribe((state, prev) => {
      if (!restored.current || state.project === prev.project) return;
      setStatus('saving');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void saveProject(useProjectStore.getState().project).then(() => setStatus('saved'));
      }, AUTOSAVE_DELAY_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return status;
}
