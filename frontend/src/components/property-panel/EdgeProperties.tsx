/**
 * Property editor for a single selected connector.
 * @module components/property-panel/EdgeProperties
 */
import type { ArrowStyle, DashStyle, Edge, EdgeRouter } from '@/types';
import { useProjectStore } from '@/state/projectStore';
import { useHistory } from '@/hooks/useHistory';
import { PanelSection } from '@/components/ui/Panel';
import { ColorField } from './fields/ColorField';
import { CheckboxField, RangeField, SelectField, TextAreaField } from './fields/controls';

const ROUTER_OPTIONS = [
  { value: 'straight', label: 'Straight' },
  { value: 'orthogonal', label: 'Orthogonal' },
  { value: 'curved', label: 'Curved' },
  { value: 'bezier', label: 'Bezier' },
] as const;

const ARROW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'circle', label: 'Circle' },
] as const;

const DASH_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
] as const;

/** The property inspector for a connector. */
export function EdgeProperties({ edge }: { edge: Edge }): React.JSX.Element {
  const updateEdge = useProjectStore((s) => s.updateEdge);
  const history = useHistory();

  const set = (patch: Partial<Edge>, label = 'Edge change'): void => {
    history.run(label, () => updateEdge(edge.id, patch));
  };

  return (
    <>
      <PanelSection title="Connector">
        <div className="flex flex-col gap-2">
          <SelectField label="Router" value={edge.router} options={ROUTER_OPTIONS} onChange={(router: EdgeRouter) => set({ router })} />
          <SelectField label="Start arrow" value={edge.startArrow} options={ARROW_OPTIONS} onChange={(startArrow: ArrowStyle) => set({ startArrow })} />
          <SelectField label="End arrow" value={edge.endArrow} options={ARROW_OPTIONS} onChange={(endArrow: ArrowStyle) => set({ endArrow })} />
        </div>
      </PanelSection>

      <PanelSection title="Style">
        <div className="flex flex-col gap-2">
          <ColorField label="Stroke" value={edge.stroke} onChange={(stroke) => set({ stroke })} />
          <RangeField label="Width" value={edge.strokeWidth} min={1} max={16} onChange={(strokeWidth) => set({ strokeWidth })} />
          <SelectField label="Line style" value={edge.dash} options={DASH_OPTIONS} onChange={(dash: DashStyle) => set({ dash })} />
          <RangeField label="Opacity" value={Math.round(edge.opacity * 100)} min={0} max={100} onChange={(v) => set({ opacity: v / 100 })} />
          <CheckboxField label="Animated" checked={edge.animated} onChange={(animated) => set({ animated })} />
        </div>
      </PanelSection>

      <PanelSection title="Label">
        <TextAreaField label="Text" value={edge.label} onChange={(label) => set({ label }, 'Edit label')} />
      </PanelSection>
    </>
  );
}
