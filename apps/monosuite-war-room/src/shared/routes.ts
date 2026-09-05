export const routes = {
  rooms: '/rooms',
  /** @deprecated Use roomDetail — legacy single-room path redirects to rooms list. */
  room: '/',
  roomDetail: '/rooms/:roomId',
  createRoom: '/create-room',
  resources: '/resources',
  settings: '/settings',
} as const;

export function roomDetailPath(roomId: string): string {
  return `/rooms/${roomId}`;
}

export type AppRoute = (typeof routes)[keyof typeof routes];
