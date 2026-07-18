import { describe, expect, it } from 'vitest';
import { routeEdge } from './edgePath';
import { anchorPoint, nearestAnchor, pairAnchors } from './anchors';
import { createEdge, createPage, createShape } from '@/models/factory';
import type { Page } from '@/types';

function pageWithTwoShapes(): Page {
  const page = createPage();
  const a = createShape({ kind: 'rectangle', x: 0, y: 0, width: 100, height: 60 }, page.layers[0]!.id);
  const b = createShape({ kind: 'rectangle', x: 300, y: 200, width: 100, height: 60 }, page.layers[0]!.id);
  page.shapes[a.id] = a;
  page.shapes[b.id] = b;
  page.order.push(a.id, b.id);
  return page;
}

describe('anchors', () => {
  it('computes named anchor points', () => {
    const shape = createShape({ kind: 'rectangle', x: 0, y: 0, width: 100, height: 100 }, 'l');
    expect(anchorPoint(shape, 'top')).toEqual({ x: 50, y: 0 });
    expect(anchorPoint(shape, 'right')).toEqual({ x: 100, y: 50 });
    expect(anchorPoint(shape, 'bottom-right')).toEqual({ x: 100, y: 100 });
  });

  it('picks the nearest anchor to a target', () => {
    const shape = createShape({ kind: 'rectangle', x: 0, y: 0, width: 100, height: 100 }, 'l');
    expect(nearestAnchor(shape, { x: 200, y: 50 }).name).toBe('right');
    expect(nearestAnchor(shape, { x: 50, y: -50 }).name).toBe('top');
  });

  it('pairs anchors for vertical org-chart flow', () => {
    const parent = createShape({ kind: 'rectangle', x: 100, y: 0, width: 100, height: 60 }, 'l');
    const child = createShape({ kind: 'rectangle', x: 140, y: 120, width: 100, height: 60 }, 'l');
    expect(pairAnchors(parent, child)).toEqual({ source: 'bottom', target: 'top' });
  });
});

describe('routeEdge', () => {
  it('routes a straight edge between two shapes', () => {
    const page = pageWithTwoShapes();
    const [aId, bId] = page.order;
    const edge = createEdge({ source: { shapeId: aId }, target: { shapeId: bId }, router: 'straight' }, 'l');
    const routed = routeEdge(edge, page);
    expect(routed.path.startsWith('M')).toBe(true);
    expect(Number.isFinite(routed.start.x)).toBe(true);
    expect(Number.isFinite(routed.endAngle)).toBe(true);
  });

  it('produces multi-segment orthogonal paths', () => {
    const page = pageWithTwoShapes();
    const [aId, bId] = page.order;
    const edge = createEdge({ source: { shapeId: aId }, target: { shapeId: bId }, router: 'orthogonal' }, 'l');
    const routed = routeEdge(edge, page);
    expect((routed.path.match(/L/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('routes org-chart edges from bottom to top', () => {
    const page = createPage();
    const parent = createShape({ kind: 'rectangle', x: 100, y: 0, width: 100, height: 60 }, page.layers[0]!.id);
    const child = createShape({ kind: 'rectangle', x: 140, y: 120, width: 100, height: 60 }, page.layers[0]!.id);
    page.shapes[parent.id] = parent;
    page.shapes[child.id] = child;
    page.order.push(parent.id, child.id);
    const edge = createEdge({ source: { shapeId: parent.id }, target: { shapeId: child.id }, router: 'orthogonal' }, 'l');
    const routed = routeEdge(edge, page);
    expect(routed.start.y).toBe(parent.y + parent.height);
    expect(routed.end.y).toBe(child.y);
  });

  it('falls back to the floating point when a shape is missing', () => {
    const page = createPage();
    const edge = createEdge({ source: { point: { x: 10, y: 10 } }, target: { point: { x: 20, y: 30 } } }, 'l');
    const routed = routeEdge(edge, page);
    expect(routed.start).toEqual({ x: 10, y: 10 });
    expect(routed.end).toEqual({ x: 20, y: 30 });
  });
});
