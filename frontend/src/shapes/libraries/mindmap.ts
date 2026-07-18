/**
 * Mind map library. Central topic plus subtopic bubbles. Entries drop as
 * native rounded shapes with prefilled text so they stay editable.
 * @module shapes/libraries/mindmap
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

export const MINDMAP_ICONS: LibraryIcon[] = [
  glyphIcon(
    'mindmap.central',
    'Central Topic',
    'Mind Map',
    `<ellipse cx="24" cy="24" rx="20" ry="13" fill="#8b5cf6" stroke="#6d28d9" stroke-width="2"/>`,
    { shapeKind: 'ellipse', defaultText: 'Central Topic', size: { width: 150, height: 70 } },
  ),
  glyphIcon(
    'mindmap.main',
    'Main Topic',
    'Mind Map',
    `<rect x="4" y="13" width="40" height="22" rx="11" fill="#c4b5fd" stroke="#8b5cf6" stroke-width="2"/>`,
    { shapeKind: 'rounded-rectangle', defaultText: 'Main Topic', size: { width: 130, height: 56 } },
  ),
  glyphIcon(
    'mindmap.subtopic',
    'Subtopic',
    'Mind Map',
    `<rect x="4" y="16" width="40" height="16" rx="8" fill="#ede9fe" stroke="#a78bfa" stroke-width="2"/>`,
    { shapeKind: 'rounded-rectangle', defaultText: 'Subtopic', size: { width: 110, height: 44 } },
  ),
];
