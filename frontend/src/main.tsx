/**
 * Application entry point. Mounts the React tree and global styles.
 * @module main
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DiagramEditor } from '@/lib/DiagramEditor';
import { loadShareFromLocation } from './services/share/urlShare';
import './styles/index.css';

const shared = loadShareFromLocation();
if (shared) {
  sessionStorage.setItem('diagramforge.welcomeShown', '1');
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <DiagramEditor
      standalone
      initialProject={shared?.project}
      readOnly={shared?.viewOnly ?? false}
      features={shared ? { welcome: false } : undefined}
      height="100%"
    />
  </StrictMode>,
);
