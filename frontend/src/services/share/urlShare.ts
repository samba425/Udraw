/**
 * Share diagrams via URL hash (no server required). Encodes the project JSON
 * as base64url in `#d=...` so links work on GitHub Pages and static hosts.
 * @module services/share/urlShare
 */
import type { Project } from '@/types';
import { parseProject, serializeProject } from '@/services/project/fileFormat';

const HASH_PREFIX = 'd=';

/** Encode a project into a shareable hash fragment (without leading `#`). */
export function encodeShareHash(project: Project): string {
  const json = serializeProject(project);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return HASH_PREFIX + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode a hash fragment into a project, or null if invalid / missing. */
export function decodeShareHash(hash: string): Project | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw.startsWith(HASH_PREFIX)) return null;
  try {
    let b64 = raw.slice(HASH_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return parseProject(json);
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the current page location. */
export function buildShareUrl(project: Project): string {
  const base = window.location.href.split('#')[0]!;
  return `${base}#${encodeShareHash(project)}`;
}

/** Copy the share URL to the clipboard. Returns the URL. */
export async function copyShareLink(project: Project): Promise<string> {
  const url = buildShareUrl(project);
  await navigator.clipboard.writeText(url);
  return url;
}

/** If the current location hash contains a shared diagram, return it. */
export function loadShareFromLocation(): Project | null {
  return decodeShareHash(window.location.hash);
}
