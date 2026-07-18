/**
 * Health and readiness endpoints.
 * @module routes/health
 */
import type { FastifyInstance } from 'fastify';
import { config, hasAiProvider } from '../config.js';

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get('/api/health', async () => ({
    status: 'ok',
    version: config.version,
    uptime: Math.round(process.uptime()),
    aiProvider: hasAiProvider() ? 'configured' : 'heuristic',
    timestamp: new Date().toISOString(),
  }));
}
