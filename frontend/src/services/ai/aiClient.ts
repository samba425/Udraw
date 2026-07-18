/**
 * Client for the optional backend AI service. Attempts a network request to the
 * configured API base URL and gracefully falls back to the offline heuristic
 * generator when the backend is missing, unreachable, or returns an error. The
 * editor therefore remains fully functional with no backend at all.
 * @module services/ai/aiClient
 */
import { parseDiagramSpec, type DiagramSpec } from './diagramSpec';
import { generateHeuristicDiagram } from './heuristic';

/** Where a generated spec came from. */
export type GenerationSource = 'provider' | 'heuristic' | 'offline';

/** Result of a generation request. */
export interface GenerationResult {
  spec: DiagramSpec;
  source: GenerationSource;
}

/** Resolve the backend base URL from Vite env, if configured. */
function apiBaseUrl(): string | undefined {
  const url = import.meta.env.VITE_API_BASE_URL;
  return typeof url === 'string' && url.trim() ? url.replace(/\/$/, '') : undefined;
}

/** True when a backend base URL is configured. */
export function isBackendConfigured(): boolean {
  return apiBaseUrl() !== undefined;
}

/**
 * Generate a diagram spec from a prompt. Uses the backend when configured and
 * reachable; otherwise returns a locally-generated spec.
 */
export async function generateDiagram(
  prompt: string,
  maxNodes = 30,
): Promise<GenerationResult> {
  const base = apiBaseUrl();
  if (base) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(`${base}/api/ai/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, maxNodes }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        const data = (await response.json()) as { spec: unknown; source?: string };
        const spec = parseDiagramSpec(data.spec);
        return { spec, source: data.source === 'provider' ? 'provider' : 'heuristic' };
      }
    } catch {
      // Fall through to offline generation on any network/parse error.
    }
  }
  return { spec: generateHeuristicDiagram(prompt, maxNodes), source: 'offline' };
}
