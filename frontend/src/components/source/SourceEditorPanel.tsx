/**
 * Text source editor — JSON, YAML, or Mermaid DSL with canvas sync.
 * @module components/source/SourceEditorPanel
 */
import { useCallback, useEffect, useState } from 'react';
import { Braces, Check, RefreshCw } from 'lucide-react';
import { useEditorStore } from '@/state/editorStore';
import {
  applySourceToCanvas,
  projectToSourceText,
  type SourceFormat,
} from '@/services/sourceEditor';
import { editorBus } from '@/utils/eventBus';

const FORMATS: Array<{ id: SourceFormat; label: string; hint: string }> = [
  { id: 'json', label: 'JSON', hint: 'Full project — all pages and settings' },
  { id: 'yaml', label: 'YAML', hint: 'Same data as JSON, easier to read' },
  { id: 'mermaid', label: 'Mermaid', hint: 'Simple flowchart DSL for the active page' },
];

interface SourceEditorPanelProps {
  /** When true, panel shares space with canvas (split view). */
  embedded?: boolean;
}

/** JSON / YAML / Mermaid editor with Apply and refresh actions. */
export function SourceEditorPanel({ embedded = false }: SourceEditorPanelProps): React.JSX.Element | null {
  const viewMode = useEditorStore((s) => s.viewMode);
  const sourceFormat = useEditorStore((s) => s.sourceFormat);
  const setSourceFormat = useEditorStore((s) => s.setSourceFormat);
  const setViewMode = useEditorStore((s) => s.setViewMode);
  const readOnly = useEditorStore((s) => s.readOnly);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const visible = viewMode === 'source' || viewMode === 'split';
  const formatMeta = FORMATS.find((f) => f.id === sourceFormat) ?? FORMATS[0]!;

  const loadFromCanvas = useCallback(() => {
    setText(projectToSourceText(useEditorStore.getState().sourceFormat));
    setError(null);
  }, []);

  useEffect(() => {
    if (visible) loadFromCanvas();
  }, [visible, sourceFormat, loadFromCanvas]);

  if (!visible) return null;

  const apply = (): void => {
    const err = applySourceToCanvas(text, sourceFormat);
    if (err) {
      setError(err);
      editorBus.emit('toast', { message: err, kind: 'error' });
      return;
    }
    setError(null);
    if (sourceFormat === 'mermaid') loadFromCanvas();
    editorBus.emit('toast', { message: 'Canvas updated.', kind: 'success' });
  };

  const shellClass = embedded
    ? 'flex h-full min-h-0 flex-col surface'
    : 'absolute inset-0 z-20 flex flex-col surface';

  return (
    <div className={shellClass}>
      <div
        className="flex flex-wrap items-center gap-2 border-b bordered px-3 py-2"
        style={{ background: 'var(--color-surface-alt)' }}
      >
        <Braces size={18} style={{ color: 'var(--color-accent)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Source editor
        </span>
        <div className="flex rounded-md border bordered p-0.5 text-xs">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSourceFormat(f.id)}
              className="rounded px-2 py-0.5 font-medium transition"
              style={{
                background: sourceFormat === f.id ? 'var(--color-accent)' : 'transparent',
                color: sourceFormat === f.id ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="hidden text-xs sm:inline" style={{ color: 'var(--color-text-muted)' }}>
          {formatMeta.hint}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={loadFromCanvas}
                className="df-focus-ring inline-flex items-center gap-1 rounded-md border bordered px-2.5 py-1 text-xs hover:brightness-110"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button
                type="button"
                onClick={apply}
                className="df-focus-ring inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                <Check size={14} /> Apply to canvas
              </button>
            </>
          )}
          {!embedded && (
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className="df-focus-ring rounded-md border bordered px-2.5 py-1 text-xs hover:brightness-110"
            >
              Canvas only
            </button>
          )}
          {embedded && (
            <button
              type="button"
              onClick={() => setViewMode('source')}
              className="df-focus-ring rounded-md border bordered px-2.5 py-1 text-xs hover:brightness-110"
            >
              Full editor
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b px-3 py-2 text-xs" style={{ background: '#fef2f2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {sourceFormat === 'mermaid' && (
        <div className="border-b px-3 py-1.5 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          Example:{' '}
          <code className="rounded bg-black/5 px-1">flowchart TD</code>{' '}
          <code className="rounded bg-black/5 px-1">A[&quot;Start&quot;] --&gt; B[&quot;End&quot;]</code>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        readOnly={readOnly}
        spellCheck={false}
        className="df-scroll min-h-0 flex-1 resize-none border-0 bg-transparent p-3 font-mono text-xs leading-relaxed outline-none"
        style={{ color: 'var(--color-text)' }}
        aria-label={`Diagram ${sourceFormat} source`}
      />
    </div>
  );
}
