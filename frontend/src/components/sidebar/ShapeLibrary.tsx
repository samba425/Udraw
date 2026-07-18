/**
 * Searchable shape-library browser. Shows a Favorites section, then every
 * built-in category and any imported custom SVG icons. Typing filters across
 * all libraries by label/keyword.
 * @module components/sidebar/ShapeLibrary
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { allIcons, iconsByCategory, type LibraryIcon } from '@/shapes/registry';
import { LIBRARY_CATEGORIES } from '@/shapes/libraries';
import { useLibraryStore } from '@/state/libraryStore';
import { LibraryTile } from './LibraryTile';

/** Grid of tiles for a set of icons. */
function TileGrid({ icons }: { icons: LibraryIcon[] }): React.JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      {icons.map((icon) => (
        <LibraryTile key={icon.id} icon={icon} />
      ))}
    </div>
  );
}

interface CategoryProps {
  title: string;
  icons: LibraryIcon[];
  defaultOpen?: boolean;
}

/** A single collapsible category section. */
function Category({ title, icons, defaultOpen = false }: CategoryProps): React.JSX.Element | null {
  const [open, setOpen] = useState(defaultOpen);
  if (icons.length === 0) return null;
  return (
    <section className="border-b bordered">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="df-focus-ring flex w-full items-center gap-1 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-text-muted)' }}
        aria-expanded={open}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {title}
        <span className="ml-auto font-normal">{icons.length}</span>
      </button>
      {open && <div className="px-3 pb-3">{<TileGrid icons={icons} />}</div>}
    </section>
  );
}

/** The searchable library browser. */
export function ShapeLibrary(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const favorites = useLibraryStore((s) => s.favorites);
  const customIcons = useLibraryStore((s) => s.customIcons);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return allIcons().filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.keywords ?? []).some((k) => k.includes(q)),
    );
  }, [query]);

  const favoriteIcons = useMemo(
    () => favorites.map((id) => allIcons().find((i) => i.id === id)).filter((i): i is LibraryIcon => Boolean(i)),
    [favorites],
  );

  return (
    <div className="flex flex-col">
      <div className="border-b bordered p-2">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shapes…"
            aria-label="Search shapes"
            className="df-focus-ring w-full rounded-md border bordered py-1.5 pl-7 pr-2 text-sm"
            style={{ background: 'var(--color-surface-alt)' }}
          />
        </div>
      </div>

      {results ? (
        results.length > 0 ? (
          <div className="px-3 py-3">
            <TileGrid icons={results} />
          </div>
        ) : (
          <p className="px-3 py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            No shapes match “{query}”.
          </p>
        )
      ) : (
        <>
          {favoriteIcons.length > 0 && (
            <Category title="Favorites" icons={favoriteIcons} defaultOpen />
          )}
          {LIBRARY_CATEGORIES.map((cat, i) => (
            <Category key={cat} title={cat} icons={iconsByCategory(cat)} defaultOpen={i === 0} />
          ))}
          <Category title="Custom SVG" icons={customIcons} />
        </>
      )}
    </div>
  );
}
