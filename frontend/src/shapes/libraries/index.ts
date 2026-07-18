/**
 * Registers all built-in colored shape libraries with the shape registry and
 * exposes the ordered category list used by the sidebar. Import this module
 * once at app startup.
 * @module shapes/libraries
 */
import { registerIcons } from '@/shapes/registry';
import { BASIC_ICONS } from './basic';
import { FLOWCHART_ICONS } from './flowchart';
import { UML_ICONS } from './uml';
import { BPMN_ICONS } from './bpmn';
import { AWS_ICONS } from './aws';
import { AZURE_ICONS } from './azure';
import { KUBERNETES_ICONS } from './kubernetes';
import { NETWORK_ICONS } from './network';
import { MINDMAP_ICONS } from './mindmap';
import { ORG_ICONS } from './org';
import { STICKY_ICONS } from './sticky';
import { GENERAL_ICONS } from './icons';

let registered = false;

/**
 * The category display order for the sidebar. `Custom SVG` and `Favorites`
 * are virtual categories populated at runtime (imports / user pins).
 */
export const LIBRARY_CATEGORIES: readonly string[] = [
  'Basic',
  'Flowchart',
  'UML',
  'BPMN',
  'AWS',
  'Azure',
  'Kubernetes',
  'Network',
  'Mind Map',
  'Org Chart',
  'Sticky Notes',
  'Icons',
];

/** Register every built-in library (idempotent). */
export function registerBuiltinLibraries(): void {
  if (registered) return;
  registerIcons([
    ...BASIC_ICONS,
    ...FLOWCHART_ICONS,
    ...UML_ICONS,
    ...BPMN_ICONS,
    ...AWS_ICONS,
    ...AZURE_ICONS,
    ...KUBERNETES_ICONS,
    ...NETWORK_ICONS,
    ...MINDMAP_ICONS,
    ...ORG_ICONS,
    ...STICKY_ICONS,
    ...GENERAL_ICONS,
  ]);
  registered = true;
}
