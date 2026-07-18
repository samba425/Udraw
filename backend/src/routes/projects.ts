/**
 * Project sync endpoints. Stores whole-project snapshots keyed by id with
 * last-write-wins semantics. Payloads are size-capped by the server body limit.
 * @module routes/projects
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getProject, listProjects, saveProject } from '../store/projectStore.js';

const SyncBodySchema = z.object({
  id: z.string().min(1).max(128),
  // The project document is opaque to the backend; validated on the client.
  data: z.unknown(),
});

const IdParamsSchema = z.object({
  id: z.string().min(1).max(128),
});

export function registerProjectRoutes(app: FastifyInstance): void {
  app.get('/api/projects', async () => ({ projects: listProjects() }));

  app.post('/api/projects/sync', async (request, reply) => {
    const parsed = SyncBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten(),
      });
    }
    const record = saveProject(parsed.data.id, parsed.data.data);
    return reply.send({
      id: record.id,
      revision: record.revision,
      updatedAt: record.updatedAt,
    });
  });

  app.get('/api/projects/:id', async (request, reply) => {
    const parsed = IdParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'invalid_request' });
    }
    const record = getProject(parsed.data.id);
    if (!record) return reply.status(404).send({ error: 'not_found' });
    return reply.send(record);
  });
}
