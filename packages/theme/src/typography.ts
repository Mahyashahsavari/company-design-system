/**
 * Monosuite type scale.
 *
 * The font stack deliberately leads with system UI fonts so products render
 * instantly with no webfont dependency. Add a hosted brand font here when one
 * is chosen and every product picks it up.
 */

export const fontFamily =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const fontFamilyMonospace =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const fontSizes = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
};

export const lineHeights = {
  xs: '1.4',
  sm: '1.45',
  md: '1.55',
  lg: '1.6',
  xl: '1.65',
};

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const headings = {
  fontFamily,
  fontWeight: fontWeights.semibold,
  sizes: {
    h1: { fontSize: '2rem', lineHeight: '1.2', fontWeight: fontWeights.bold },
    h2: { fontSize: '1.625rem', lineHeight: '1.25', fontWeight: fontWeights.semibold },
    h3: { fontSize: '1.375rem', lineHeight: '1.3', fontWeight: fontWeights.semibold },
    h4: { fontSize: '1.125rem', lineHeight: '1.35', fontWeight: fontWeights.semibold },
    h5: { fontSize: '1rem', lineHeight: '1.4', fontWeight: fontWeights.semibold },
    h6: { fontSize: '0.875rem', lineHeight: '1.45', fontWeight: fontWeights.semibold },
  },
};
