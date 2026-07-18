import { describe, expect, it } from 'vitest';
import { buildQuadtree, Quadtree, type QuadItem } from './quadtree';

function grid(count: number, cell = 40): QuadItem[] {
  const side = Math.ceil(Math.sqrt(count));
  const items: QuadItem[] = [];
  for (let i = 0; i < count; i++) {
    const gx = i % side;
    const gy = Math.floor(i / side);
    items.push({
      id: `n${i}`,
      bounds: { x: gx * cell, y: gy * cell, width: cell - 4, height: cell - 4 },
    });
  }
  return items;
}

describe('Quadtree', () => {
  it('returns only items intersecting the query range', () => {
    const tree = new Quadtree({ x: 0, y: 0, width: 1000, height: 1000 });
    tree.insert({ id: 'a', bounds: { x: 10, y: 10, width: 20, height: 20 } });
    tree.insert({ id: 'b', bounds: { x: 500, y: 500, width: 20, height: 20 } });

    const hits = tree.query({ x: 0, y: 0, width: 100, height: 100 });
    expect(hits.has('a')).toBe(true);
    expect(hits.has('b')).toBe(false);
  });

  it('matches a brute-force scan for a random range', () => {
    const items = grid(2000);
    const tree = buildQuadtree(items);
    const range = { x: 300, y: 300, width: 250, height: 250 };

    const fromTree = tree.query(range);
    const brute = new Set(
      items
        .filter(
          (it) =>
            it.bounds.x < range.x + range.width &&
            it.bounds.x + it.bounds.width > range.x &&
            it.bounds.y < range.y + range.height &&
            it.bounds.y + it.bounds.height > range.y,
        )
        .map((it) => it.id),
    );
    expect(fromTree).toEqual(brute);
  });

  it('answers point queries', () => {
    const tree = buildQuadtree(grid(500));
    const hits = tree.queryPoint({ x: 2, y: 2 });
    expect(hits.has('n0')).toBe(true);
  });

  it('handles an empty index', () => {
    const tree = buildQuadtree([]);
    expect(tree.query({ x: 0, y: 0, width: 100, height: 100 }).size).toBe(0);
  });

  it('scales to 10k items and answers a small query quickly', () => {
    const items = grid(10000);
    const tree = buildQuadtree(items);
    const start = performance.now();
    let total = 0;
    for (let i = 0; i < 200; i++) {
      total += tree.query({ x: 100, y: 100, width: 150, height: 150 }).size;
    }
    const elapsed = performance.now() - start;
    expect(total).toBeGreaterThan(0);
    // 200 windowed queries over 10k nodes should be well under a second.
    expect(elapsed).toBeLessThan(1000);
  });
});
