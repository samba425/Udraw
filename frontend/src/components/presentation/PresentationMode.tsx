/**
 * Full-screen presentation mode: cycle through pages as slides or step through a flow path.
 * @module components/presentation/PresentationMode
 */
import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useEditorStore } from '@/state/editorStore';
import { useProjectStore } from '@/state/projectStore';
import { Canvas } from '@/components/canvas/Canvas';
import { contentBounds } from '@/services/export/serializeSvg';
import { computeFlowPath } from '@/engine/presentation/flowPath';

/** Fullscreen slide viewer over the existing pages. */
export function PresentationMode(): React.JSX.Element | null {
  const open = useEditorStore((s) => s.presentationOpen);
  const setOpen = useEditorStore((s) => s.setPresentationOpen);
  const slideIndex = useEditorStore((s) => s.presentationIndex);
  const setSlideIndex = useEditorStore((s) => s.setPresentationIndex);
  const flowActive = useEditorStore((s) => s.presentationFlowActive);
  const flowStep = useEditorStore((s) => s.presentationFlowStep);
  const flowPath = useEditorStore((s) => s.presentationFlowPath);
  const setFlowActive = useEditorStore((s) => s.setPresentationFlowActive);
  const setFlowStep = useEditorStore((s) => s.setPresentationFlowStep);
  const setFlowPath = useEditorStore((s) => s.setPresentationFlowPath);
  const fitToBounds = useEditorStore((s) => s.fitToBounds);
  const pages = useProjectStore((s) => s.project.pages);
  const activePageId = useProjectStore((s) => s.activePageId);
  const setActivePage = useProjectStore((s) => s.setActivePage);

  const goSlide = useCallback(
    (delta: number): void => {
      const idx = pages.findIndex((p) => p.id === activePageId);
      const next = Math.max(0, Math.min(pages.length - 1, idx + delta));
      setSlideIndex(next);
      setActivePage(pages[next]!.id);
    },
    [pages, activePageId, setActivePage, setSlideIndex],
  );

  const goFlow = useCallback(
    (delta: number): void => {
      if (flowPath.length === 0) return;
      const next = Math.max(0, Math.min(flowPath.length - 1, flowStep + delta));
      setFlowStep(next);
    },
    [flowPath.length, flowStep, setFlowStep],
  );

  useEffect(() => {
    if (!open) return;
    const idx = pages.findIndex((p) => p.id === activePageId);
    if (idx >= 0) setSlideIndex(idx);
  }, [open, pages, activePageId, setSlideIndex]);

  useEffect(() => {
    if (!open) return;
    const page = pages[slideIndex];
    if (!page) return;
    setFlowPath(computeFlowPath(page));
    setFlowStep(0);
    const bounds = contentBounds(page);
    if (!bounds) return;
    const t = setTimeout(() => {
      fitToBounds(bounds, { width: window.innerWidth, height: window.innerHeight - 56 }, 40);
    }, 50);
    return () => clearTimeout(t);
  }, [open, slideIndex, pages, fitToBounds, setFlowPath, setFlowStep]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
      if (flowActive) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
          e.preventDefault();
          goFlow(1);
        }
        if (e.key === 'ArrowLeft') goFlow(-1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goSlide(1);
      }
      if (e.key === 'ArrowLeft') goSlide(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flowActive, goFlow, goSlide, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center gap-3 px-4 py-2 text-white/90">
        <span className="text-sm font-medium">
          Slide {slideIndex + 1} / {pages.length}
        </span>
        <span className="truncate text-sm text-white/60">{pages[slideIndex]?.name}</span>

        <button
          type="button"
          onClick={() => setFlowActive(!flowActive)}
          className={`ml-2 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium ${
            flowActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10'
          }`}
          title="Step through connected flow (Space / arrows)"
        >
          <Play size={14} />
          Flow
        </button>

        {flowActive && flowPath.length > 0 && (
          <span className="text-xs text-white/60">
            Step {flowStep + 1} / {flowPath.length}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label={flowActive ? 'Previous step' : 'Previous slide'}
            onClick={() => (flowActive ? goFlow(-1) : goSlide(-1))}
            className="rounded p-2 hover:bg-white/10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label={flowActive ? 'Next step' : 'Next slide'}
            onClick={() => (flowActive ? goFlow(1) : goSlide(1))}
            className="rounded p-2 hover:bg-white/10"
          >
            <ChevronRight size={20} />
          </button>
          <button type="button" aria-label="Exit presentation" onClick={() => setOpen(false)} className="rounded p-2 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <Canvas readOnly />
      </div>
    </div>
  );
}

/** Open presentation mode from the current page. */
export function startPresentation(): void {
  const store = useProjectStore.getState();
  const idx = store.project.pages.findIndex((p) => p.id === store.activePageId);
  useEditorStore.getState().setPresentationIndex(Math.max(0, idx));
  useEditorStore.getState().setPresentationFlowActive(false);
  useEditorStore.getState().setPresentationFlowStep(0);
  useEditorStore.getState().setPresentationOpen(true);
}
