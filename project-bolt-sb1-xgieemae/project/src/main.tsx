// Global error handler to suppress known xterm.js async errors
// This must run before any other code to catch errors before Vite's overlay
window.addEventListener('error', (event) => {
  // Suppress xterm dimensions error - occurs when terminal disposes during async operations
  if (event.message?.includes('dimensions') && 
      (event.filename?.includes('xterm') || event.error?.stack?.includes('xterm'))) {
    event.preventDefault();
    event.stopImmediatePropagation();
    console.warn('[XTerminal] Suppressed async dimensions error (safe to ignore)');
    return true;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason);
  if (msg.includes('dimensions')) {
    event.preventDefault();
    console.warn('[XTerminal] Suppressed async dimensions rejection (safe to ignore)');
  }
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import { TerminalProvider } from './contexts/TerminalContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <TerminalProvider>
        <App />
      </TerminalProvider>
    </AppProvider>
  </StrictMode>
);