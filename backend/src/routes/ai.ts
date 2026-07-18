/**
 * AI diagram generation endpoint. Validates input with zod and delegates to the
 * generation service (provider or offline heuristic).
 * @module routes/ai
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { generateDiagram } from '../ai/service.js';

const GenerateBodySchema = z.object({
  prompt: z.string().min(1).max(4000),
  maxNodes: z.number().int().min(1).max(100).optional(),
});

export function registerAiRoutes(app: FastifyInstance): void {
  app.post('/api/ai/generate', async (request, reply) => {
    const parsed = GenerateBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten(),
      });
    }
    const { prompt, maxNodes = 30 } = parsed.data;
    const result = await generateDiagram(prompt, maxNodes);
    return reply.send(result);
  });
}
