import { useState } from 'react';
import { DiagramEditor, type Project } from '@diagramforge/react';
import '@diagramforge/react/styles.css';

/**
 * Minimal host app showing how to embed DiagramForge in another React project.
 */
export default function App(): React.JSX.Element {
  const [lastSave, setLastSave] = useState<string>('');

  const handleChange = (project: Project): void => {
    setLastSave(new Date().toLocaleTimeString());
    // Persist to your API:
    // await fetch('/api/diagrams/1', { method: 'PUT', body: JSON.stringify(project) });
    void project;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui' }}>
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e2e5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
        }}
      >
        <strong>My App — Diagram Editor Embed</strong>
        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {lastSave ? `Last change: ${lastSave}` : 'Edit the diagram below'}
        </span>
      </header>
      <DiagramEditor
        height="calc(100vh - 49px)"
        onChange={handleChange}
        apiBaseUrl={import.meta.env.VITE_API_BASE_URL}
        features={{ welcome: false, persistence: false }}
      />
    </div>
  );
}
