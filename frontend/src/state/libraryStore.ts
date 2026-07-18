/**
 * Persistent UI state for the shape-library sidebar: favorite icons and
 * user-imported custom SVG icons. Persisted to localStorage so favorites and
 * custom shapes survive reloads.
 * @module state/libraryStore
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LibraryIcon } from '@/shapes/registry';
import { registerIcon } from '@/shapes/registry';

interface LibraryState {
  /** Ids of favorited library icons. */
  favorites: string[];
  /** User-imported custom SVG icons (already sanitized before storage). */
  customIcons: LibraryIcon[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addCustomIcon: (icon: LibraryIcon) => void;
  removeCustomIcon: (id: string) => void;
}

/** Zustand store for library favorites and custom icons. */
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      customIcons: [],
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),
      isFavorite: (id) => get().favorites.includes(id),
      addCustomIcon: (icon) => {
        registerIcon(icon);
        set((s) => ({
          customIcons: [...s.customIcons.filter((c) => c.id !== icon.id), icon],
        }));
      },
      removeCustomIcon: (id) =>
        set((s) => ({
          customIcons: s.customIcons.filter((c) => c.id !== id),
          favorites: s.favorites.filter((f) => f !== id),
        })),
    }),
    {
      name: 'drawio-library',
      // Re-register persisted custom icons into the registry on rehydrate.
      onRehydrateStorage: () => (state) => {
        state?.customIcons.forEach((icon) => registerIcon(icon));
      },
    },
  ),
);
