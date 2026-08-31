/** Global UI scale for the War Room app (1 = 100%). */
export const APP_UI_SCALE = 0.9;

/** App chrome heights — keep sticky panels aligned with the room page header. */
export const GLOBAL_HEADER_HEIGHT = 52;
export const ROOM_PAGE_HEADER_GUTTER = 8;
export const ROOM_PAGE_HEADER_CARD_HEIGHT = 48;
export const ROOM_PAGE_HEADER_HEIGHT =
  ROOM_PAGE_HEADER_GUTTER + ROOM_PAGE_HEADER_CARD_HEIGHT;
export const ROOM_MEDIA_DOCK_HEIGHT = 68;
export const ROOM_MEDIA_DOCK_GUTTER = 12;
/** Merged live presence + media controls float panel (collapsed). */
export const ROOM_LIVE_FLOAT_PANEL_HEIGHT = 108;
/** Bottom inset so the floating live/media panel does not cover investigation content. */
export const ROOM_MEDIA_DOCK_SAFE_ZONE = ROOM_LIVE_FLOAT_PANEL_HEIGHT + ROOM_MEDIA_DOCK_GUTTER + 12;

/** Height available to room page content below the global app header. */
export const roomMainHeight = `calc(100dvh - ${GLOBAL_HEADER_HEIGHT}px)`;

export const CURRENT_USER = {
  name: 'Harriette Spoonlicker',
  initials: 'HS',
  role: 'Commander',
  /** Mock RBAC — enables participant management controls in the room. */
  canManageParticipants: true,
};
