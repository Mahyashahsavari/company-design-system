import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ColorSchemeScript } from '@mantine/core';
import { warRoomTheme } from '@monosuite/theme';
import { MonosuiteProvider } from '@monosuite/ui';
import '@monosuite/theme/styles.css';
import { App } from './App';
import { initAppUiScale } from './shared/constants';
import './app.css';

initAppUiScale();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MonosuiteProvider theme={warRoomTheme} defaultColorScheme="light">
      <App />
    </MonosuiteProvider>
  </StrictMode>,
);
