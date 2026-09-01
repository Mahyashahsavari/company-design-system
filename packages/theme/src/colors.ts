import type { MantineColorsTuple } from '@mantine/core';

/**
 * The Monosuite colour palettes.
 *
 * Every palette is a 10 step scale ordered from lightest (index 0) to darkest
 * (index 9), which is the shape Mantine expects. Index 6 is the reference
 * "filled" shade in light mode and index 5 in dark mode - see `primaryShade`
 * in theme.ts.
 *
 * These are the only places in the repository where a raw hex value is allowed.
 */

/** Primary brand colour. Used for primary actions, links and focus rings. */
export const brand: MantineColorsTuple = [
  '#eef2ff',
  '#e0e7ff',
  '#c7d2fe',
  '#a5b4fc',
  '#818cf8',
  '#6366f1',
  '#4f46e5',
  '#4338ca',
  '#3730a3',
  '#312e81',
];

/** Secondary brand colour. Used for supporting actions and informational accents. */
export const accent: MantineColorsTuple = [
  '#ecfeff',
  '#cffafe',
  '#a5f3fc',
  '#67e8f9',
  '#22d3ee',
  '#06b6d4',
  '#0891b2',
  '#0e7490',
  '#155e75',
  '#164e63',
];

/** Positive state: healthy systems, completed operations, active assets. */
export const success: MantineColorsTuple = [
  '#ecfdf5',
  '#d1fae5',
  '#a7f3d0',
  '#6ee7b7',
  '#34d399',
  '#10b981',
  '#059669',
  '#047857',
  '#065f46',
  '#064e3b',
];

/** Cautionary state: degraded systems, pending review, expiring items. */
export const warning: MantineColorsTuple = [
  '#fffbeb',
  '#fef3c7',
  '#fde68a',
  '#fcd34d',
  '#fbbf24',
  '#f59e0b',
  '#d97706',
  '#b45309',
  '#92400e',
  '#78350f',
];

/** Negative state: outages, destructive actions, validation errors. */
export const danger: MantineColorsTuple = [
  '#fef2f2',
  '#fee2e2',
  '#fecaca',
  '#fca5a5',
  '#f87171',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
];

/** Neutral scale. Drives surfaces, borders and text colours. */
export const neutral: MantineColorsTuple = [
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#cbd5e1',
  '#94a3b8',
  '#64748b',
  '#475569',
  '#334155',
  '#1e293b',
  '#0f172a',
];

/**
 * War Room product primary. Reference filled shade (index 6) is #069494.
 * Used only via `warRoomTheme` — does not replace shared `brand`.
 */
export const teal: MantineColorsTuple = [
  '#e6f7f7',
  '#c5eded',
  '#9ddfdf',
  '#6fcfcf',
  '#3fbcbc',
  '#1aa5a5',
  '#069494',
  '#058080',
  '#046b6b',
  '#035555',
];

/**
 * Cool navy scale that replaces Mantine's warm `dark` palette.
 * Aligned with semantic dark surfaces so inputs, default buttons, menus and
 * dropdowns sit on the same blue-black as the rest of the product.
 *
 * 0 text-on-dark → 6 default control fill → 9 page background.
 */
export const dark: MantineColorsTuple = [
  '#e8eef8',
  '#c9d4e8',
  '#9aabc6',
  '#6d82a6',
  '#3d5273',
  '#1e2f4d',
  '#16223a',
  '#111c2e',
  '#0e1728',
  '#0b1220',
];

/**
 * Palettes registered on the theme. Consumers reference these by name, for
 * example `<Badge color="success">`, never by hex value.
 */
export const colors = {
  brand,
  accent,
  success,
  warning,
  danger,
  neutral,
  teal,
  dark,
};

export type MonosuiteColorName = keyof typeof colors;
