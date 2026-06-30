import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerAppServiceWorker } from './lib/runtimeIntegrations';
import './index.css';

declare global {
  const __APP_VERSION__: string;
  const __APP_BUILD_REF__: string;
  const __APP_BUILD_DATE__: string;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.addEventListener('load', () => {
  registerAppServiceWorker().catch(() => undefined);
});
