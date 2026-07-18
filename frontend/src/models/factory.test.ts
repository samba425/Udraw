import { describe, expect, it } from 'vitest';
import { createEdge, createPage, createProject, createShape } from './factory';

describe('factory', () => {
  it('creates a colorful shape with defaults', () => {
    const shape = createShape({ kind: 'rectangle', x: 0, y: 0, width: 100, height: 50 }, 'layer1', 0);
    expect(shape.id).toMatch(/^shape_/);
    expect(shape.fill.type).toBe('solid');
    expect(shape.fill.color).not.toBe('#ffffff');
    expect(shape.stroke).toBeTruthy();
    expect(shape.layerId).toBe('layer1');
  });

  it('gives rounded rectangles a corner radius', () => {
    const shape = createShape(
      { kind: 'rounded-rectangle', x: 0, y: 0, width: 100, height: 50 },
      'layer1',
    );
    expect(shape.cornerRadius).toBeGreaterThan(0);
  });

  it('creates an edge with an end arrow by default', () => {
    const edge = createEdge({ source: { shapeId: 'a' }, target: { shapeId: 'b' } }, 'layer1');
    expect(edge.endArrow).toBe('triangle');
    expect(edge.router).toBe('orthogonal');
  });

  it('creates a project with one page and one layer', () => {
    const project = createProject('Test');
    expect(project.name).toBe('Test');
    expect(project.pages).toHaveLength(1);
    expect(project.pages[0]!.layers).toHaveLength(1);
  });

  it('creates independent pages', () => {
    const a = createPage('A');
    const b = createPage('B');
    expect(a.id).not.toBe(b.id);
  });
});
