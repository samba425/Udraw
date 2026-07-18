/**
 * Global keyboard shortcuts. Bindings follow the design spec. Shortcuts are
 * ignored while typing in inputs/textareas or editing shape text.
 * @module hooks/useKeyboardShortcuts
 */
import { useEffect } from 'react';
import type { ToolId } from '@/types';
import { useEditorStore } from '@/state/editorStore';
import { useHistoryStore } from '@/state/historyStore';
import { editorBus } from '@/utils/eventBus';
import {
  deleteSelection,
  duplicateSelection,
  groupSelection,
  nudgeSelection,
  selectAll,
  ungroupSelection,
} from '@/engine/commands/actions';
import { copySelection, cutSelection, paste } from '@/services/clipboard';
import { pluginManager } from '@/plugins/registry';
import { startPresentation } from '@/components/presentation/PresentationMode';
import { clearFormatPainter } from '@/engine/commands/formatPainter';

/** True when a keyboard event matches a `mod+shift+key` style combo. */
function matchesCombo(combo: string, e: KeyboardEvent): boolean {
  const parts = combo.toLowerCase().split('+');
  const wantMod = parts.includes('mod');
  const wantShift = parts.includes('shift');
  const wantAlt = parts.includes('alt');
  const key = parts[parts.length - 1];
  const mod = e.metaKey || e.ctrlKey;
  return (
    wantMod === mod &&
    wantShift === e.shiftKey &&
    wantAlt === e.altKey &&
    e.key.toLowerCase() === key
  );
}

/** Single-key tool shortcuts. */
const TOOL_KEYS: Record<string, ToolId> = {
  v: 'select',
  h: 'pan',
  r: 'rectangle',
  o: 'ellipse',
  d: 'diamond',
  t: 'text',
  c: 'connector',
  n: 'sticky-note',
  p: 'pen',
  e: 'eraser',
};

/** Whether an event target is a text entry we should not hijack. */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

/** Install global keyboard shortcuts for the lifetime of the component. */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const editor = useEditorStore.getState();
      if (editor.editingTextId || isEditable(e.target)) return;
      if (editor.readOnly && e.key !== 'Escape' && e.key !== 'F5') return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Plugin-contributed shortcuts take precedence for their combos.
      for (const shortcut of pluginManager.shortcuts()) {
        if (matchesCombo(shortcut.combo, e)) {
          e.preventDefault();
          pluginManager.runCommand(shortcut.command);
          return;
        }
      }

      if (mod) {
        switch (key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) useHistoryStore.getState().redo();
            else useHistoryStore.getState().undo();
            return;
          case 'y':
            e.preventDefault();
            useHistoryStore.getState().redo();
            return;
          case 'a':
            e.preventDefault();
            selectAll();
            return;
          case 'c':
            copySelection();
            return;
          case 'x':
            cutSelection();
            return;
          case 'v':
            paste();
            return;
          case 'd':
            e.preventDefault();
            duplicateSelection();
            return;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) ungroupSelection();
            else groupSelection();
            return;
          case 's':
            e.preventDefault();
            editorBus.emit('export:request', { format: 'json' });
            return;
          case 'f':
            e.preventDefault();
            editor.setSearchOpen(true);
            return;
          case 'p':
            e.preventDefault();
            editorBus.emit('export:request', { format: 'pdf' });
            return;
          case 'j':
            if (e.shiftKey) {
              e.preventDefault();
              const mode = editor.viewMode;
              editor.setViewMode(mode === 'source' ? 'canvas' : 'source');
            }
            return;
          case 'k':
            if (e.shiftKey) {
              e.preventDefault();
              editor.setViewMode(editor.viewMode === 'split' ? 'canvas' : 'split');
            }
            return;
          default:
            return;
        }
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelection();
          return;
        case 'Escape':
          if (editor.searchOpen) editor.setSearchOpen(false);
          if (editor.shortcutsOpen) editor.setShortcutsOpen(false);
          if (editor.templatesOpen) editor.setTemplatesOpen(false);
          if (editor.welcomeOpen) editor.setWelcomeOpen(false);
          if (editor.presentationOpen) editor.setPresentationOpen(false);
          if (editor.formatPainterActive) clearFormatPainter();
          editor.clearSelection();
          editor.setTool('select');
          return;
        case 'ArrowUp':
          e.preventDefault();
          nudgeSelection(0, e.shiftKey ? -10 : -1);
          return;
        case 'ArrowDown':
          e.preventDefault();
          nudgeSelection(0, e.shiftKey ? 10 : 1);
          return;
        case 'ArrowLeft':
          e.preventDefault();
          nudgeSelection(e.shiftKey ? -10 : -1, 0);
          return;
        case 'ArrowRight':
          e.preventDefault();
          nudgeSelection(e.shiftKey ? 10 : 1, 0);
          return;
      }

      if (e.key === '1' && e.shiftKey) {
        editorBus.emit('zoom:fit', undefined);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        editor.setShortcutsOpen(true);
        return;
      }

      if (e.key === 'F5') {
        e.preventDefault();
        if (!editor.readOnly && !editor.presentationOpen) startPresentation();
        return;
      }

      const tool = TOOL_KEYS[key];
      if (tool && !e.shiftKey) editor.setTool(tool);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
