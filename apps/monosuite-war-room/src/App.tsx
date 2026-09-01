import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router';
import { CreateRoomPage } from './pages/create-room';
import { ResourcesPage } from './pages/resources';
import { RoomPage } from './pages/room';
import { RoomsPage } from './pages/rooms';
import { SettingsPage } from './pages/settings';
import { routes } from './shared/routes';

const GH_PAGES_REDIRECT_KEY = 'gh-pages-redirect';
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

function RedirectRecovery() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = sessionStorage.getItem(GH_PAGES_REDIRECT_KEY);
    if (redirect) {
      sessionStorage.removeItem(GH_PAGES_REDIRECT_KEY);
      navigate(redirect, { replace: true });
    }
  }, [navigate]);

  return null;
}

export function App() {
  return (
    <BrowserRouter basename={basename || undefined}>
      <RedirectRecovery />
      <Routes>
        <Route path={routes.rooms} element={<RoomsPage />} />
        <Route path={routes.room} element={<RoomPage />} />
        <Route path={routes.createRoom} element={<CreateRoomPage />} />
        <Route path={routes.resources} element={<ResourcesPage />} />
        <Route path={routes.settings} element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={routes.room} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
