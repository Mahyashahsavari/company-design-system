import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ColorSchemeScript } from '@mantine/core';
import { warRoomTheme } from '@monosuite/theme';
import { MonosuiteProvider } from '@monosuite/ui';
import '@monosuite/theme/styles.css';
import { App } from './App';
import { APP_UI_SCALE } from './shared/constants';
import './app.css';

document.getElementById('root')!.style.setProperty('--war-room-ui-scale', String(APP_UI_SCALE));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="light" />
    <MonosuiteProvider theme={warRoomTheme} defaultColorScheme="light">
      <App />
    </MonosuiteProvider>
  </StrictMode>,
);
