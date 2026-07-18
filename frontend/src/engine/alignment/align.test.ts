import { describe, expect, it } from 'vitest';
import { alignShapes, distributeShapes } from './align';
import { createShape } from '@/models/factory';
import type { Shape } from '@/types';

function rect(x: number, y: number, w = 40, h = 40): Shape {
  return createShape({ kind: 'rectangle', x, y, width: w, height: h }, 'l');
}

describe('alignShapes', () => {
  it('aligns left edges', () => {
    const shapes = [rect(10, 0), rect(50, 40), rect(80, 80)];
    const patch = alignShapes(shapes, 'left');
    for (const s of shapes) expect(patch[s.id]!.x).toBe(10);
  });

  it('aligns horizontal centers', () => {
    const shapes = [rect(0, 0, 40, 40), rect(0, 60, 80, 40)];
    const patch = alignShapes(shapes, 'hcenter');
    // bounding box center is at x=40; each shape centers on it.
    expect(patch[shapes[0]!.id]!.x).toBe(20);
    expect(patch[shapes[1]!.id]!.x).toBe(0);
  });

  it('is a no-op for fewer than 2 shapes', () => {
    expect(alignShapes([rect(0, 0)], 'left')).toEqual({});
  });
});

describe('distributeShapes', () => {
  it('creates equal horizontal gaps', () => {
    const shapes = [rect(0, 0, 20, 20), rect(30, 0, 20, 20), rect(100, 0, 20, 20)];
    const patch = distributeShapes(shapes, 'horizontal');
    const xs = shapes.map((s) => patch[s.id]!.x!).sort((a, b) => a - b);
    const gap1 = xs[1]! - (xs[0]! + 20);
    const gap2 = xs[2]! - (xs[1]! + 20);
    expect(Math.round(gap1)).toBe(Math.round(gap2));
  });

  it('needs at least 3 shapes', () => {
    expect(distributeShapes([rect(0, 0), rect(50, 0)], 'horizontal')).toEqual({});
  });
});
