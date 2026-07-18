/**
 * Application entry point. Mounts the React tree and global styles.
 * @module main
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { registerBuiltinLibraries } from './shapes/libraries';
import { registerBuiltinPlugins } from './plugins';
import { loadShareFromLocation } from './services/share/urlShare';
import { useProjectStore } from './state/projectStore';
import { useHistoryStore } from './state/historyStore';
import './styles/index.css';

registerBuiltinLibraries();
registerBuiltinPlugins();

const sharedProject = loadShareFromLocation();
if (sharedProject) {
  useProjectStore.getState().replaceProject(sharedProject);
  useHistoryStore.getState().clear();
  sessionStorage.setItem('diagramforge.welcomeShown', '1');
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
