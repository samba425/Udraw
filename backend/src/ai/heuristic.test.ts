import { describe, expect, it } from 'vitest';
import { DiagramSpecSchema } from '../diagramSpec.js';
import { generateHeuristicDiagram } from './heuristic.js';

describe('generateHeuristicDiagram', () => {
  it('splits arrow-separated prompts into sequential nodes', () => {
    const spec = generateHeuristicDiagram('Sign up -> Verify email -> Log in');
    expect(spec.nodes).toHaveLength(3);
    expect(spec.edges).toHaveLength(2);
    expect(spec.nodes[0]?.kind).toBe('start');
    expect(spec.nodes[2]?.kind).toBe('end');
    expect(DiagramSpecSchema.safeParse(spec).success).toBe(true);
  });

  it('detects decision steps ending with a question mark', () => {
    const spec = generateHeuristicDiagram('Start\nIs the user valid?\nGrant access');
    const decision = spec.nodes.find((n) => n.kind === 'decision');
    expect(decision).toBeDefined();
    expect(spec.edges.some((e) => e.label === 'yes')).toBe(true);
  });

  it('respects the maxNodes cap', () => {
    const spec = generateHeuristicDiagram('a; b; c; d; e; f', 3);
    expect(spec.nodes.length).toBeLessThanOrEqual(3);
  });

  it('always produces at least one node', () => {
    const spec = generateHeuristicDiagram('Just a single idea');
    expect(spec.nodes.length).toBeGreaterThanOrEqual(1);
  });
});
