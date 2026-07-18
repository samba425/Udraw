/**
 * Offline, dependency-free diagram generator. Turns a natural-language prompt
 * into a linear flowchart specification by splitting it into steps. Used as the
 * default generator and as a fallback when no AI provider is configured.
 * @module ai/heuristic
 */
import type { DiagramNode, DiagramSpec } from '../diagramSpec.js';

/** Split a prompt into ordered step strings. */
function splitSteps(prompt: string): string[] {
  const normalized = prompt.trim();
  if (!normalized) return [];

  // Prefer explicit separators (arrows, newlines, semicolons, "then").
  const bySeparators = normalized
    .split(/\n|->|=>|;|\bthen\b|→/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bySeparators.length > 1) return bySeparators;

  // Fall back to numbered/bulleted lists.
  const byList = normalized
    .split(/(?:^|\s)(?:\d+[.)]|[-*•])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byList.length > 1) return byList;

  // Otherwise split into sentences.
  const bySentence = normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/[.!?]+$/, '').trim())
    .filter(Boolean);
  return bySentence.length > 0 ? bySentence : [normalized];
}

/** Classify a step's node kind by simple keyword heuristics. */
function classify(step: string, index: number, total: number): DiagramNode['kind'] {
  const lower = step.toLowerCase();
  if (/\?$|^(if|whether|decide|check|is |are |should)/.test(lower)) return 'decision';
  if (/(store|save|database|record|data|file)/.test(lower)) return 'data';
  if (/(user|customer|actor|person|admin)/.test(lower)) return 'actor';
  if (index === 0) return 'start';
  if (index === total - 1) return 'end';
  return 'process';
}

/** Trim a step down to a concise node label. */
function toLabel(step: string): string {
  return step.replace(/\s+/g, ' ').slice(0, 80);
}

/** Generate a flowchart specification from a prompt. */
export function generateHeuristicDiagram(prompt: string, maxNodes = 30): DiagramSpec {
  const steps = splitSteps(prompt).slice(0, Math.max(1, maxNodes));
  const nodes: DiagramSpec['nodes'] = steps.map((step, i) => ({
    id: `n${i + 1}`,
    label: toLabel(step),
    kind: classify(step, i, steps.length),
  }));

  const edges: DiagramSpec['edges'] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i]!;
    const to = nodes[i + 1]!;
    edges.push({
      from: from.id,
      to: to.id,
      ...(from.kind === 'decision' ? { label: 'yes' } : {}),
    });
  }

  return {
    title: toLabel(prompt).slice(0, 60),
    direction: 'TB',
    nodes,
    edges,
  };
}
