/**
 * AI diagram generator dialog. Opens via the toolbar sparkle button or the
 * `ai:open` event. Sends the prompt to the optional backend and, on success (or
 * offline fallback), builds a diagram on the active page centered in view.
 * @module components/ai/AiPanel
 */
import { useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { editorBus } from '@/utils/eventBus';
import { useEditorStore } from '@/state/editorStore';
import { screenToWorld } from '@/utils/geometry';
import { generateDiagram, isBackendConfigured } from '@/services/ai/aiClient';
import { buildDiagramFromSpec } from '@/services/ai/buildDiagram';

const EXAMPLES = [
  'User signs up -> Verify email -> Set password -> Log in',
  'Order received; Check stock; Is item available?; Ship order; Notify customer',
  'Idea, Research, Prototype, Test, Launch',
];

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

/** Modal dialog for prompt-based diagram generation. */
export function AiPanel(): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => editorBus.on('ai:open', () => setOpen(true)), []);
  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

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

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Generate diagram with AI"
      onMouseDown={close}
    >
      <div
        className="w-[min(560px,92vw)] rounded-xl border bordered shadow-2xl surface"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b bordered px-4 py-3">
          <Sparkles size={18} style={{ color: 'var(--color-accent, #7c3aed)' }} />
          <h2 className="flex-1 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Generate diagram
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

        <div className="px-4 py-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void generate();
            }}
            rows={4}
            placeholder="Describe a process or flow. Separate steps with commas, new lines, or arrows (->)."
            aria-label="Diagram description"
            className="df-focus-ring w-full resize-none rounded-lg border bordered bg-transparent px-3 py-2 text-sm outline-none"
            style={{ color: 'var(--color-text)' }}
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
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
            {isBackendConfigured() ? 'Using backend AI service' : 'Offline generator'}
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
              onClick={() => void generate()}
              disabled={busy || !prompt.trim()}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--color-accent, #7c3aed)' }}
            >
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
