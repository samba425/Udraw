/**
 * Pure alignment and distribution math. Each function takes the selected
 * shapes and returns a map of `{ id -> positional patch }` to apply.
 * @module engine/alignment/align
 */
import type { Shape } from '@/types';
import { boundingBox } from '@/utils/geometry';

/** Supported alignment operations. */
export type AlignMode = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom';

/** Supported distribution axes. */
export type DistributeMode = 'horizontal' | 'vertical';

type PositionPatch = Record<string, { x?: number; y?: number }>;

/** Align shapes to a shared edge/center within their bounding box. */
export function alignShapes(shapes: Shape[], mode: AlignMode): PositionPatch {
  const box = boundingBox(shapes.map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height })));
  if (!box || shapes.length < 2) return {};
  const patch: PositionPatch = {};
  for (const s of shapes) {
    switch (mode) {
      case 'left':
        patch[s.id] = { x: box.x };
        break;
      case 'right':
        patch[s.id] = { x: box.x + box.width - s.width };
        break;
      case 'hcenter':
        patch[s.id] = { x: box.x + box.width / 2 - s.width / 2 };
        break;
      case 'top':
        patch[s.id] = { y: box.y };
        break;
      case 'bottom':
        patch[s.id] = { y: box.y + box.height - s.height };
        break;
      case 'vcenter':
        patch[s.id] = { y: box.y + box.height / 2 - s.height / 2 };
        break;
    }
  }
  return patch;
}

/** Distribute shapes so the gaps between them are equal along an axis. */
export function distributeShapes(shapes: Shape[], mode: DistributeMode): PositionPatch {
  if (shapes.length < 3) return {};
  const isH = mode === 'horizontal';
  const sorted = [...shapes].sort((a, b) => (isH ? a.x - b.x : a.y - b.y));
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const start = isH ? first.x : first.y;
  const end = isH ? last.x + last.width : last.y + last.height;
  const totalSize = sorted.reduce((sum, s) => sum + (isH ? s.width : s.height), 0);
  const gap = (end - start - totalSize) / (sorted.length - 1);

  const patch: PositionPatch = {};
  let cursor = start;
  for (const s of sorted) {
    patch[s.id] = isH ? { x: cursor } : { y: cursor };
    cursor += (isH ? s.width : s.height) + gap;
  }
  return patch;
}
