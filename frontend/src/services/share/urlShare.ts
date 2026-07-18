/**
 * Share diagrams via URL hash (no server required). Encodes the project JSON
 * as base64url in `#d=...` (editable) or `#dv=...` (view-only).
 * @module services/share/urlShare
 */
import type { Project } from '@/types';
import { parseProject, serializeProject } from '@/services/project/fileFormat';

const EDIT_PREFIX = 'd=';
const VIEW_PREFIX = 'dv=';

export interface ShareLoadResult {
  project: Project;
  viewOnly: boolean;
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(payload: string): string {
  let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode a project into a shareable hash fragment (without leading `#`). */
export function encodeShareHash(project: Project, viewOnly = false): string {
  const json = serializeProject(project);
  const prefix = viewOnly ? VIEW_PREFIX : EDIT_PREFIX;
  return prefix + toBase64Url(json);
}

/** Decode a hash fragment into a project, or null if invalid / missing. */
export function decodeShareHash(hash: string): ShareLoadResult | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  let payload: string;
  let viewOnly = false;
  if (raw.startsWith(VIEW_PREFIX)) {
    payload = raw.slice(VIEW_PREFIX.length);
    viewOnly = true;
  } else if (raw.startsWith(EDIT_PREFIX)) {
    payload = raw.slice(EDIT_PREFIX.length);
  } else {
    return null;
  }
  try {
    return { project: parseProject(fromBase64Url(payload)), viewOnly };
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the current page location. */
export function buildShareUrl(project: Project, viewOnly = false): string {
  const base = window.location.href.split('#')[0]!;
  return `${base}#${encodeShareHash(project, viewOnly)}`;
}

/** Copy the editable share URL to the clipboard. */
export async function copyShareLink(project: Project): Promise<string> {
  const url = buildShareUrl(project, false);
  await navigator.clipboard.writeText(url);
  return url;
}

/** Copy a view-only share URL to the clipboard. */
export async function copyViewOnlyShareLink(project: Project): Promise<string> {
  const url = buildShareUrl(project, true);
  await navigator.clipboard.writeText(url);
  return url;
}

/** If the current location hash contains a shared diagram, return it. */
export function loadShareFromLocation(): ShareLoadResult | null {
  return decodeShareHash(window.location.hash);
}
