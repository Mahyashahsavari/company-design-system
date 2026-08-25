import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ColorSchemeScript } from '@mantine/core';
import { MonosuiteProvider } from '@monosuite/ui';
import '@monosuite/theme/styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MonosuiteProvider defaultColorScheme="light">
      <App />
    </MonosuiteProvider>
  </StrictMode>,
);
