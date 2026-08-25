/**
 * @monosuite/theme - the centralized visual language of the Monosuite Design System.
 *
 * Nothing in this package renders anything. It owns design tokens and the
 * Mantine theme built from them, so products and Storybook share one definition
 * of what Monosuite looks like.
 */

export { monosuiteTheme, createMonosuiteTheme } from './theme';
export { monosuiteCssVariablesResolver, semanticColors } from './semantic';
export type { MonosuiteSemanticColors } from './semantic';

export { colors, brand, accent, success, warning, danger, neutral, teal } from './colors';
export type { MonosuiteColorName } from './colors';

export { warRoomTheme } from './products/war-room';

export { breakpoints } from './breakpoints';
export { radius, defaultRadius } from './radius';
export { shadows } from './shadows';
export { spacing, layout } from './spacing';
export {
  fontFamily,
  fontFamilyMonospace,
  fontSizes,
  fontWeights,
  headings,
  lineHeights,
} from './typography';
