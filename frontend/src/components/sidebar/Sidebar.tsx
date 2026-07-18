/**
 * Left sidebar. Hosts the searchable colored shape libraries (Basic, Flowchart,
 * UML, AWS, Azure, Kubernetes, Network, BPMN, Mind Map, Org Chart, Sticky Notes,
 * Icons, Custom SVG) with favorites and drag-drop, plus the layers panel.
 * @module components/sidebar/Sidebar
 */
import { ShapeLibrary } from './ShapeLibrary';
import { LayersPanel } from '@/components/layers/LayersPanel';

/** The shape library + layers sidebar. */
export function Sidebar(): React.JSX.Element {
  return (
    <aside
      className="df-scroll flex w-60 shrink-0 flex-col overflow-y-auto border-r bordered surface"
      aria-label="Shape library"
    >
      <ShapeLibrary />
      <LayersPanel />
    </aside>
  );
}
