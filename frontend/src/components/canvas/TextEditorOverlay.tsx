/**
 * Inline text editor. When a shape (or edge) is being edited, this renders an
 * HTML textarea positioned over the element in screen space, committing the
 * text to the document on blur or Enter.
 * @module components/canvas/TextEditorOverlay
 */
import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { useHistory } from '@/hooks/useHistory';
import { worldToScreen } from '@/utils/geometry';

/** Absolutely-positioned inline editor for shape/edge labels. */
export function TextEditorOverlay(): React.JSX.Element | null {
  const editingId = useEditorStore((s) => s.editingTextId);
  const setEditingText = useEditorStore((s) => s.setEditingText);
  const camera = useEditorStore((s) => s.camera);
  const project = useProjectStore((s) => s.project);
  const activePageId = useProjectStore((s) => s.activePageId);
  const updateShape = useProjectStore((s) => s.updateShape);
  const updateEdge = useProjectStore((s) => s.updateEdge);
  const history = useHistory();
  const ref = useRef<HTMLTextAreaElement>(null);

  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0]!;
  const shape = editingId ? page.shapes[editingId] : undefined;
  const edge = editingId ? page.edges[editingId] : undefined;

  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (shape) setDraft(shape.text);
    else if (edge) setDraft(edge.label);
    if (editingId) requestAnimationFrame(() => ref.current?.focus());
  }, [editingId, shape, edge]);

  if (!editingId || (!shape && !edge)) return null;

  const commit = (): void => {
    if (shape) history.run('Edit text', () => updateShape(shape.id, { text: draft }));
    else if (edge) history.run('Edit label', () => updateEdge(edge.id, { label: draft }));
    setEditingText(null);
  };

  const cancel = (): void => setEditingText(null);

  let left: number;
  let top: number;
  let width: number;
  let height: number;
  if (shape) {
    const p = worldToScreen({ x: shape.x, y: shape.y }, camera);
    left = p.x;
    top = p.y;
    width = shape.width * camera.zoom;
    height = shape.height * camera.zoom;
  } else {
    const src = edge!.source.point ?? { x: 0, y: 0 };
    const p = worldToScreen(src, camera);
    left = p.x - 60;
    top = p.y - 14;
    width = 120;
    height = 28;
  }

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          commit();
        }
      }}
      className="absolute z-40 resize-none rounded border bordered p-1 text-center"
      style={{
        left,
        top,
        width: Math.max(width, 40),
        height: Math.max(height, 24),
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        outline: '2px solid var(--color-accent)',
        fontSize: (shape?.typography.fontSize ?? 14) * camera.zoom,
      }}
      aria-label="Edit label"
    />
  );
}
