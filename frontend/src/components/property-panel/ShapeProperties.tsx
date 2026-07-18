/**
 * Property editor for a single selected shape: geometry, appearance, and text.
 * @module components/property-panel/ShapeProperties
 */
import type { DashStyle, Shape } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useHistory } from '@/hooks/useHistory';
import { PanelSection } from '@/components/ui/Panel';
import { NumberField } from './fields/NumberField';
import { ColorField } from './fields/ColorField';
import { CheckboxField, RangeField, SelectField, TextAreaField } from './fields/controls';

const DASH_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
] as const;

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
] as const;

/** The property inspector for a shape. */
export function ShapeProperties({ shape }: { shape: Shape }): React.JSX.Element {
  const updateShape = useProjectStore((s) => s.updateShape);
  const history = useHistory();

  const set = (patch: Partial<Shape>, label = 'Property change'): void => {
    history.run(label, () => updateShape(shape.id, patch));
  };

  return (
    <>
      <PanelSection title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X" value={Math.round(shape.x)} onChange={(x) => set({ x })} />
          <NumberField label="Y" value={Math.round(shape.y)} onChange={(y) => set({ y })} />
          <NumberField label="W" value={Math.round(shape.width)} min={1} onChange={(width) => set({ width })} />
          <NumberField label="H" value={Math.round(shape.height)} min={1} onChange={(height) => set({ height })} />
          <NumberField label="Angle" value={Math.round(shape.rotation)} onChange={(rotation) => set({ rotation })} />
          {(shape.kind === 'rectangle' || shape.kind === 'rounded-rectangle') && (
            <NumberField
              label="Radius"
              value={Math.round(shape.cornerRadius)}
              min={0}
              onChange={(cornerRadius) => set({ cornerRadius })}
            />
          )}
        </div>
      </PanelSection>

      <PanelSection title="Appearance">
        <div className="flex flex-col gap-2">
          <ColorField
            label="Fill"
            value={shape.fill.type === 'none' ? 'none' : shape.fill.color}
            allowNone
            onChange={(color) =>
              set({ fill: color === 'none' ? { ...shape.fill, type: 'none' } : { ...shape.fill, type: 'solid', color } })
            }
          />
          <ColorField label="Stroke" value={shape.stroke} onChange={(stroke) => set({ stroke })} />
          <RangeField label="Stroke width" value={shape.strokeWidth} min={0} max={20} onChange={(strokeWidth) => set({ strokeWidth })} />
          <SelectField
            label="Line style"
            value={shape.dash}
            options={DASH_OPTIONS}
            onChange={(dash: DashStyle) => set({ dash })}
          />
          <RangeField label="Opacity" value={Math.round(shape.opacity * 100)} min={0} max={100} onChange={(v) => set({ opacity: v / 100 })} />
          <RangeField label="Blur" value={shape.blur} min={0} max={20} onChange={(blur) => set({ blur })} />
          <CheckboxField
            label="Shadow"
            checked={shape.shadow.enabled}
            onChange={(enabled) => set({ shadow: { ...shape.shadow, enabled } })}
          />
        </div>
      </PanelSection>

      <PanelSection title="Text">
        <div className="flex flex-col gap-2">
          <TextAreaField label="Label" value={shape.text} onChange={(text) => set({ text }, 'Edit text')} placeholder="Type a label..." />
          <RangeField
            label="Font size"
            value={shape.typography.fontSize}
            min={8}
            max={72}
            onChange={(fontSize) => set({ typography: { ...shape.typography, fontSize } })}
          />
          <ColorField
            label="Text color"
            value={shape.typography.color}
            onChange={(color) => set({ typography: { ...shape.typography, color } })}
          />
          <SelectField
            label="Align"
            value={shape.typography.align}
            options={ALIGN_OPTIONS}
            onChange={(align) => set({ typography: { ...shape.typography, align } })}
          />
        </div>
      </PanelSection>
    </>
  );
}
