import React from 'react';
import ReactDOM from 'react-dom/client';
import './rx/rx.css';
import App from './App';
import { receiveCarriedFile } from './rx/carry';
import { captureRef } from './rx/ref';

// Before anything renders: take in a file carried from another browser, file
// the ?ref= away, and clean the address bar.
receiveCarriedFile();
captureRef();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
