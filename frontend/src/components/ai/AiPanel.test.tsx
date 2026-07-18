import { beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiPanel } from './AiPanel';
import { editorBus } from '@/utils/eventBus';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { createProject } from '@/models/factory';

describe('AiPanel (integration)', () => {
  beforeEach(() => {
    useProjectStore.getState().replaceProject(createProject());
    useHistoryStore.getState().clear();
  });

  it('opens on the ai:open event and generates a diagram offline', async () => {
    const user = userEvent.setup();
    render(<AiPanel />);

    // Hidden until the event fires.
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => editorBus.emit('ai:open', undefined));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Diagram description'),
      'Start -> Work -> Done',
    );
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    await waitFor(() => {
      const page = useProjectStore.getState().activePage();
      expect(Object.keys(page.shapes)).toHaveLength(3);
      expect(Object.keys(page.edges)).toHaveLength(2);
    });
  });
});
