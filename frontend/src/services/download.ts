/**
 * Browser download helpers. Triggers a client-side file download from a Blob
 * or string without any server round-trip.
 * @module services/download
 */

/** Trigger a download of the given blob as `filename`. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Trigger a download of text content with a given MIME type. */
export function downloadText(text: string, filename: string, mime = 'text/plain'): void {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

/** Sanitize an arbitrary title into a safe file base name. */
export function safeFileName(name: string, fallback = 'diagram'): string {
  const base = name
    .trim()
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^[-.]+/, '')
    .slice(0, 80);
  return base || fallback;
}
