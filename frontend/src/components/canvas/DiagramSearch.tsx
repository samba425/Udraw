/**
 * In-diagram search. Opens with Ctrl/Cmd+F, matches shapes and connectors by
 * their text/label, and centers + selects a result on click. Overlays the
 * canvas in the top-right corner.
 * @module components/canvas/DiagramSearch
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';

interface Match {
  id: string;
  label: string;
  center: { x: number; y: number };
}

/** Floating search box for finding shapes/connectors by text. */
export function DiagramSearch(): React.JSX.Element | null {
  const open = useEditorStore((s) => s.searchOpen);
  const setSearchOpen = useEditorStore((s) => s.setSearchOpen);
  const page = useProjectStore((s) => s.activePage());
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const matches = useMemo<Match[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const found: Match[] = [];
    for (const shape of Object.values(page.shapes)) {
      if (shape.text && shape.text.toLowerCase().includes(q)) {
        found.push({
          id: shape.id,
          label: shape.text,
          center: { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 },
        });
      }
    }
    for (const edge of Object.values(page.edges)) {
      if (edge.label && edge.label.toLowerCase().includes(q)) {
        const src = edge.source.shapeId ? page.shapes[edge.source.shapeId] : undefined;
        const center = src
          ? { x: src.x + src.width / 2, y: src.y + src.height / 2 }
          : (edge.source.point ?? { x: 0, y: 0 });
        found.push({ id: edge.id, label: edge.label, center });
      }
    }
    return found.slice(0, 50);
  }, [query, page]);

  if (!open) return null;

  const goTo = (match: Match): void => {
    const rect = document.querySelector('[aria-label="Diagram canvas"]')?.getBoundingClientRect();
    useEditorStore
      .getState()
      .centerOn(match.center, { width: rect?.width ?? 800, height: rect?.height ?? 600 });
    useEditorStore.getState().select([match.id]);
  };

  return (
    <div className="absolute right-3 top-3 z-20 w-64 rounded-lg border bordered shadow-lg surface">
      <div className="flex items-center gap-2 border-b bordered px-2 py-1.5">
        <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
          placeholder="Find in diagram…"
          aria-label="Find in diagram"
          className="df-focus-ring min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          aria-label="Close search"
          onClick={() => setSearchOpen(false)}
          className="rounded p-0.5 hover:brightness-125"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>
      {query.trim() && (
        <div className="df-scroll max-h-64 overflow-y-auto py-1">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No matches.
            </p>
          ) : (
            matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => goTo(match)}
                className="block w-full truncate px-3 py-1.5 text-left text-sm hover:brightness-125"
                style={{ color: 'var(--color-text)' }}
                title={match.label}
              >
                {match.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
