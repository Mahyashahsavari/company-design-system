/**
 * Global UI scale for the War Room app (1 = 100%).
 * Laptop widths stay at 90% so 1366 stays usable with dense chrome.
 * 1920px and above (including 2560×1440) use 100% so type is not tiny.
 */
export const APP_UI_SCALE_COMPACT = 0.9;
export const APP_UI_SCALE_DEFAULT = 1;
export const APP_UI_SCALE_WIDE_MIN_WIDTH = 1920;

export function getAppUiScale(viewportWidth: number): number {
  return viewportWidth >= APP_UI_SCALE_WIDE_MIN_WIDTH
    ? APP_UI_SCALE_DEFAULT
    : APP_UI_SCALE_COMPACT;
}

const UI_SCALE_VAR = '--war-room-ui-scale';

export function applyAppUiScale(root: HTMLElement | null = document.getElementById('root')) {
  if (!root) return;
  root.style.setProperty(UI_SCALE_VAR, String(getAppUiScale(window.innerWidth)));
}

export function initAppUiScale() {
  applyAppUiScale();
  const media = window.matchMedia(`(min-width: ${APP_UI_SCALE_WIDE_MIN_WIDTH}px)`);
  media.addEventListener('change', () => applyAppUiScale());
}

/** App chrome heights — keep sticky panels aligned with the room page header. */
export const GLOBAL_HEADER_HEIGHT = 52;
export const ROOM_PAGE_HEADER_GUTTER = 8;
export const ROOM_PAGE_HEADER_CARD_HEIGHT = 48;
export const ROOM_PAGE_HEADER_HEIGHT =
  ROOM_PAGE_HEADER_GUTTER + ROOM_PAGE_HEADER_CARD_HEIGHT;
export const ROOM_MEDIA_DOCK_HEIGHT = 68;
export const ROOM_MEDIA_DOCK_GUTTER = 12;
/** Merged live presence + media controls float panel (collapsed). */
export const ROOM_LIVE_FLOAT_PANEL_HEIGHT = 132;
/** Bottom inset so the floating live/media panel does not cover investigation content. */
export const ROOM_MEDIA_DOCK_SAFE_ZONE = ROOM_LIVE_FLOAT_PANEL_HEIGHT + ROOM_MEDIA_DOCK_GUTTER + 12;

/** Height available to room page content below the global app header. */
export const roomMainHeight = `calc(100dvh - ${GLOBAL_HEADER_HEIGHT}px)`;

/** Left nav rail and Room Utility panel widths — Attack chain defaults to the expanded utility width. */
export const ROOM_NAV_RAIL_WIDTH = 52;
export const ROOM_UTILITY_COMPACT_MAX = '87.99em';
export const ROOM_UTILITY_WIDTH = 340;
export const ROOM_UTILITY_WIDTH_COMPACT = 300;
export const ROOM_UTILITY_SPLIT_WIDTH = 280;
export const ROOM_UTILITY_SPLIT_WIDTH_COMPACT = 260;
/** 1366-class laptops — collapse secondary chrome, keep the same 90% scale. */
export const ROOM_DENSE_MAX_WIDTH = '1400px';
export const ROOM_DENSE_MAX_HEIGHT = '820px';
export const ROOM_DENSE_WIDTH_QUERY = `(max-width: ${ROOM_DENSE_MAX_WIDTH})`;
export const ROOM_DENSE_HEIGHT_QUERY = `(max-height: ${ROOM_DENSE_MAX_HEIGHT})`;
export const ROOM_ATTACK_CHAIN_WIDTH_DENSE = 260;
export const ROOM_LIVE_FLOAT_PANEL_HEIGHT_DENSE = 80;
export const ROOM_MEDIA_DOCK_SAFE_ZONE_DENSE =
  ROOM_LIVE_FLOAT_PANEL_HEIGHT_DENSE + ROOM_MEDIA_DOCK_GUTTER + 8;

export function getRoomUtilityWidth({
  compact,
  collapsed,
  split = false,
}: {
  compact: boolean;
  collapsed: boolean;
  split?: boolean;
}) {
  if (collapsed) return ROOM_NAV_RAIL_WIDTH;
  if (split) return compact ? ROOM_UTILITY_SPLIT_WIDTH_COMPACT : ROOM_UTILITY_SPLIT_WIDTH;
  return compact ? ROOM_UTILITY_WIDTH_COMPACT : ROOM_UTILITY_WIDTH;
}

export const CURRENT_USER = {
  name: 'Harriette Spoonlicker',
  initials: 'HS',
  role: 'Commander',
  /** Mock RBAC — enables participant management controls in the room. */
  canManageParticipants: true,
};

/** Own posts in investigation threads and room chat (chat uses “You”). */
export function isOwnContribution(author: string) {
  return author === CURRENT_USER.name || author === 'You';
}
