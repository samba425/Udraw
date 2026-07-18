/**
 * Kubernetes shape library. Brand-blue tiles with resource glyphs.
 * @module shapes/libraries/kubernetes
 */
import { tile } from './builders';
import type { LibraryIcon } from '@/shapes/registry';

const K8S = '#326ce5';
const W = 'fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

const hept = (label: string, id: string, inner: string): ReturnType<typeof tile> =>
  tile({
    id,
    label,
    category: 'Kubernetes',
    bg: K8S,
    glyph: `<path d="M24 8 L36 14 L39 27 L31 38 L17 38 L9 27 L12 14 Z" ${W}/>${inner}`,
  });

export const KUBERNETES_ICONS: LibraryIcon[] = [
  hept('Pod', 'k8s.pod', `<text x="24" y="29" text-anchor="middle" fill="#fff" font-size="12" font-family="sans-serif" font-weight="700">pod</text>`),
  hept('Deployment', 'k8s.deployment', `<text x="24" y="29" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif" font-weight="700">D</text>`),
  hept('Service', 'k8s.service', `<text x="24" y="29" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif" font-weight="700">svc</text>`),
  hept('Ingress', 'k8s.ingress', `<text x="24" y="29" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif" font-weight="700">ing</text>`),
  hept('ConfigMap', 'k8s.configmap', `<text x="24" y="29" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif" font-weight="700">cm</text>`),
  hept('Secret', 'k8s.secret', `<text x="24" y="30" text-anchor="middle" fill="#fff" font-size="16" font-family="sans-serif" font-weight="700">S</text>`),
  hept('Node', 'k8s.node', `<text x="24" y="30" text-anchor="middle" fill="#fff" font-size="16" font-family="sans-serif" font-weight="700">N</text>`),
  hept('Namespace', 'k8s.namespace', `<text x="24" y="29" text-anchor="middle" fill="#fff" font-size="14" font-family="sans-serif" font-weight="700">ns</text>`),
];
