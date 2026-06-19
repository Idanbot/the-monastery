import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProviders } from './lib/AppProviders';
import { registerAppServiceWorker } from './lib/runtimeIntegrations';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);

window.addEventListener('load', () => {
  registerAppServiceWorker().catch(() => undefined);
});
