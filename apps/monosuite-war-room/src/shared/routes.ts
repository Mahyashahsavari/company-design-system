export const routes = {
  room: '/',
  createRoom: '/create-room',
  resources: '/resources',
  settings: '/settings',
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
