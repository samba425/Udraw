import { describe, expect, it } from 'vitest';
import { computeSnap } from './snap';

describe('computeSnap', () => {
  it('snaps left edges within threshold', () => {
    const moving = { x: 103, y: 0, width: 50, height: 50 };
    const statics = [{ x: 100, y: 200, width: 50, height: 50 }];
    const result = computeSnap(moving, statics, 6);
    expect(result.dx).toBe(-3);
    expect(result.guides.some((g) => g.orientation === 'v')).toBe(true);
  });

  it('does not snap beyond threshold', () => {
    // Moving edges/center (160/185/210) are all >6 from static edges (100/125/150).
    const moving = { x: 160, y: 0, width: 50, height: 50 };
    const statics = [{ x: 100, y: 200, width: 50, height: 50 }];
    const result = computeSnap(moving, statics, 6);
    expect(result.dx).toBe(0);
    expect(result.dy).toBe(0);
  });

  it('snaps centers together', () => {
    const moving = { x: 0, y: 0, width: 50, height: 50 }; // center x=25
    const statics = [{ x: 4, y: 300, width: 50, height: 50 }]; // center x=29
    const result = computeSnap(moving, statics, 6);
    expect(result.dx).toBe(4);
  });
});
