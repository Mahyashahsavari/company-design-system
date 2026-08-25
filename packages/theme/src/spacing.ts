/**
 * Spacing scale, used for padding, margins and layout gaps.
 *
 * Products reference these by name (`<Stack gap="md">`) so vertical rhythm stays
 * consistent across every Monosuite surface.
 */
export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

/**
 * Fixed layout dimensions shared by every product shell. Exposed as CSS
 * variables by the theme's variables resolver.
 */
export const layout = {
  headerHeight: 60,
  navbarWidth: 264,
  contentMaxWidth: 1440,
};
