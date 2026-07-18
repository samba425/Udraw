/**
 * Runtime configuration sourced entirely from environment variables. Secrets
 * (provider API keys) stay server-side and are never sent to the client.
 * @module config
 */

/** Parse a comma-separated origin list into an array (or `true` for any). */
function parseOrigins(value: string | undefined): string[] | boolean {
  if (!value || value === '*') return value === '*';
  return value.split(',').map((o) => o.trim()).filter(Boolean);
}

export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 8787),
  /** Allowed CORS origins; defaults to the Vite dev server. */
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN) || ['http://localhost:5173'],
  /** Requests allowed per window per IP. */
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 60),
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW ?? '1 minute',
  /** Optional AI provider config (kept server-side only). */
  aiProvider: process.env.AI_PROVIDER ?? '',
  aiApiKey: process.env.AI_API_KEY ?? '',
  aiModel: process.env.AI_MODEL ?? '',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  version: process.env.APP_VERSION ?? '0.1.0',
} as const;

/** True when a real AI provider is configured. */
export function hasAiProvider(): boolean {
  return Boolean(config.aiProvider && config.aiApiKey);
}
