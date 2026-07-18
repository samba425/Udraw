/**
 * The main editor layout: toolbar on top, sidebar left, canvas center,
 * property panel right, pages bar bottom.
 * @module app/EditorLayout
 */
import { Toolbar } from '@/components/toolbar/Toolbar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { Canvas } from '@/components/canvas/Canvas';
import { Minimap } from '@/components/canvas/Minimap';
import { DiagramSearch } from '@/components/canvas/DiagramSearch';
import { PropertyPanel } from '@/components/property-panel/PropertyPanel';
import { PagesBar } from '@/components/pages/PagesBar';
import { ContextMenu } from '@/components/menus/ContextMenu';
import { TextEditorOverlay } from '@/components/canvas/TextEditorOverlay';
import { AiPanel } from '@/components/ai/AiPanel';
import { Toaster } from '@/components/ui/Toaster';
import { WelcomeDialog } from '@/components/dialogs/WelcomeDialog';
import { TemplatesDialog } from '@/components/dialogs/TemplatesDialog';
import { ShortcutsDialog } from '@/components/dialogs/ShortcutsDialog';
import { PresentationMode } from '@/components/presentation/PresentationMode';
import { SourceEditorPanel } from '@/components/source/SourceEditorPanel';
import { ViewOnlyBanner } from '@/components/ui/ViewOnlyBanner';
import { useEditorStore } from '@/state/editorStore';
import { isFeatureEnabled } from '@/lib/runtimeConfig';
import { useAutosave } from '@/hooks/useAutosave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFileActions } from '@/hooks/useFileActions';
import { useEditorDialogs } from '@/hooks/useEditorDialogs';

const SAVE_LABEL: Record<string, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'All changes saved',
};

/** Compose the full editor UI shell. */
export function EditorLayout(): React.JSX.Element {
  const sidebarOpen = useEditorStore((s) => s.sidebarOpen);
  const propertyPanelOpen = useEditorStore((s) => s.propertyPanelOpen);
  const readOnly = useEditorStore((s) => s.readOnly);
  const viewMode = useEditorStore((s) => s.viewMode);
  const saveStatus = useAutosave();
  useKeyboardShortcuts();
  useFileActions();
  useEditorDialogs();

  const showCanvas = viewMode === 'canvas' || viewMode === 'split';
  const showSource = viewMode === 'source' || viewMode === 'split';
  const canvasOnly = viewMode === 'canvas';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <ViewOnlyBanner />
      {!readOnly && <Toolbar />}
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && !readOnly && canvasOnly && <Sidebar />}
        <main
          className={`relative min-w-0 flex-1 ${viewMode === 'split' ? 'flex flex-row' : ''}`}
        >
          {showCanvas && (
            <div className={viewMode === 'split' ? 'relative min-h-0 min-w-0 flex-1' : 'absolute inset-0'}>
              <Canvas />
              {!readOnly && showCanvas && <TextEditorOverlay />}
              {canvasOnly && !readOnly && isFeatureEnabled('minimap') && <Minimap />}
              {canvasOnly && !readOnly && <DiagramSearch />}
              {canvasOnly && !readOnly && (
                <span
                  className="pointer-events-none absolute bottom-2 right-3 text-[11px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {SAVE_LABEL[saveStatus]}
                </span>
              )}
            </div>
          )}
          {showSource && isFeatureEnabled('sourceEditor') && (
            <div
              className={
                viewMode === 'split'
                  ? 'min-h-0 min-w-0 flex-1 border-l bordered'
                  : 'absolute inset-0 z-20'
              }
            >
              <SourceEditorPanel embedded={viewMode === 'split'} />
            </div>
          )}
        </main>
        {propertyPanelOpen && !readOnly && canvasOnly && <PropertyPanel />}
      </div>
      {!readOnly && <PagesBar />}
      {!readOnly && canvasOnly && <ContextMenu />}
      {!readOnly && canvasOnly && isFeatureEnabled('ai') && <AiPanel />}
      {isFeatureEnabled('welcome') && <WelcomeDialog />}
      {!readOnly && canvasOnly && <TemplatesDialog />}
      {!readOnly && canvasOnly && <ShortcutsDialog />}
      {isFeatureEnabled('presentation') && <PresentationMode />}
      <Toaster />
    </div>
  );
}
