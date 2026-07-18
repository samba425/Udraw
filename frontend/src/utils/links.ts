/**
 * Safe external hyperlink opener with basic protocol allow-listing.
 * @module utils/links
 */

/** Open a user-supplied hyperlink in a new tab. */
export function openHyperlink(raw: string): void {
  const trimmed = raw.trim();
  if (!trimmed) return;
  let href = trimmed;
  if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
    href = `https://${href}`;
  }
  if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) return;
  window.open(href, '_blank', 'noopener,noreferrer');
}
