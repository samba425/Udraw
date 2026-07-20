/**
 * Right property panel. Routes to the shape or connector inspector based on
 * the current selection, or shows document/alignment tools when nothing (or
 * multiple items) are selected.
 * @module components/property-panel/PropertyPanel
 */
import {
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
} from 'lucide-react';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { PanelSection } from '@/components/ui/Panel';
import { ShapeProperties } from './ShapeProperties';
import { GroupProperties } from './GroupProperties';
import { EdgeProperties } from './EdgeProperties';
import { alignSelection, distributeSelection } from '@/engine/commands/actions';
import type { AlignMode } from '@/engine/alignment/align';

const ALIGN_BUTTONS: Array<{ mode: AlignMode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { mode: 'left', label: 'Align left', icon: AlignStartVertical },
  { mode: 'hcenter', label: 'Align center', icon: AlignHorizontalJustifyCenter },
  { mode: 'right', label: 'Align right', icon: AlignEndVertical },
  { mode: 'top', label: 'Align top', icon: AlignStartHorizontal },
  { mode: 'vcenter', label: 'Align middle', icon: AlignVerticalJustifyCenter },
  { mode: 'bottom', label: 'Align bottom', icon: AlignEndHorizontal },
];

/** The selection property inspector. */
export function PropertyPanel(): React.JSX.Element {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const project = useProjectStore((s) => s.project);
  const activePageId = useProjectStore((s) => s.activePageId);

  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0]!;
  const single = selectedIds.length === 1 ? selectedIds[0]! : undefined;
  const shape = single ? page.shapes[single] : undefined;
  const edge = single ? page.edges[single] : undefined;
  const multi = selectedIds.length >= 2;

  return (
    <aside
      className="df-scroll flex w-64 shrink-0 flex-col overflow-y-auto border-l bordered surface"
      aria-label="Properties"
    >
      {shape && shape.kind === 'group' && <GroupProperties shape={shape} />}
      {shape && shape.kind !== 'group' && <ShapeProperties shape={shape} />}
      {edge && <EdgeProperties edge={edge} />}

      {multi && (
        <PanelSection title={`${selectedIds.length} selected`}>
          <div className="grid grid-cols-6 gap-1">
            {ALIGN_BUTTONS.map((b) => (
              <button
                key={b.mode}
                type="button"
                title={b.label}
                aria-label={b.label}
                onClick={() => alignSelection(b.mode)}
                className="df-focus-ring flex h-8 items-center justify-center rounded-md border bordered hover:brightness-110"
                style={{ color: 'var(--color-text)' }}
              >
                <b.icon size={15} />
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-1">
            <button
              type="button"
              onClick={() => distributeSelection('horizontal')}
              className="df-focus-ring flex-1 rounded-md border bordered px-2 py-1 text-xs hover:brightness-110"
              style={{ color: 'var(--color-text)' }}
            >
              Distribute H
            </button>
            <button
              type="button"
              onClick={() => distributeSelection('vertical')}
              className="df-focus-ring flex-1 rounded-md border bordered px-2 py-1 text-xs hover:brightness-110"
              style={{ color: 'var(--color-text)' }}
            >
              Distribute V
            </button>
          </div>
        </PanelSection>
      )}

      {!shape && !edge && !multi && (
        <PanelSection title="Properties">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Select a shape or connector to edit its properties.
          </p>
        </PanelSection>
      )}
    </aside>
  );
}
