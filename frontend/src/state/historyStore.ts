/**
 * Undo/redo history using immutable project snapshots. Because every document
 * mutation produces a new immutable `Project`, snapshots are cheap references
 * rather than deep clones. Phase 3 layers named commands on top of this.
 * @module state/historyStore
 */
import { create } from 'zustand';
import type { Project } from '@/types';
import { useProjectStore } from './projectStore';
import { editorBus } from '@/utils/eventBus';

/** One reversible step in the timeline. */
interface HistoryEntry {
  label: string;
  project: Project;
}

const MAX_ENTRIES = 500;

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  baseline: Project | null;

  /** Snapshot the current project as the pre-mutation baseline. */
  capture: () => void;
  /** Finalize a step; records it only if the project actually changed. */
  commit: (label: string) => void;
  /** Abandon a captured baseline without recording a step. */
  cancel: () => void;
  /** Convenience: capture, run a mutation, then commit under `label`. */
  run: (label: string, mutate: () => void) => void;

  undo: () => void;
  redo: () => void;
  clear: () => void;
}

function notify(state: HistoryState): void {
  editorBus.emit('history:changed', {
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  });
}

/** Zustand store backing undo/redo. */
export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  baseline: null,

  capture: () => set({ baseline: useProjectStore.getState().project }),

  commit: (label) => {
    const { baseline } = get();
    const current = useProjectStore.getState().project;
    if (!baseline || baseline === current) {
      set({ baseline: null });
      return;
    }
    const past = [...get().past, { label, project: baseline }].slice(-MAX_ENTRIES);
    set({ past, future: [], baseline: null });
    notify(get());
  },

  cancel: () => set({ baseline: null }),

  run: (label, mutate) => {
    get().capture();
    mutate();
    get().commit(label);
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;
    const entry = past[past.length - 1]!;
    const current = useProjectStore.getState().project;
    useProjectStore.getState().replaceProject(entry.project);
    set({
      past: past.slice(0, -1),
      future: [{ label: entry.label, project: current }, ...get().future],
    });
    notify(get());
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;
    const entry = future[0]!;
    const current = useProjectStore.getState().project;
    useProjectStore.getState().replaceProject(entry.project);
    set({
      future: future.slice(1),
      past: [...get().past, { label: entry.label, project: current }],
    });
    notify(get());
  },

  clear: () => {
    set({ past: [], future: [], baseline: null });
    notify(get());
  },
}));
