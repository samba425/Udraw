/**
 * Org chart library. Role/person cards that drop as native editable shapes.
 * @module shapes/libraries/org
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

export const ORG_ICONS: LibraryIcon[] = [
  glyphIcon(
    'org.executive',
    'Executive',
    'Org Chart',
    `<rect x="4" y="10" width="40" height="28" rx="3" fill="#1e293b" stroke="#0f172a" stroke-width="2"/><circle cx="24" cy="22" r="5" fill="#fff"/><path d="M15 34 a9 7 0 0 1 18 0" fill="#fff"/>`,
    { shapeKind: 'rectangle', defaultText: 'Executive', size: { width: 140, height: 70 } },
  ),
  glyphIcon(
    'org.manager',
    'Manager',
    'Org Chart',
    `<rect x="4" y="10" width="40" height="28" rx="3" fill="#3b82f6" stroke="#2563eb" stroke-width="2"/><circle cx="24" cy="22" r="5" fill="#fff"/><path d="M15 34 a9 7 0 0 1 18 0" fill="#fff"/>`,
    { shapeKind: 'rectangle', defaultText: 'Manager', size: { width: 140, height: 70 } },
  ),
  glyphIcon(
    'org.employee',
    'Employee',
    'Org Chart',
    `<rect x="4" y="10" width="40" height="28" rx="3" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/><circle cx="24" cy="22" r="5" fill="#3b82f6"/><path d="M15 34 a9 7 0 0 1 18 0" fill="#3b82f6"/>`,
    { shapeKind: 'rectangle', defaultText: 'Employee', size: { width: 140, height: 70 } },
  ),
  glyphIcon(
    'org.team',
    'Team',
    'Org Chart',
    `<rect x="4" y="12" width="40" height="24" rx="3" fill="#d1fae5" stroke="#10b981" stroke-width="2"/><circle cx="18" cy="22" r="4" fill="#10b981"/><circle cx="30" cy="22" r="4" fill="#10b981"/>`,
    { shapeKind: 'rectangle', defaultText: 'Team', size: { width: 150, height: 64 } },
  ),
];
