/**
 * Thin React hook wrapper around the history store, exposing a stable API to
 * the interaction layer.
 * @module hooks/useHistory
 */
import { useMemo } from 'react';
import { useHistoryStore } from '@/state/historyStore';

/** Access history operations (begin/commit/run/undo/redo). */
export function useHistory() {
  return useMemo(
    () => ({
      begin: (): void => useHistoryStore.getState().capture(),
      commit: (label: string): void => useHistoryStore.getState().commit(label),
      cancel: (): void => useHistoryStore.getState().cancel(),
      run: (label: string, mutate: () => void): void =>
        useHistoryStore.getState().run(label, mutate),
      undo: (): void => useHistoryStore.getState().undo(),
      redo: (): void => useHistoryStore.getState().redo(),
    }),
    [],
  );
}
