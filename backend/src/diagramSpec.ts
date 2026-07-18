/**
 * The neutral diagram specification exchanged between the AI generator and the
 * frontend renderer. Deliberately minimal and layout-agnostic: the frontend
 * lays out and styles nodes/edges when building real shapes.
 * @module diagramSpec
 */
import { z } from 'zod';

/** A single node in a generated diagram. */
export const DiagramNodeSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(200),
  /** High-level node role used to pick a shape kind. */
  kind: z
    .enum(['start', 'end', 'process', 'decision', 'data', 'actor', 'note'])
    .default('process'),
});

/** A directed connection between two nodes. */
export const DiagramEdgeSchema = z.object({
  from: z.string().min(1).max(64),
  to: z.string().min(1).max(64),
  label: z.string().max(120).optional(),
});

/** A complete generated diagram specification. */
export const DiagramSpecSchema = z.object({
  title: z.string().max(120).optional(),
  direction: z.enum(['TB', 'LR']).default('TB'),
  nodes: z.array(DiagramNodeSchema).max(200),
  edges: z.array(DiagramEdgeSchema).max(400),
});

export type DiagramNode = z.infer<typeof DiagramNodeSchema>;
export type DiagramEdge = z.infer<typeof DiagramEdgeSchema>;
export type DiagramSpec = z.infer<typeof DiagramSpecSchema>;
