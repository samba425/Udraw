/**
 * Fastify application factory. Registers security plugins (helmet, CORS,
 * rate limiting) and all route modules. Exported separately from the server
 * entrypoint so tests can build an app without binding a port.
 * @module app
 */
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { registerAiRoutes } from './routes/ai.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerProjectRoutes } from './routes/projects.js';

/** Build a fully-configured Fastify instance. */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel },
    // Cap request bodies to protect against large-payload DoS.
    bodyLimit: 5 * 1024 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
  });
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindow,
  });

  registerHealthRoutes(app);
  registerAiRoutes(app);
  registerProjectRoutes(app);

  return app;
}
