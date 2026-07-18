import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DiagramEditor } from './DiagramEditor';

describe('DiagramEditor', () => {
  it('mounts the editor shell', () => {
    render(<DiagramEditor height={400} features={{ welcome: false, persistence: false }} />);
    expect(document.querySelector('.diagramforge-root')).toBeTruthy();
  });
});
