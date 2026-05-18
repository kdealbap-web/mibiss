import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { App } from './App';
import { SessionProvider } from './context/SessionContext';
import { queryClient } from './lib/queryClient';

import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/admin.css';
import './styles/storyboard.css';
import './styles/home.css';
import './styles/map.css';
import './styles/drawer.css';

const container = document.getElementById('root');
if (!container) throw new Error('Falta el <div id="root"> en index.html');

const cfToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined;
if (cfToken && cfToken.length > 0 && typeof document !== 'undefined') {
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.dataset.cfBeacon = JSON.stringify({ token: cfToken });
  document.head.appendChild(s);
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionProvider>
          <App />
        </SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
