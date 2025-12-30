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