import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initTheme } from './lib/theme';
// Registers Svelte grammar on @git-diff-view/lowlight for PR diffs
import '@/lib/registerSvelteHighlight';
import './index.css';

initTheme();

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
