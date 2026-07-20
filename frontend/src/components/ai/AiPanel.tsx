/**
 * AI diagram generator and natural-language editor dialog.
 * @module components/ai/AiPanel
 */
import { useEffect, useRef, useState } from 'react';
import { Pencil, Sparkles, X } from 'lucide-react';
import { editorBus } from '@/utils/eventBus';
import { useEditorStore } from '@/state/editorStore';
import { screenToWorld } from '@/utils/geometry';
import { generateDiagram, isBackendConfigured } from '@/services/ai/aiClient';
import { buildDiagramFromSpec } from '@/services/ai/buildDiagram';
import { applyNaturalLanguageEdit } from '@/services/ai/editDiagram';

const GENERATE_EXAMPLES = [
  'User signs up -> Verify email -> Set password -> Log in',
  'Order received; Check stock; Is item available?; Ship order; Notify customer',
  'Idea, Research, Prototype, Test, Launch',
];

const EDIT_EXAMPLES = [
  'Add cache between API and DB',
  'Add logging after gateway',
  'Connect frontend to API',
  'Delete old step',
];

type AiMode = 'generate' | 'edit';

/** World-space top-left anchor for a generated layout, biased above-left of center. */
function layoutOrigin(): { x: number; y: number } {
  const camera = useEditorStore.getState().camera;
  const rect = document.querySelector('[aria-label="Diagram canvas"]')?.getBoundingClientRect();
  const center = screenToWorld(
    { x: (rect?.width ?? 800) / 2, y: (rect?.height ?? 600) / 2 },
    camera,
  );
  return { x: center.x - 95, y: center.y - 200 };
}

/** Modal dialog for prompt-based diagram generation and editing. */
export function AiPanel(): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AiMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => editorBus.on('ai:open', () => setOpen(true)), []);
  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open, mode]);

  if (!open) return null;

  const close = (): void => {
    if (!busy) setOpen(false);
  };

  const generate = async (): Promise<void> => {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const { spec, source } = await generateDiagram(trimmed);
      buildDiagramFromSpec(spec, layoutOrigin());
      editorBus.emit('zoom:fit', undefined);
      editorBus.emit('toast', {
        message:
          source === 'provider'
            ? `Generated ${spec.nodes.length} nodes with AI.`
            : `Generated ${spec.nodes.length} nodes (offline).`,
        kind: 'success',
      });
      setOpen(false);
      setPrompt('');
    } catch (err) {
      editorBus.emit('toast', {
        message: err instanceof Error ? err.message : 'Generation failed.',
        kind: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const edit = (): void => {
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const error = applyNaturalLanguageEdit(trimmed);
      if (error) {
        editorBus.emit('toast', { message: error, kind: 'error' });
        return;
      }
      editorBus.emit('toast', { message: 'Diagram updated.', kind: 'success' });
      setOpen(false);
      setPrompt('');
    } finally {
      setBusy(false);
    }
  };

  const examples = mode === 'generate' ? GENERATE_EXAMPLES : EDIT_EXAMPLES;
  const title = mode === 'generate' ? 'Generate diagram' : 'Edit diagram';
  const placeholder =
    mode === 'generate'
      ? 'Describe a process or flow. Separate steps with commas, new lines, or arrows (->).'
      : 'Describe a change, e.g. "Add cache between API and DB" or "Connect A to B".';

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={close}
    >
      <div
        className="w-[min(560px,92vw)] rounded-xl border bordered shadow-2xl surface"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b bordered px-4 py-3">
          {mode === 'generate' ? (
            <Sparkles size={18} style={{ color: 'var(--color-accent, #7c3aed)' }} />
          ) : (
            <Pencil size={18} style={{ color: 'var(--color-accent, #7c3aed)' }} />
          )}
          <h2 className="flex-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="rounded p-1 hover:brightness-125"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-b bordered px-4 pt-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'generate'}
            onClick={() => setMode('generate')}
            className={`rounded-t-md px-3 py-1.5 text-xs font-medium ${
              mode === 'generate' ? 'border bordered border-b-0 bg-[var(--color-surface)]' : 'text-[var(--color-text-muted)]'
            }`}
          >
            Generate mode
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'edit'}
            onClick={() => setMode('edit')}
            className={`rounded-t-md px-3 py-1.5 text-xs font-medium ${
              mode === 'edit' ? 'border bordered border-b-0 bg-[var(--color-surface)]' : 'text-[var(--color-text-muted)]'
            }`}
          >
            Edit mode
          </button>
        </div>

        <div className="px-4 py-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (mode === 'generate') void generate();
                else edit();
              }
            }}
            rows={4}
            placeholder={placeholder}
            aria-label={mode === 'generate' ? 'Diagram description' : 'Edit instruction'}
            className="df-focus-ring w-full resize-none rounded-lg border bordered bg-transparent px-3 py-2 text-sm outline-none"
            style={{ color: 'var(--color-text)' }}
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                className="max-w-full truncate rounded-full border bordered px-2.5 py-1 text-[11px] hover:brightness-125"
                style={{ color: 'var(--color-text-muted)' }}
                title={ex}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t bordered px-4 py-3">
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            {mode === 'generate'
              ? isBackendConfigured()
                ? 'Using backend AI service'
                : 'Offline generator'
              : 'Offline edit heuristics'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="rounded-lg border bordered px-3 py-1.5 text-sm hover:brightness-125 disabled:opacity-50"
              style={{ color: 'var(--color-text)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => (mode === 'generate' ? void generate() : edit())}
              disabled={busy || !prompt.trim()}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--color-accent, #7c3aed)' }}
            >
              {busy ? (mode === 'generate' ? 'Generating…' : 'Applying…') : mode === 'generate' ? 'Generate' : 'Apply edit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
