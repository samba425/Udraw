/**
 * Top toolbar: tool selection, history, zoom, theme, and file actions.
 * @module components/toolbar/Toolbar
 */
import {
  Circle,
  Diamond,
  Hexagon,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  Moon,
  Hand,
  Pencil,
  Plus,
  Redo2,
  Square,
  SquareDashed,
  StickyNote,
  Sun,
  Triangle,
  Type,
  Undo2,
  Eraser,
  Maximize,
  MessageSquare,
  Map as MapIcon,
  Search,
  Sparkles,
  LayoutTemplate,
  Link2,
  Keyboard,
  Network,
} from 'lucide-react';
import { Puzzle } from 'lucide-react';
import type { ThemeMode, ToolId } from '@/types';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { IconButton } from '@/components/ui/IconButton';
import { editorBus } from '@/utils/eventBus';
import { pluginManager } from '@/plugins/registry';
import { FileMenu } from './FileMenu';
import { applyAutoLayout } from '@/engine/layout/autoLayout';
import { copyShareLink } from '@/services/share/urlShare';
import { useProjectStore } from '@/state/projectStore';

interface ToolDef {
  id: ToolId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select (V)', icon: MousePointer2 },
  { id: 'pan', label: 'Pan (H)', icon: Hand },
  { id: 'rectangle', label: 'Rectangle (R)', icon: Square },
  { id: 'rounded-rectangle', label: 'Rounded rectangle', icon: SquareDashed },
  { id: 'ellipse', label: 'Ellipse (O)', icon: Circle },
  { id: 'diamond', label: 'Diamond (D)', icon: Diamond },
  { id: 'triangle', label: 'Triangle', icon: Triangle },
  { id: 'hexagon', label: 'Hexagon', icon: Hexagon },
  { id: 'connector', label: 'Connect shapes (C)', icon: Minus },
  { id: 'text', label: 'Text (T)', icon: Type },
  { id: 'sticky-note', label: 'Sticky note (N)', icon: StickyNote },
  { id: 'comment', label: 'Comment', icon: MessageSquare },
  { id: 'pen', label: 'Pen (P)', icon: Pencil },
  { id: 'eraser', label: 'Eraser (E)', icon: Eraser },
  { id: 'image', label: 'Image', icon: ImageIcon },
];

const THEME_SEQUENCE: ThemeMode[] = ['light', 'dark', 'system'];

/** Application top toolbar. */
export function Toolbar(): React.JSX.Element {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const themeMode = useEditorStore((s) => s.themeMode);
  const setThemeMode = useEditorStore((s) => s.setThemeMode);
  const camera = useEditorStore((s) => s.camera);
  const setZoom = useEditorStore((s) => s.setZoom);
  const minimapOpen = useEditorStore((s) => s.minimapOpen);
  const toggleMinimap = useEditorStore((s) => s.toggleMinimap);
  const setSearchOpen = useEditorStore((s) => s.setSearchOpen);
  const setTemplatesOpen = useEditorStore((s) => s.setTemplatesOpen);
  const setShortcutsOpen = useEditorStore((s) => s.setShortcutsOpen);
  const selectedIds = useEditorStore((s) => s.selectedIds);

  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const zoomCenter = (): { x: number; y: number } => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const cycleTheme = (): void => {
    const next = THEME_SEQUENCE[(THEME_SEQUENCE.indexOf(themeMode) + 1) % THEME_SEQUENCE.length]!;
    setThemeMode(next);
  };

  const shareLink = (): void => {
    void copyShareLink(useProjectStore.getState().project)
      .then(() => editorBus.emit('toast', { message: 'Share link copied to clipboard.', kind: 'success' }))
      .catch(() => editorBus.emit('toast', { message: 'Could not copy share link.', kind: 'error' }));
  };

  const autoLayout = (): void => {
    const shapeIds = selectedIds.filter((id) => useProjectStore.getState().activePage().shapes[id]);
    applyAutoLayout(shapeIds.length > 0 ? shapeIds : undefined);
    editorBus.emit('toast', {
      message: shapeIds.length > 0 ? 'Auto-layout applied to selection.' : 'Auto-layout applied to page.',
      kind: 'success',
    });
  };

  return (
    <div
      className="flex items-center gap-1 border-b bordered px-2 py-1.5 surface"
      role="toolbar"
      aria-label="Editor toolbar"
    >
      <FileMenu />
      <Divider />

      {TOOLS.map((t) => (
        <IconButton
          key={t.id}
          label={t.label}
          active={tool === t.id}
          onClick={() =>
            t.id === 'image' ? editorBus.emit('import:request', undefined) : setTool(t.id)
          }
        >
          <t.icon size={18} />
        </IconButton>
      ))}

      <Divider />
      <IconButton label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
        <Undo2 size={18} />
      </IconButton>
      <IconButton label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}>
        <Redo2 size={18} />
      </IconButton>

      <Divider />
      <IconButton label="Zoom out" onClick={() => setZoom(camera.zoom / 1.2, zoomCenter())}>
        <Minus size={18} />
      </IconButton>
      <span
        className="w-12 text-center text-xs tabular-nums"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {Math.round(camera.zoom * 100)}%
      </span>
      <IconButton label="Zoom in" onClick={() => setZoom(camera.zoom * 1.2, zoomCenter())}>
        <Plus size={18} />
      </IconButton>
      <IconButton label="Fit to screen (Shift+1)" onClick={() => editorBus.emit('zoom:fit', undefined)}>
        <Maximize size={18} />
      </IconButton>

      {pluginManager.toolbarItems().length > 0 && <Divider />}
      {pluginManager.toolbarItems().map((item) => (
        <IconButton
          key={item.id}
          label={item.title}
          onClick={() => pluginManager.runCommand(item.command)}
        >
          <Puzzle size={18} />
        </IconButton>
      ))}

      <div className="ml-auto" />
      <IconButton label="Templates" onClick={() => setTemplatesOpen(true)}>
        <LayoutTemplate size={18} />
      </IconButton>
      <IconButton label="Auto layout" onClick={autoLayout}>
        <Network size={18} />
      </IconButton>
      <IconButton label="Copy share link" onClick={shareLink}>
        <Link2 size={18} />
      </IconButton>
      <IconButton label="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)}>
        <Keyboard size={18} />
      </IconButton>
      <IconButton label="Generate with AI" onClick={() => editorBus.emit('ai:open', undefined)}>
        <Sparkles size={18} />
      </IconButton>
      <IconButton label="Find (Ctrl+F)" onClick={() => setSearchOpen(true)}>
        <Search size={18} />
      </IconButton>
      <IconButton label="Toggle minimap" active={minimapOpen} onClick={toggleMinimap}>
        <MapIcon size={18} />
      </IconButton>
      <IconButton label={`Theme: ${themeMode}`} onClick={cycleTheme}>
        {themeMode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
      </IconButton>
    </div>
  );
}

function Divider(): React.JSX.Element {
  return <div className="mx-1 h-6 w-px" style={{ background: 'var(--color-border)' }} />;
}
