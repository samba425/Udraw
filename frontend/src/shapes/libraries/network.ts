/**
 * Networking library (Cisco-style): router, switch, firewall, server, cloud,
 * laptop, database, mobile, printer, access point.
 * @module shapes/libraries/network
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const CISCO = '#1ba0d7';
const W = `fill="none" stroke="${CISCO}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
const F = `fill="#e0f2fe" stroke="${CISCO}" stroke-width="2.5"`;

export const NETWORK_ICONS: LibraryIcon[] = [
  glyphIcon('net.router', 'Router', 'Network', `<circle cx="24" cy="24" r="18" ${F}/><path d="M17 27 h14 M31 27 l-4 -3 M31 27 l-4 3 M31 21 h-14 M17 21 l4 -3 M17 21 l4 3" ${W}/>`, { size: { width: 72, height: 72 } }),
  glyphIcon('net.switch', 'Switch', 'Network', `<rect x="4" y="16" width="40" height="16" rx="3" ${F}/><path d="M12 24 h6 M20 24 l-3 -2 M20 24 l-3 2 M36 24 h-6 M28 24 l3 -2 M28 24 l3 2" ${W}/>`, { size: { width: 96, height: 48 } }),
  glyphIcon('net.firewall', 'Firewall', 'Network', `<rect x="6" y="10" width="36" height="28" rx="2" fill="#fee2e2" stroke="#dc2626" stroke-width="2.5"/><path d="M6 19 h36 M6 29 h36 M18 10 v9 M30 19 v10 M18 29 v9" stroke="#dc2626" stroke-width="2"/>`, { size: { width: 72, height: 60 } }),
  glyphIcon('net.server', 'Server', 'Network', `<rect x="12" y="6" width="24" height="36" rx="2" ${F}/><circle cx="18" cy="13" r="1.6" fill="${CISCO}"/><circle cx="18" cy="20" r="1.6" fill="${CISCO}"/><path d="M24 13 h8 M24 20 h8" ${W}/>`, { size: { width: 56, height: 84 } }),
  glyphIcon('net.cloud', 'Cloud', 'Network', `<path d="M14 34 a9 9 0 0 1 1 -18 a11 11 0 0 1 20 3 a7 7 0 0 1 -2 15 Z" ${F}/>`, { size: { width: 96, height: 64 } }),
  glyphIcon('net.laptop', 'Laptop', 'Network', `<rect x="10" y="10" width="28" height="18" rx="2" ${F}/><path d="M6 34 h36 l-3 -6 H9 Z" ${F}/>`, { size: { width: 84, height: 64 } }),
  glyphIcon('net.database', 'Database', 'Network', `<ellipse cx="24" cy="12" rx="12" ry="4" ${F}/><path d="M12 12 v24 a12 4 0 0 0 24 0 v-24" ${W}/>`, { size: { width: 64, height: 84 } }),
  glyphIcon('net.mobile', 'Mobile', 'Network', `<rect x="16" y="6" width="16" height="36" rx="3" ${F}/><line x1="21" y1="38" x2="27" y2="38" ${W}/>`, { size: { width: 44, height: 84 } }),
  glyphIcon('net.printer', 'Printer', 'Network', `<rect x="10" y="18" width="28" height="16" rx="2" ${F}/><rect x="16" y="8" width="16" height="10" ${F}/><rect x="16" y="30" width="16" height="10" fill="#fff" stroke="${CISCO}" stroke-width="2"/>`, { size: { width: 72, height: 72 } }),
  glyphIcon('net.accesspoint', 'Access Point', 'Network', `<circle cx="24" cy="34" r="4" fill="${CISCO}"/><path d="M16 26 a11 11 0 0 1 16 0 M12 21 a17 17 0 0 1 24 0" ${W}/>`, { size: { width: 72, height: 60 } }),
];
