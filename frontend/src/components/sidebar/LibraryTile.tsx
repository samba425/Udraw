/**
 * A single draggable library icon tile. Renders the icon preview, supports
 * click-to-place and drag-to-canvas, and exposes a favorite toggle.
 * @module components/sidebar/LibraryTile
 */
import { memo } from 'react';
import { Star } from 'lucide-react';
import type { LibraryIcon } from '@/shapes/registry';
import { useEditorStore } from '@/state/editorStore';
import { useLibraryStore } from '@/state/libraryStore';
import { placeLibraryIcon } from '@/engine/commands/actions';
import { screenToWorld } from '@/utils/geometry';

/** MIME-like key used to carry the icon id through a drag operation. */
export const ICON_DND_TYPE = 'application/x-drawio-icon';

interface LibraryTileProps {
  icon: LibraryIcon;
}

/** Place an icon at the current viewport center (used for click-to-add). */
function placeAtViewportCenter(icon: LibraryIcon): void {
  const camera = useEditorStore.getState().camera;
  const el = document.querySelector('[aria-label="Diagram canvas"]');
  const rect = el?.getBoundingClientRect();
  const center = screenToWorld(
    { x: (rect?.width ?? 800) / 2, y: (rect?.height ?? 600) / 2 },
    camera,
  );
  placeLibraryIcon(icon, center);
}

/** Draggable library tile. */
export const LibraryTile = memo(function LibraryTile({
  icon,
}: LibraryTileProps): React.JSX.Element {
  const isFavorite = useLibraryStore((s) => s.favorites.includes(icon.id));
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  return (
    <div className="group relative">
      <button
        type="button"
        title={icon.label}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(ICON_DND_TYPE, icon.id);
          e.dataTransfer.setData('text/plain', icon.label);
          e.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={() => placeAtViewportCenter(icon)}
        className="df-focus-ring flex aspect-square w-full cursor-grab items-center justify-center rounded-md border bordered p-1 transition-colors hover:bg-[var(--color-surface-alt)] active:cursor-grabbing"
      >
        <svg viewBox={`0 0 ${icon.viewSize} ${icon.viewSize}`} className="h-8 w-8" aria-hidden>
          <g dangerouslySetInnerHTML={{ __html: icon.body }} />
        </svg>
      </button>
      <button
        type="button"
        aria-label={isFavorite ? `Unfavorite ${icon.label}` : `Favorite ${icon.label}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(icon.id);
        }}
        className={`absolute right-0.5 top-0.5 rounded p-0.5 transition-opacity ${
          isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ color: isFavorite ? '#f59e0b' : 'var(--color-text-muted)' }}
      >
        <Star size={12} fill={isFavorite ? '#f59e0b' : 'none'} />
      </button>
    </div>
  );
});
