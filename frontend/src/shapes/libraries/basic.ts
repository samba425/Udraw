/**
 * Basic shapes library. Unlike the branded icon libraries, these entries drop
 * as native editable shape kinds (rectangle, ellipse, ...) so their fill and
 * stroke stay fully controllable from the property panel.
 * @module shapes/libraries/basic
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const FILL = '#dbeafe';
const STROKE = '#3b82f6';
const s = `fill="${FILL}" stroke="${STROKE}" stroke-width="2"`;

export const BASIC_ICONS: LibraryIcon[] = [
  glyphIcon('basic.rectangle', 'Rectangle', 'Basic', `<rect x="4" y="10" width="40" height="28" rx="2" ${s}/>`, {
    shapeKind: 'rectangle',
    size: { width: 120, height: 80 },
  }),
  glyphIcon('basic.rounded', 'Rounded', 'Basic', `<rect x="4" y="10" width="40" height="28" rx="10" ${s}/>`, {
    shapeKind: 'rounded-rectangle',
    size: { width: 120, height: 80 },
  }),
  glyphIcon('basic.ellipse', 'Ellipse', 'Basic', `<ellipse cx="24" cy="24" rx="20" ry="14" ${s}/>`, {
    shapeKind: 'ellipse',
    size: { width: 120, height: 80 },
  }),
  glyphIcon('basic.circle', 'Circle', 'Basic', `<circle cx="24" cy="24" r="18" ${s}/>`, {
    shapeKind: 'circle',
    size: { width: 90, height: 90 },
  }),
  glyphIcon('basic.diamond', 'Diamond', 'Basic', `<path d="M24 4 L44 24 L24 44 L4 24 Z" ${s}/>`, {
    shapeKind: 'diamond',
    size: { width: 100, height: 100 },
  }),
  glyphIcon('basic.triangle', 'Triangle', 'Basic', `<path d="M24 6 L42 40 L6 40 Z" ${s}/>`, {
    shapeKind: 'triangle',
    size: { width: 110, height: 90 },
  }),
  glyphIcon('basic.hexagon', 'Hexagon', 'Basic', `<path d="M14 8 L34 8 L44 24 L34 40 L14 40 L4 24 Z" ${s}/>`, {
    shapeKind: 'hexagon',
    size: { width: 120, height: 90 },
  }),
  glyphIcon('basic.parallelogram', 'Parallelogram', 'Basic', `<path d="M14 10 L44 10 L34 38 L4 38 Z" ${s}/>`, {
    shapeKind: 'parallelogram',
    size: { width: 130, height: 80 },
  }),
  glyphIcon('basic.cloud', 'Cloud', 'Basic', `<path d="M14 36 a9 9 0 0 1 1 -18 a11 11 0 0 1 20 3 a7 7 0 0 1 -2 15 Z" ${s}/>`, {
    shapeKind: 'cloud',
    size: { width: 130, height: 90 },
  }),
  glyphIcon('basic.cylinder', 'Cylinder', 'Basic', `<path d="M8 12 v24 a16 5 0 0 0 32 0 v-24" ${s}/><ellipse cx="24" cy="12" rx="16" ry="5" ${s}/>`, {
    shapeKind: 'cylinder',
    size: { width: 90, height: 110 },
  }),
  glyphIcon('basic.text', 'Text', 'Basic', `<text x="24" y="31" text-anchor="middle" font-size="26" font-family="sans-serif" fill="${STROKE}">T</text>`, {
    shapeKind: 'text',
    defaultText: 'Text',
    size: { width: 120, height: 40 },
  }),
];
