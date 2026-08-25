import { MantineProvider, type MantineColorScheme, type MantineThemeOverride } from '@mantine/core';
import { monosuiteCssVariablesResolver, monosuiteTheme } from '@monosuite/theme';
import type { ReactNode } from 'react';

export interface MonosuiteProviderProps {
  children?: ReactNode;
  /**
   * Theme override. Defaults to the shared `monosuiteTheme`. Pass a theme built
   * with `createMonosuiteTheme()` to give a product its own branding without
   * restating the design system.
   */
  theme?: MantineThemeOverride;
  /** Colour scheme used before the user expresses a preference. @default 'light' */
  defaultColorScheme?: MantineColorScheme;
  /** Locks the colour scheme, ignoring user preference. Useful in tests and screenshots. */
  forceColorScheme?: 'light' | 'dark';
}

/**
 * Puts a React tree inside the Monosuite visual language.
 *
 * Product UI still comes from `@mantine/core`. This provider is the only place
 * the shared theme and CSS variables are applied, so every app and Storybook
 * resolve the same tokens.
 *
 * @example
 * ```tsx
 * import '@monosuite/theme/styles.css';
 * import { Button } from '@mantine/core';
 * import { MonosuiteProvider } from '@monosuite/ui';
 *
 * createRoot(el).render(
 *   <MonosuiteProvider defaultColorScheme="auto">
 *     <Button>Add asset</Button>
 *   </MonosuiteProvider>,
 * );
 * ```
 */
export function MonosuiteProvider({
  children,
  theme = monosuiteTheme,
  defaultColorScheme = 'light',
  forceColorScheme,
}: MonosuiteProviderProps) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={monosuiteCssVariablesResolver}
      defaultColorScheme={defaultColorScheme}
      forceColorScheme={forceColorScheme}
    >
      {children}
    </MantineProvider>
  );
}
