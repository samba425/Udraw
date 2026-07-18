/**
 * SVG sanitization for untrusted imports. Parses the markup and strips active
 * content (scripts, event handlers, external/JS references, foreignObject)
 * before the SVG is ever inserted into the DOM or stored. Also rejects any
 * document declaring a DTD/entities (XXE hardening).
 * @module services/import/sanitizeSvg
 */

/** Elements that must never survive sanitization. */
const FORBIDDEN_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'embed',
  'object',
  'audio',
  'video',
  'animate',
  'animatetransform',
  'animatemotion',
  'set',
  'handler',
  'listener',
]);

/** Attribute prefixes/names that carry executable or external content. */
const DANGEROUS_URI_ATTRS = new Set(['href', 'xlink:href', 'src', 'from', 'to', 'values', 'begin']);

/** Result of sanitizing an SVG: inner markup and the intrinsic view size. */
export interface SanitizedSvg {
  /** The inner markup (children of <svg>), safe to embed. */
  body: string;
  /** The square view size to author against (max of width/height/viewBox). */
  viewSize: number;
  /** Intrinsic width/height for sizing on the canvas. */
  width: number;
  height: number;
}

/** True when a URI value is safe (relative, fragment, or data image). */
function isSafeUri(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v.startsWith('#')) return true;
  if (v.startsWith('data:image/')) return true;
  // Block javascript:, vbscript:, data:text/html, and remote http(s) refs.
  return !/^[a-z][a-z0-9+.-]*:/.test(v);
}

/** Recursively strip dangerous elements and attributes from a node. */
function scrub(node: Element): void {
  // Depth-first so we can remove children safely.
  for (const child of Array.from(node.children)) {
    if (FORBIDDEN_TAGS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    scrub(child);
  }
  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on')) {
      node.removeAttribute(attr.name);
      continue;
    }
    if (DANGEROUS_URI_ATTRS.has(name) && !isSafeUri(attr.value)) {
      node.removeAttribute(attr.name);
      continue;
    }
    // Block style values that pull external resources or scripts.
    if (name === 'style' && /url\s*\(|expression\s*\(|javascript:/i.test(attr.value)) {
      node.removeAttribute(attr.name);
    }
  }
}

/**
 * Parse and sanitize an SVG string. Throws if the markup declares a DTD/entity
 * or is not a valid SVG document.
 */
export function sanitizeSvg(raw: string): SanitizedSvg {
  if (/<!DOCTYPE/i.test(raw) || /<!ENTITY/i.test(raw)) {
    throw new Error('SVG contains a DOCTYPE/entity declaration and was rejected.');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) throw new Error('File is not valid SVG.');

  const svg = doc.documentElement;
  if (!svg || svg.tagName.toLowerCase() !== 'svg') throw new Error('File is not an SVG.');

  scrub(svg);

  // Determine intrinsic size from width/height or viewBox.
  let width = parseFloat(svg.getAttribute('width') ?? '') || 0;
  let height = parseFloat(svg.getAttribute('height') ?? '') || 0;
  const viewBox = svg.getAttribute('viewBox');
  if ((!width || !height) && viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number);
    if (parts.length === 4) {
      width = width || parts[2]!;
      height = height || parts[3]!;
    }
  }
  width = width || 100;
  height = height || 100;

  // Wrap the sanitized inner content in a group that maps the intrinsic
  // viewBox onto a square view size so the icon renderer can scale it.
  const viewSize = Math.max(width, height);
  const vb = viewBox ?? `0 0 ${width} ${height}`;
  const body = `<svg viewBox="${vb}" width="${viewSize}" height="${viewSize}" preserveAspectRatio="xMidYMid meet">${svg.innerHTML}</svg>`;

  return { body, viewSize, width, height };
}
