/**
 * Azure shape library. Brand-blue tiles with simple white service glyphs.
 * @module shapes/libraries/azure
 */
import { tile } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const AZURE = '#0078d4';
const W = 'fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

export const AZURE_ICONS: LibraryIcon[] = [
  tile({ id: 'azure.vm', label: 'Virtual Machine', category: 'Azure', bg: AZURE, glyph: `<rect x="10" y="13" width="28" height="18" rx="2" ${W}/><path d="M18 38 h12 M24 31 v7" ${W}/>` }),
  tile({ id: 'azure.storage', label: 'Storage', category: 'Azure', bg: AZURE, glyph: `<rect x="10" y="14" width="28" height="20" rx="2" ${W}/><path d="M10 21 h28 M10 27 h28" ${W}/>` }),
  tile({ id: 'azure.functions', label: 'Functions', category: 'Azure', bg: AZURE, glyph: `<path d="M20 38 L28 10 M16 22 h14 M14 30 h14" ${W}/>` }),
  tile({ id: 'azure.sql', label: 'SQL Database', category: 'Azure', bg: AZURE, glyph: `<ellipse cx="24" cy="14" rx="11" ry="4" ${W}/><path d="M13 14 v20 a11 4 0 0 0 22 0 v-20" ${W}/>` }),
  tile({ id: 'azure.appservice', label: 'App Service', category: 'Azure', bg: AZURE, glyph: `<circle cx="24" cy="24" r="14" ${W}/><path d="M10 24 h28 M24 10 c6 6 6 22 0 28 c-6 -6 -6 -22 0 -28" ${W}/>` }),
  tile({ id: 'azure.cosmosdb', label: 'Cosmos DB', category: 'Azure', bg: AZURE, glyph: `<circle cx="24" cy="24" r="14" ${W}/><ellipse cx="24" cy="24" rx="14" ry="6" ${W}/><ellipse cx="24" cy="24" rx="6" ry="14" ${W}/>` }),
  tile({ id: 'azure.aks', label: 'Kubernetes Service', category: 'Azure', bg: AZURE, glyph: `<path d="M24 9 L37 16 V32 L24 39 L11 32 V16 Z" ${W}/><circle cx="24" cy="24" r="4" ${W}/>` }),
  tile({ id: 'azure.loadbalancer', label: 'Load Balancer', category: 'Azure', bg: AZURE, glyph: `<circle cx="24" cy="12" r="4" ${W}/><circle cx="13" cy="36" r="4" ${W}/><circle cx="35" cy="36" r="4" ${W}/><path d="M24 16 v8 M24 24 l-11 8 M24 24 l11 8" ${W}/>` }),
];
