import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { CreateRoomPage } from './pages/create-room';
import { ResourcesPage } from './pages/resources';
import { RoomPage } from './pages/room';
import { SettingsPage } from './pages/settings';
import { routes } from './shared/routes';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={routes.room} element={<RoomPage />} />
        <Route path={routes.createRoom} element={<CreateRoomPage />} />
        <Route path={routes.resources} element={<ResourcesPage />} />
        <Route path={routes.settings} element={<SettingsPage />} />
        <Route path="*" element={<Navigate to={routes.room} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
