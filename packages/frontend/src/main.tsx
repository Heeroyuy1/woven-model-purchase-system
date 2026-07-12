import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111b36',
            color: '#d1d5db',
            border: '1px solid rgba(34, 211, 238, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#22d3ee',
              secondary: '#0a0f1e',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0a0f1e',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);