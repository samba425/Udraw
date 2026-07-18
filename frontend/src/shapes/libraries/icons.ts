/**
 * General-purpose colored icon library (user, mail, gear, lock, ...). Rendered
 * as `icon` shapes; each is a compact, self-contained colored glyph.
 * @module shapes/libraries/icons
 */
import { glyphIcon } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

function icon(id: string, label: string, body: string): LibraryIcon {
  return glyphIcon(id, label, 'Icons', body, { size: { width: 64, height: 64 } });
}

const B = '#2563eb';
const G = '#16a34a';
const R = '#dc2626';
const A = '#f59e0b';
const P = '#7c3aed';

export const GENERAL_ICONS: LibraryIcon[] = [
  icon('icon.user', 'User', `<circle cx="24" cy="17" r="8" fill="${B}"/><path d="M8 42 a16 13 0 0 1 32 0 Z" fill="${B}"/>`),
  icon('icon.mail', 'Mail', `<rect x="5" y="12" width="38" height="26" rx="3" fill="${B}"/><path d="M6 14 L24 28 L42 14" fill="none" stroke="#fff" stroke-width="2.5"/>`),
  icon('icon.phone', 'Phone', `<path d="M14 6 c-6 2 -8 8 -6 16 c3 12 12 21 24 24 c8 2 14 0 16 -6 l-8 -6 c-3 3 -6 2 -9 0 c-5 -3 -9 -7 -12 -12 c-2 -3 -3 -6 0 -9 Z" fill="${G}"/>`),
  icon('icon.gear', 'Settings', `<circle cx="24" cy="24" r="8" fill="none" stroke="#475569" stroke-width="4"/><g fill="#475569"><rect x="21" y="2" width="6" height="9"/><rect x="21" y="37" width="6" height="9"/><rect x="2" y="21" width="9" height="6"/><rect x="37" y="21" width="9" height="6"/></g>`),
  icon('icon.lock', 'Lock', `<rect x="10" y="20" width="28" height="22" rx="3" fill="${A}"/><path d="M15 20 v-5 a9 9 0 0 1 18 0 v5" fill="none" stroke="${A}" stroke-width="4"/><circle cx="24" cy="30" r="3" fill="#fff"/>`),
  icon('icon.cloud', 'Cloud', `<path d="M14 36 a9 9 0 0 1 1 -18 a11 11 0 0 1 20 3 a7 7 0 0 1 -2 15 Z" fill="${B}"/>`),
  icon('icon.database', 'Database', `<ellipse cx="24" cy="11" rx="14" ry="5" fill="${P}"/><path d="M10 11 v26 a14 5 0 0 0 28 0 v-26" fill="${P}"/><path d="M10 24 a14 5 0 0 0 28 0" fill="none" stroke="#fff" stroke-width="1.5"/>`),
  icon('icon.folder', 'Folder', `<path d="M4 12 h14 l4 5 h22 v25 h-40 Z" fill="${A}"/>`),
  icon('icon.chart', 'Chart', `<rect x="8" y="26" width="7" height="16" fill="${B}"/><rect x="20" y="16" width="7" height="26" fill="${G}"/><rect x="32" y="8" width="7" height="34" fill="${P}"/>`),
  icon('icon.bell', 'Bell', `<path d="M24 6 a12 12 0 0 1 12 12 v10 l4 6 h-32 l4 -6 v-10 a12 12 0 0 1 12 -12 Z" fill="${A}"/><circle cx="24" cy="42" r="4" fill="${A}"/>`),
  icon('icon.heart', 'Heart', `<path d="M24 42 C6 28 6 14 16 12 c5 -1 8 3 8 5 c0 -2 3 -6 8 -5 c10 2 10 16 -8 30 Z" fill="${R}"/>`),
  icon('icon.star', 'Star', `<path d="M24 4 L30 18 L45 19 L34 29 L37 44 L24 36 L11 44 L14 29 L3 19 L18 18 Z" fill="${A}"/>`),
  icon('icon.check', 'Check', `<circle cx="24" cy="24" r="20" fill="${G}"/><path d="M14 25 L21 32 L34 17" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`),
  icon('icon.warning', 'Warning', `<path d="M24 4 L46 42 H2 Z" fill="${A}"/><rect x="21" y="18" width="6" height="14" fill="#fff"/><rect x="21" y="35" width="6" height="5" fill="#fff"/>`),
  icon('icon.clock', 'Clock', `<circle cx="24" cy="24" r="20" fill="none" stroke="${B}" stroke-width="4"/><path d="M24 12 v13 l9 5" fill="none" stroke="${B}" stroke-width="4" stroke-linecap="round"/>`),
  icon('icon.globe', 'Globe', `<circle cx="24" cy="24" r="20" fill="none" stroke="${G}" stroke-width="3"/><ellipse cx="24" cy="24" rx="9" ry="20" fill="none" stroke="${G}" stroke-width="3"/><path d="M5 24 h38 M8 14 h32 M8 34 h32" stroke="${G}" stroke-width="2"/>`),
];
