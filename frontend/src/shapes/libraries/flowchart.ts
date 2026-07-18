/**
 * Flowchart shape library. Colored outline shapes authored on a 48x48 grid.
 * @module shapes/libraries/flowchart
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const FILL = '#e0e7ff';
const STROKE = '#6366f1';
const s = `fill="${FILL}" stroke="${STROKE}" stroke-width="2"`;

export const FLOWCHART_ICONS: LibraryIcon[] = [
  glyphIcon('flowchart.process', 'Process', 'Flowchart', `<rect x="3" y="12" width="42" height="24" rx="2" ${s}/>`),
  glyphIcon('flowchart.decision', 'Decision', 'Flowchart', `<path d="M24 4 L44 24 L24 44 L4 24 Z" ${s}/>`),
  glyphIcon('flowchart.terminator', 'Terminator', 'Flowchart', `<rect x="3" y="14" width="42" height="20" rx="10" ${s}/>`),
  glyphIcon('flowchart.data', 'Data', 'Flowchart', `<path d="M11 12 L45 12 L37 36 L3 36 Z" ${s}/>`),
  glyphIcon(
    'flowchart.document',
    'Document',
    'Flowchart',
    `<path d="M4 10 H44 V34 C36 42 12 26 4 34 Z" ${s}/>`,
  ),
  glyphIcon(
    'flowchart.database',
    'Database',
    'Flowchart',
    `<path d="M6 12 C6 8 42 8 42 12 L42 36 C42 40 6 40 6 36 Z" ${s}/><path d="M6 12 C6 16 42 16 42 12" fill="none" stroke="${STROKE}" stroke-width="2"/>`,
  ),
  glyphIcon(
    'flowchart.manual-input',
    'Manual Input',
    'Flowchart',
    `<path d="M4 16 L44 10 L44 36 L4 36 Z" ${s}/>`,
  ),
  glyphIcon(
    'flowchart.preparation',
    'Preparation',
    'Flowchart',
    `<path d="M12 12 L36 12 L44 24 L36 36 L12 36 L4 24 Z" ${s}/>`,
  ),
];
