import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('health', () => {
  it('reports ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });
});

describe('ai generate', () => {
  it('rejects an empty prompt', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate',
      payload: { prompt: '' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns a heuristic spec for a valid prompt', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/ai/generate',
      payload: { prompt: 'Login -> Dashboard -> Logout' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.source).toBe('heuristic');
    expect(body.spec.nodes).toHaveLength(3);
  });
});

describe('project sync', () => {
  it('stores and retrieves a project', async () => {
    const sync = await app.inject({
      method: 'POST',
      url: '/api/projects/sync',
      payload: { id: 'proj-1', data: { name: 'Test' } },
    });
    expect(sync.statusCode).toBe(200);
    expect(sync.json().revision).toBe(1);

    const get = await app.inject({ method: 'GET', url: '/api/projects/proj-1' });
    expect(get.statusCode).toBe(200);
    expect(get.json().data).toMatchObject({ name: 'Test' });
  });

  it('404s for unknown projects', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/projects/missing' });
    expect(res.statusCode).toBe(404);
  });
});
