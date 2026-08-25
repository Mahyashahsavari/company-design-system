/**
 * Shared PostCSS setup required by Mantine.
 *
 * `postcss-preset-mantine` provides the light/dark mixins and rem/em helpers,
 * `postcss-simple-vars` exposes the breakpoints as CSS variables so media queries
 * can reference the same values as the theme.
 *
 * Every app re-exports this file from its own postcss.config.cjs so the breakpoints
 * stay defined in exactly one place.
 */
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
};
