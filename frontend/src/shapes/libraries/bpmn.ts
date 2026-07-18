/**
 * BPMN shape library (colored): events, tasks, gateways, subprocess.
 * @module shapes/libraries/bpmn
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const FILL = '#fef3c7';
const STROKE = '#f59e0b';

export const BPMN_ICONS: LibraryIcon[] = [
  glyphIcon(
    'bpmn.start-event',
    'Start Event',
    'BPMN',
    `<circle cx="24" cy="24" r="20" fill="#dcfce7" stroke="#16a34a" stroke-width="3"/>`,
    { size: { width: 60, height: 60 } },
  ),
  glyphIcon(
    'bpmn.end-event',
    'End Event',
    'BPMN',
    `<circle cx="24" cy="24" r="20" fill="#fee2e2" stroke="#dc2626" stroke-width="5"/>`,
    { size: { width: 60, height: 60 } },
  ),
  glyphIcon(
    'bpmn.task',
    'Task',
    'BPMN',
    `<rect x="3" y="10" width="42" height="28" rx="6" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/>`,
    { size: { width: 120, height: 72 } },
  ),
  glyphIcon(
    'bpmn.gateway',
    'Gateway',
    'BPMN',
    `<path d="M24 4 L44 24 L24 44 L4 24 Z" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/><path d="M17 17 L31 31 M31 17 L17 31" stroke="${STROKE}" stroke-width="3"/>`,
    { size: { width: 72, height: 72 } },
  ),
  glyphIcon(
    'bpmn.subprocess',
    'Subprocess',
    'BPMN',
    `<rect x="3" y="10" width="42" height="28" rx="6" fill="${FILL}" stroke="${STROKE}" stroke-width="2"/><rect x="21" y="30" width="6" height="6" fill="none" stroke="${STROKE}" stroke-width="1.5"/><line x1="24" y1="31" x2="24" y2="35" stroke="${STROKE}"/><line x1="22" y1="33" x2="26" y2="33" stroke="${STROKE}"/>`,
    { size: { width: 120, height: 72 } },
  ),
];
