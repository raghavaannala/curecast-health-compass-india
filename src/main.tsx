import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n'; // Import i18n configuration
import { LanguageProvider } from './contexts/LanguageContext';
import { GlobalLanguageProvider } from './contexts/GlobalLanguageContext';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/contexts/UserContext';
import { BrowserRouter } from 'react-router-dom';

// Register service worker for offline support (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service worker registered:', registration);
      })
      .catch(error => {
        console.error('Service worker registration failed:', error);
      });
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <GlobalLanguageProvider>
      <UserProvider>
        <LanguageProvider>
          <BrowserRouter>
            <App />
            <Toaster />
          </BrowserRouter>
        </LanguageProvider>
      </UserProvider>
    </GlobalLanguageProvider>
  </React.StrictMode>
);
