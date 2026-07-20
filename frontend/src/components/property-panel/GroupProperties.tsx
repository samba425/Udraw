/**
 * Property editor for group containers: name, border, and size.
 * @module components/property-panel/GroupProperties
 */
import type { DashStyle, Shape } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useHistory } from '@/hooks/useHistory';
import { PanelSection } from '@/components/ui/Panel';
import { NumberField } from './fields/NumberField';
import { CheckboxField, SelectField, TextAreaField } from './fields/controls';
import { GROUP_BORDER_STROKE, groupShowsBorder } from '@/models/groupMembership';

const DASH_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
] as const;

/** Inspector for a group container shape. */
export function GroupProperties({ shape }: { shape: Shape }): React.JSX.Element {
  const updateShape = useProjectStore((s) => s.updateShape);
  const history = useHistory();

  const set = (patch: Partial<Shape>, label = 'Property change'): void => {
    history.run(label, () => updateShape(shape.id, patch));
  };

  const setBorder = (showBorder: boolean): void => {
    set(
      {
        metadata: { ...shape.metadata, showBorder },
        stroke: showBorder ? GROUP_BORDER_STROKE : 'none',
        strokeWidth: showBorder ? 1.5 : 0,
        dash: showBorder ? 'dashed' : 'solid',
      },
      'Group border',
    );
  };

  return (
    <>
      <PanelSection title="Group">
        <div className="flex flex-col gap-2">
          <TextAreaField
            label="Name"
            value={shape.text}
            onChange={(text) => set({ text }, 'Rename group')}
            placeholder="Group name..."
          />
          <CheckboxField label="Show border" checked={groupShowsBorder(shape)} onChange={setBorder} />
          {groupShowsBorder(shape) && (
            <SelectField
              label="Border style"
              value={shape.dash}
              options={DASH_OPTIONS}
              onChange={(dash: DashStyle) => set({ dash })}
            />
          )}
        </div>
      </PanelSection>

      <PanelSection title="Bounds">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={Math.round(shape.x)} onChange={(x) => set({ x })} />
          <NumberField label="Y" value={Math.round(shape.y)} onChange={(y) => set({ y })} />
          <NumberField label="W" value={Math.round(shape.width)} min={1} onChange={(width) => set({ width })} />
          <NumberField label="H" value={Math.round(shape.height)} min={1} onChange={(height) => set({ height })} />
        </div>
        <p className="mt-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Double-click the group to edit shapes inside. Drag shapes onto the group to add them.
        </p>
      </PanelSection>
    </>
  );
}
