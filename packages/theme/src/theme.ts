import { createTheme, mergeThemeOverrides, type MantineThemeOverride } from '@mantine/core';
import { breakpoints } from './breakpoints';
import { colors } from './colors';
import { components } from './components';
import { defaultRadius, radius } from './radius';
import { semanticColors } from './semantic';
import { shadows } from './shadows';
import { layout, spacing } from './spacing';
import {
  fontFamily,
  fontFamilyMonospace,
  fontSizes,
  fontWeights,
  headings,
  lineHeights,
} from './typography';

/**
 * The shared Monosuite theme. This is the single source of truth for the
 * company visual language and the only theme products need today.
 */
export const monosuiteTheme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  colors,

  autoContrast: true,
  luminanceThreshold: 0.3,

  defaultRadius,
  radius,
  spacing,
  shadows,
  breakpoints,

  fontFamily,
  fontFamilyMonospace,
  fontSizes,
  lineHeights,
  headings,

  cursorType: 'pointer',
  components,

  other: {
    semanticColors,
    layout,
    fontWeights,
  },
});

/**
 * Creates a product specific theme by layering overrides on top of the shared
 * theme. Later overrides win, and anything not mentioned is inherited - so a
 * product can rebrand its primary colour or radius without restating the rest
 * of the design system.
 *
 * @example
 * ```ts
 * // packages/theme/src/products/war-room.ts
 * export const warRoomTheme = createMonosuiteTheme({
 *   primaryColor: 'danger',
 *   defaultRadius: 'sm',
 * });
 * ```
 */
export function createMonosuiteTheme(
  ...overrides: MantineThemeOverride[]
): MantineThemeOverride {
  return mergeThemeOverrides(monosuiteTheme, ...overrides);
}
