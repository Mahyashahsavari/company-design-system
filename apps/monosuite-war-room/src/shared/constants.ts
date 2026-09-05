/**
 * UI scale tiers (applied via `#root { zoom }` — see app.css):
 * - Mobile: 100%
 * - Laptop (768–1919): 90% — keeps 1366×768 usable
 * - FHD / QHD (1920–2559): 87.5% — avoids oversized chrome at 1920×1080
 * - Ultra-wide (2560+): 100% — native pixels are already large
 */
export const APP_UI_SCALE_COMPACT = 0.9;
export const APP_UI_SCALE_FHD = 0.875;
export const APP_UI_SCALE_DEFAULT = 1;
export const APP_UI_SCALE_WIDE_MIN_WIDTH = 1920;
export const APP_UI_SCALE_ULTRA_MIN_WIDTH = 2560;
/** Matches Mantine `sm` — phone / small tablet. */
export const ROOM_MOBILE_QUERY = '(max-width: 47.99em)';
export const ROOM_MOBILE_MAX_WIDTH = 768;

export function getAppUiScale(viewportWidth: number): number {
  if (viewportWidth < ROOM_MOBILE_MAX_WIDTH) return APP_UI_SCALE_DEFAULT;
  if (viewportWidth >= APP_UI_SCALE_ULTRA_MIN_WIDTH) return APP_UI_SCALE_DEFAULT;
  if (viewportWidth >= APP_UI_SCALE_WIDE_MIN_WIDTH) return APP_UI_SCALE_FHD;
  return APP_UI_SCALE_COMPACT;
}

const UI_SCALE_VAR = '--war-room-ui-scale';

export function applyAppUiScale(root: HTMLElement | null = document.getElementById('root')) {
  if (!root) return;
  root.style.setProperty(UI_SCALE_VAR, String(getAppUiScale(window.innerWidth)));
}

export function initAppUiScale() {
  applyAppUiScale();
  const onChange = () => applyAppUiScale();
  window
    .matchMedia(`(min-width: ${APP_UI_SCALE_WIDE_MIN_WIDTH}px)`)
    .addEventListener('change', onChange);
  window
    .matchMedia(`(min-width: ${APP_UI_SCALE_ULTRA_MIN_WIDTH}px)`)
    .addEventListener('change', onChange);
  window.matchMedia(ROOM_MOBILE_QUERY).addEventListener('change', onChange);
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

/** Primary desktop — both side panels expanded; default 20% | 60% | 20% with resize. */
export const ROOM_WIDE_PANELS_MIN_WIDTH = 1280;
export const ROOM_WIDE_PANELS_QUERY = `(min-width: ${ROOM_WIDE_PANELS_MIN_WIDTH}px)`;
export const ROOM_WIDE_PANELS_COLLAPSE_QUERY = `(max-width: ${ROOM_WIDE_PANELS_MIN_WIDTH - 1}px)`;

/** Default proportional layout — 20% | 60% | 20% with resizable side panels. */
export const ROOM_SIDE_PANEL_SHARE = 0.2;
export const ROOM_SIDE_PANEL_MAX_SHARE = 0.35;
export const ROOM_CENTER_MIN_WIDTH = 480;
export const ROOM_SIDE_PANEL_MIN_WIDTH = 248;
/** Fallback before the row is measured. */
export const ROOM_SIDE_PANEL_DEFAULT_WIDTH = 320;

export function computeRoomSidePanelLayout(rowWidth: number) {
  const min = ROOM_SIDE_PANEL_MIN_WIDTH;
  if (rowWidth <= 0) {
    return { min, max: 640, default: ROOM_SIDE_PANEL_DEFAULT_WIDTH };
  }

  const rowGap = 16;
  const availableForSides = Math.max(0, rowWidth - ROOM_CENTER_MIN_WIDTH - rowGap);
  const max = Math.max(
    min,
    Math.min(Math.round(rowWidth * ROOM_SIDE_PANEL_MAX_SHARE), Math.floor(availableForSides / 2)),
  );
  const defaultWidth = Math.max(min, Math.min(Math.round(rowWidth * ROOM_SIDE_PANEL_SHARE), max));

  return { min, max, default: defaultWidth };
}

/** @deprecated use computeRoomSidePanelLayout */
export const ROOM_SIDE_PANEL_MAX_WIDTH = 640;

/** Left nav rail and Room Utility panel widths — Attack chain defaults to the expanded utility width. */
export const ROOM_NAV_RAIL_WIDTH = 52;
export const ROOM_UTILITY_COMPACT_MAX = '87.99em';
export const ROOM_UTILITY_WIDTH = ROOM_SIDE_PANEL_DEFAULT_WIDTH;
export const ROOM_UTILITY_WIDTH_COMPACT = 300;
export const ROOM_UTILITY_SPLIT_WIDTH = 280;
export const ROOM_UTILITY_SPLIT_WIDTH_COMPACT = 260;
/** 1920×1080 and similar — collapse secondary chrome at the primary desktop target. */
export const ROOM_DENSE_MAX_WIDTH = '1920px';
export const ROOM_DENSE_MAX_HEIGHT = '980px';
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
  id: 'harriette',
  name: 'Harriette Spoonlicker',
  initials: 'HS',
  /**
   * Assignable room role — commander is tracked separately via commanderParticipantId.
   * Demo rooms set the local user as Commander so presentation walks stay self-serve.
   */
  roomRole: 'Responder' as const,
  /** Mock RBAC — enables participant management controls in the room. */
  canManageParticipants: true,
  /** Mock RBAC — enables editing room settings (title, description, tags). */
  canEditRoomSettings: true,
};

/** Own posts in investigation threads and room chat (chat uses “You”). */
export function isOwnContribution(author: string) {
  return author === CURRENT_USER.name || author === 'You';
}
