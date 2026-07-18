/**
 * Keyboard shortcut reference shown in the help dialog.
 * @module constants/shortcuts
 */

export interface ShortcutGroup {
  title: string;
  items: Array<{ keys: string; action: string }>;
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Tools',
    items: [
      { keys: 'V', action: 'Select' },
      { keys: 'H', action: 'Pan (hand)' },
      { keys: 'R', action: 'Rectangle' },
      { keys: 'O', action: 'Ellipse' },
      { keys: 'D', action: 'Diamond' },
      { keys: 'T', action: 'Text' },
      { keys: 'C', action: 'Connect shapes' },
      { keys: 'N', action: 'Sticky note' },
      { keys: 'P', action: 'Pen' },
      { keys: 'E', action: 'Eraser' },
    ],
  },
  {
    title: 'Editing',
    items: [
      { keys: 'Mod+Z', action: 'Undo' },
      { keys: 'Mod+Shift+Z', action: 'Redo' },
      { keys: 'Mod+A', action: 'Select all' },
      { keys: 'Mod+C / X / V', action: 'Copy / cut / paste' },
      { keys: 'Mod+D', action: 'Duplicate' },
      { keys: 'Mod+G', action: 'Group' },
      { keys: 'Mod+Shift+G', action: 'Ungroup' },
      { keys: 'Delete', action: 'Delete selection' },
      { keys: 'Arrow keys', action: 'Nudge (Shift = 10px)' },
    ],
  },
  {
    title: 'View & file',
    items: [
      { keys: 'Mod+F', action: 'Find in diagram' },
      { keys: 'Mod+S', action: 'Save as JSON' },
      { keys: 'Mod+P', action: 'Export PDF' },
      { keys: 'Shift+1', action: 'Fit to screen' },
      { keys: '?', action: 'This help panel' },
      { keys: 'Escape', action: 'Clear selection / close panels' },
    ],
  },
  {
    title: 'Connectors',
    items: [
      { keys: 'Select shape', action: 'Purple dots appear — drag to connect' },
      { keys: 'C', action: 'Connect tool — dots on all shapes' },
      { keys: 'Drag dot → shape', action: 'Create connector' },
    ],
  },
];
