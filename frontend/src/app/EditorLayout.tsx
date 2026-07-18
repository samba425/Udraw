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
import { useEditorStore } from '@/state/editorStore';
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
  const saveStatus = useAutosave();
  useKeyboardShortcuts();
  useFileActions();
  useEditorDialogs();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && <Sidebar />}
        <main className="relative min-w-0 flex-1">
          <Canvas />
          <TextEditorOverlay />
          <Minimap />
          <DiagramSearch />
          <span
            className="pointer-events-none absolute bottom-2 right-3 text-[11px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {SAVE_LABEL[saveStatus]}
          </span>
        </main>
        {propertyPanelOpen && <PropertyPanel />}
      </div>
      <PagesBar />
      <ContextMenu />
      <AiPanel />
      <WelcomeDialog />
      <TemplatesDialog />
      <ShortcutsDialog />
      <Toaster />
    </div>
  );
}
