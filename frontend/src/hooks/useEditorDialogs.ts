/**
 * Wires template, shortcuts, and welcome dialogs to the event bus and shows
 * the welcome hub once per session (unless a share URL was loaded).
 * @module hooks/useEditorDialogs
 */
import { useEffect } from 'react';
import { useWelcomeOnStartup } from '@/components/dialogs/WelcomeDialog';
import { useEditorStore } from '@/state/editorStore';
import { editorBus } from '@/utils/eventBus';

/** Mount dialog event listeners and startup welcome flow. */
export function useEditorDialogs(): void {
  const setTemplatesOpen = useEditorStore((s) => s.setTemplatesOpen);
  const setShortcutsOpen = useEditorStore((s) => s.setShortcutsOpen);
  const setWelcomeOpen = useEditorStore((s) => s.setWelcomeOpen);

  useWelcomeOnStartup();

  useEffect(() => {
    const offTemplates = editorBus.on('templates:open', () => setTemplatesOpen(true));
    const offShortcuts = editorBus.on('shortcuts:open', () => setShortcutsOpen(true));
    const offWelcome = editorBus.on('welcome:open', () => setWelcomeOpen(true));
    return () => {
      offTemplates();
      offShortcuts();
      offWelcome();
    };
  }, [setTemplatesOpen, setShortcutsOpen, setWelcomeOpen]);
}
