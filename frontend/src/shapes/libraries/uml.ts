/**
 * UML shape library (colored). Class, interface, actor, use case, component,
 * package, and note.
 * @module shapes/libraries/uml
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const FILL = '#ccfbf1';
const STROKE = '#14b8a6';
const s = `fill="${FILL}" stroke="${STROKE}" stroke-width="2"`;

export const UML_ICONS: LibraryIcon[] = [
  glyphIcon(
    'uml.class',
    'Class',
    'UML',
    `<rect x="4" y="6" width="40" height="36" ${s}/><line x1="4" y1="18" x2="44" y2="18" stroke="${STROKE}" stroke-width="2"/><line x1="4" y1="30" x2="44" y2="30" stroke="${STROKE}" stroke-width="2"/>`,
    { size: { width: 140, height: 100 } },
  ),
  glyphIcon(
    'uml.interface',
    'Interface',
    'UML',
    `<circle cx="24" cy="24" r="18" ${s}/>`,
  ),
  glyphIcon(
    'uml.actor',
    'Actor',
    'UML',
    `<g fill="none" stroke="${STROKE}" stroke-width="2.5"><circle cx="24" cy="10" r="5"/><line x1="24" y1="15" x2="24" y2="32"/><line x1="12" y1="22" x2="36" y2="22"/><line x1="24" y1="32" x2="14" y2="44"/><line x1="24" y1="32" x2="34" y2="44"/></g>`,
    { size: { width: 60, height: 96 } },
  ),
  glyphIcon('uml.usecase', 'Use Case', 'UML', `<ellipse cx="24" cy="24" rx="22" ry="14" ${s}/>`, {
    size: { width: 120, height: 72 },
  }),
  glyphIcon(
    'uml.component',
    'Component',
    'UML',
    `<rect x="8" y="8" width="34" height="32" ${s}/><rect x="2" y="14" width="12" height="7" ${s}/><rect x="2" y="27" width="12" height="7" ${s}/>`,
  ),
  glyphIcon(
    'uml.package',
    'Package',
    'UML',
    `<path d="M4 12 H20 V16 H44 V42 H4 Z" ${s}/>`,
    { size: { width: 120, height: 90 } },
  ),
  glyphIcon(
    'uml.note',
    'Note',
    'UML',
    `<path d="M4 6 H36 L44 14 V42 H4 Z" ${s}/><path d="M36 6 V14 H44" fill="none" stroke="${STROKE}" stroke-width="2"/>`,
  ),
];
