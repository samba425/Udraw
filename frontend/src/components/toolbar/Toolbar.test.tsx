import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './Toolbar';
import { editorBus } from '@/utils/eventBus';
import { useEditorStore } from '@/state/editorStore';

describe('Toolbar (integration)', () => {
  beforeEach(() => {
    useEditorStore.getState().setTool('select');
  });

  it('activates a drawing tool when its button is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar />);
    await user.click(screen.getByRole('button', { name: 'Rectangle (R)' }));
    expect(useEditorStore.getState().tool).toBe('rectangle');
  });

  it('emits the ai:open event from the AI button', async () => {
    const user = userEvent.setup();
    let opened = false;
    const off = editorBus.on('ai:open', () => {
      opened = true;
    });
    render(<Toolbar />);
    await user.click(screen.getByRole('button', { name: 'Generate with AI' }));
    off();
    expect(opened).toBe(true);
  });
});
