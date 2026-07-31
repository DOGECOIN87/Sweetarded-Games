import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';

// Polyfill Buffer globally for browser compatibility with Solana libraries
if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';
import App from './App';

/* Theatre.js Studio — visual motion editor overlay, dev only. The whole
   branch (and the studio package) is eliminated from production builds. */
if (import.meta.env.DEV) {
  import('@theatre/studio').then(({ default: studio }) => studio.initialize());
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
