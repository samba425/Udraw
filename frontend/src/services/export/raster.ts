/**
 * Rasterizes an SVG string to a PNG (or JPEG) blob / data URL by drawing it
 * onto a canvas. Runs on the main thread using an `Image`, which works across
 * all browsers (including Safari) where `createImageBitmap` on SVG blobs does
 * not. The draw itself is asynchronous so the UI stays responsive.
 * @module services/export/raster
 */

/** Options for rasterization. */
export interface RasterOptions {
  /** Device-independent scale multiplier (2 == retina). */
  scale?: number;
  /** Output MIME type. */
  type?: 'image/png' | 'image/jpeg';
  /** JPEG quality (0..1). */
  quality?: number;
  /** Background fill (needed for opaque JPEG). */
  background?: string;
}

/** Load an SVG string into an HTMLImageElement. */
function loadSvgImage(svg: string, width: number, height: number): Promise<HTMLImageElement> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.width = width;
    img.height = height;
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG'));
    };
    img.src = url;
  });
}

/** Draw an SVG string onto a canvas at the requested scale. */
async function drawToCanvas(
  svg: string,
  width: number,
  height: number,
  options: RasterOptions,
): Promise<HTMLCanvasElement> {
  const scale = options.scale ?? 2;
  const img = await loadSvgImage(svg, width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Rasterize an SVG string to an image blob. */
export async function rasterizeToBlob(
  svg: string,
  width: number,
  height: number,
  options: RasterOptions = {},
): Promise<Blob> {
  const canvas = await drawToCanvas(svg, width, height, options);
  const type = options.type ?? 'image/png';
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      type,
      options.quality,
    );
  });
}

/** Rasterize an SVG string to a data URL (used by PDF embedding). */
export async function rasterizeToDataUrl(
  svg: string,
  width: number,
  height: number,
  options: RasterOptions = {},
): Promise<{ dataUrl: string; pixelWidth: number; pixelHeight: number }> {
  const canvas = await drawToCanvas(svg, width, height, options);
  return {
    dataUrl: canvas.toDataURL(options.type ?? 'image/png', options.quality),
    pixelWidth: canvas.width,
    pixelHeight: canvas.height,
  };
}
