/**
 * Document tree: layers of shapes with expandable groups.
 * @module components/layers/ElementsPanel
 */
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, Folder, Square } from 'lucide-react';
import { useProjectStore } from '@/state/projectStore';
import { useEditorStore } from '@/state/editorStore';
import { useHistory } from '@/hooks/useHistory';
import { PanelSection } from '@/components/ui/Panel';
import type { Page, Shape } from '@/types';
import { isDescendantOf } from '@/models/groupMembership';

interface TreeNode {
  shape: Shape;
  children: TreeNode[];
}

function buildTree(page: Page): TreeNode[] {
  const byParent = new Map<string | undefined, Shape[]>();
  for (const shape of Object.values(page.shapes)) {
    const key = shape.parentId;
    const list = byParent.get(key) ?? [];
    list.push(shape);
    byParent.set(key, list);
  }
  const sortShapes = (shapes: Shape[]): Shape[] =>
    [...shapes].sort((a, b) => page.order.indexOf(a.id) - page.order.indexOf(b.id));

  const build = (parentId: string | undefined): TreeNode[] =>
    sortShapes(byParent.get(parentId) ?? []).map((shape) => ({
      shape,
      children: shape.kind === 'group' ? build(shape.id) : [],
    }));

  return build(undefined);
}

/** Expandable shape/group tree for selection and visibility. */
export function ElementsPanel(): React.JSX.Element {
  const project = useProjectStore((s) => s.project);
  const activePageId = useProjectStore((s) => s.activePageId);
  const updateShape = useProjectStore((s) => s.updateShape);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const select = useEditorStore((s) => s.select);
  const setActiveGroupId = useEditorStore((s) => s.setActiveGroupId);
  const activeGroupId = useEditorStore((s) => s.activeGroupId);
  const history = useHistory();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0]!;
  const tree = useMemo(() => buildTree(page), [page]);

  const toggleExpanded = (id: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth = 0): React.JSX.Element => {
    const { shape } = node;
    const isGroup = shape.kind === 'group';
    const isOpen = expanded.has(shape.id);
    const selected = selectedIds.includes(shape.id);
    const label = shape.text?.trim() || (isGroup ? 'Group' : shape.kind);

    return (
      <li key={shape.id}>
        <div
          className="flex items-center gap-0.5 rounded-md py-0.5 pr-1"
          style={{
            paddingLeft: depth * 12,
            background: selected ? 'color-mix(in srgb, var(--color-selection) 18%, transparent)' : undefined,
          }}
        >
          {isGroup ? (
            <button
              type="button"
              aria-label={isOpen ? 'Collapse group' : 'Expand group'}
              onClick={() => toggleExpanded(shape.id)}
              className="inline-flex h-6 w-5 items-center justify-center rounded"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : (
            <span className="inline-block w-5" />
          )}
          <button
            type="button"
            title={shape.hidden ? 'Show' : 'Hide'}
            onClick={() => history.run('Toggle visibility', () => updateShape(shape.id, { hidden: !shape.hidden }))}
            className="inline-flex h-6 w-5 items-center justify-center rounded"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {shape.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-1 truncate text-left text-xs"
            style={{ color: 'var(--color-text)' }}
            onClick={() => {
              select([shape.id]);
              if (isGroup) setActiveGroupId(shape.id);
              else if (activeGroupId && isDescendantOf(page, shape.id, activeGroupId)) {
                /* keep inside group */
              } else {
                setActiveGroupId(null);
              }
            }}
            onDoubleClick={() => {
              if (isGroup) {
                setActiveGroupId(shape.id);
                select([shape.id]);
              }
            }}
          >
            {isGroup ? <Folder size={13} style={{ color: 'var(--color-accent)' }} /> : <Square size={12} />}
            <span className="truncate">{label}</span>
          </button>
        </div>
        {isGroup && isOpen && node.children.length > 0 && (
          <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <PanelSection title="Elements">
      {tree.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          No shapes on this page.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">{tree.map((node) => renderNode(node))}</ul>
      )}
    </PanelSection>
  );
}
