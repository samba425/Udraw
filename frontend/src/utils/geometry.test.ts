import { describe, expect, it } from 'vitest';
import {
  boundingBox,
  clamp,
  pointInRect,
  rectFromPoints,
  rectsIntersect,
  screenToWorld,
  snapToStep,
  worldToScreen,
} from './geometry';

describe('geometry', () => {
  it('clamps values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('snaps to step', () => {
    expect(snapToStep(23, 10)).toBe(20);
    expect(snapToStep(26, 10)).toBe(30);
    expect(snapToStep(26, 0)).toBe(26);
  });

  it('round-trips screen/world with camera', () => {
    const camera = { x: 100, y: 50, zoom: 2 };
    const world = { x: 30, y: 40 };
    const screen = worldToScreen(world, camera);
    expect(screenToWorld(screen, camera)).toEqual(world);
  });

  it('detects point-in-rect and intersections', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(pointInRect({ x: 5, y: 5 }, rect)).toBe(true);
    expect(pointInRect({ x: 15, y: 5 }, rect)).toBe(false);
    expect(rectsIntersect(rect, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(rectsIntersect(rect, { x: 20, y: 20, width: 5, height: 5 })).toBe(false);
  });

  it('builds a normalized rect from two points', () => {
    expect(rectFromPoints({ x: 10, y: 10 }, { x: 0, y: 4 })).toEqual({
      x: 0,
      y: 4,
      width: 10,
      height: 6,
    });
  });

  it('computes a bounding box', () => {
    const box = boundingBox([
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 5, width: 10, height: 10 },
    ]);
    expect(box).toEqual({ x: 0, y: 0, width: 30, height: 15 });
  });
});
