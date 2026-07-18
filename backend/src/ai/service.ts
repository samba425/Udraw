/**
 * AI diagram generation service. Uses a configured OpenAI-compatible provider
 * when available, and always falls back to the offline heuristic generator so
 * the endpoint works with zero configuration. Provider keys never leave the
 * server.
 * @module ai/service
 */
import { config, hasAiProvider } from '../config.js';
import { DiagramSpecSchema, type DiagramSpec } from '../diagramSpec.js';
import { generateHeuristicDiagram } from './heuristic.js';

/** The origin/source of a generated diagram. */
export type GenerationSource = 'provider' | 'heuristic';

/** Result of a generation request. */
export interface GenerationResult {
  spec: DiagramSpec;
  source: GenerationSource;
}

const SYSTEM_PROMPT = `You convert user requests into a JSON flowchart specification.
Respond with ONLY compact JSON matching this TypeScript type, no prose:
{ "title"?: string, "direction": "TB"|"LR",
  "nodes": { "id": string, "label": string, "kind": "start"|"end"|"process"|"decision"|"data"|"actor"|"note" }[],
  "edges": { "from": string, "to": string, "label"?: string }[] }
Use short ids like n1, n2. Keep labels concise.`;

/** Attempt provider-backed generation via an OpenAI-compatible endpoint. */
async function generateWithProvider(prompt: string, maxNodes: number): Promise<DiagramSpec> {
  const endpoint =
    process.env.AI_BASE_URL ?? 'https://api.openai.com/v1/chat/completions';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${prompt}\n\n(Use at most ${maxNodes} nodes.)` },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Provider responded ${response.status}`);
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty provider response');
    return DiagramSpecSchema.parse(JSON.parse(content));
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generate a diagram spec for a prompt. Tries the provider (if configured),
 * otherwise (or on any failure) returns a heuristic diagram.
 */
export async function generateDiagram(
  prompt: string,
  maxNodes: number,
): Promise<GenerationResult> {
  if (hasAiProvider()) {
    try {
      const spec = await generateWithProvider(prompt, maxNodes);
      return { spec, source: 'provider' };
    } catch {
      // Fall through to the offline generator on any provider error.
    }
  }
  return { spec: generateHeuristicDiagram(prompt, maxNodes), source: 'heuristic' };
}
