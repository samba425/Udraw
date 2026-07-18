/**
 * Sticky note library. Colored notes that drop as native `sticky-note` shapes.
 * @module shapes/libraries/sticky
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

function note(id: string, label: string, fill: string, stroke: string): LibraryIcon {
  return glyphIcon(
    id,
    label,
    'Sticky Notes',
    `<path d="M6 6 H42 V34 L34 42 H6 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/><path d="M42 34 L34 34 L34 42 Z" fill="${stroke}" opacity="0.4"/>`,
    {
      shapeKind: 'sticky-note',
      defaultText: '',
      size: { width: 120, height: 120 },
      defaultFill: fill,
      defaultStroke: stroke,
    },
  );
}

export const STICKY_ICONS: LibraryIcon[] = [
  note('sticky.yellow', 'Yellow Note', '#fef08a', '#eab308'),
  note('sticky.green', 'Green Note', '#bbf7d0', '#22c55e'),
  note('sticky.blue', 'Blue Note', '#bfdbfe', '#3b82f6'),
  note('sticky.pink', 'Pink Note', '#fbcfe8', '#ec4899'),
  note('sticky.orange', 'Orange Note', '#fed7aa', '#f97316'),
];
