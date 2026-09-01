import type { CSSVariablesResolver } from '@mantine/core';
import { brand, dark, danger, neutral, teal } from './colors';
import { layout } from './spacing';

/**
 * Semantic colour tokens.
 *
 * Mantine has no native concept of "surface" or "border", so the design system
 * adds them here and publishes them as CSS variables through
 * `monosuiteCssVariablesResolver`. Products reference the variables
 * (`var(--monosuite-color-surface)`) instead of picking palette shades, which is
 * what makes a single theme able to serve both light and dark colour schemes.
 */
export interface MonosuiteSemanticColors {
  /** Page background, behind all surfaces. */
  background: string;
  /** Default surface for cards, panels and menus. */
  surface: string;
  /** Surface for elements that sit above another surface. */
  surfaceRaised: string;
  /** Recessed surface for table headers and inset regions. */
  surfaceSunken: string;
  /** Default border and separator colour. */
  border: string;
  /** Higher contrast border for emphasis and hover states. */
  borderStrong: string;
  /** Primary body text. */
  text: string;
  /** Secondary text: labels, metadata, descriptions. */
  textMuted: string;
  /** Lowest emphasis text: placeholders, disabled captions. */
  textSubtle: string;
}

export const semanticColors: Record<'light' | 'dark', MonosuiteSemanticColors> = {
  light: {
    background: neutral[1],
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    surfaceSunken: neutral[0],
    border: neutral[2],
    borderStrong: neutral[3],
    text: neutral[9],
    textMuted: neutral[6],
    textSubtle: neutral[5],
  },
  dark: {
    background: '#0b1220',
    surface: '#111c2e',
    surfaceRaised: '#16223a',
    surfaceSunken: '#0e1728',
    border: '#243449',
    borderStrong: '#33475f',
    text: neutral[0],
    textMuted: neutral[4],
    textSubtle: neutral[5],
  },
};

const toKebabCase = (value: string): string =>
  value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

const toColorVariables = (tokens: MonosuiteSemanticColors): Record<string, string> =>
  Object.fromEntries(
    Object.entries(tokens).map(([token, value]) => [
      `--monosuite-color-${toKebabCase(token)}`,
      value,
    ]),
  );

/**
 * Always-dark chrome tokens (scheme-independent). Used for product chrome that
 * must stay dark in both light and dark colour schemes — e.g. the War Room
 * global header. Values come from the dark semantic map so they stay aligned
 * with the system dark palette (no separate hex in apps).
 */
const chromeVariables = {
  '--monosuite-color-chrome': semanticColors.dark.surfaceRaised,
  '--monosuite-color-chrome-raised': semanticColors.dark.surface,
  '--monosuite-color-chrome-border': semanticColors.dark.border,
  '--monosuite-color-chrome-text': semanticColors.dark.text,
  '--monosuite-color-chrome-text-muted': semanticColors.dark.textMuted,
} as const;

/**
 * Mantine dark `variant="light"` uses `darken(shade 9, 0.5)`. For teal that
 * turns `#035555` into forest green, which fights the cool navy surfaces.
 * Mix the filled brand shade into the dark surface instead.
 */
const darkAccentWash = (accent: string, amount: number): string =>
  `color-mix(in srgb, ${accent} ${amount}%, ${semanticColors.dark.surface})`;

const darkPrimaryLightVars = {
  '--mantine-color-teal-light': darkAccentWash(teal[4], 20),
  '--mantine-color-teal-light-hover': darkAccentWash(teal[4], 28),
  '--mantine-color-teal-light-color': teal[3],
  '--mantine-color-brand-light': darkAccentWash(brand[4], 20),
  '--mantine-color-brand-light-hover': darkAccentWash(brand[4], 28),
  '--mantine-color-brand-light-color': brand[3],
} as const;

/**
 * Publishes the semantic tokens as CSS variables and re-points the handful of
 * Mantine variables that drive global surfaces and text, so every Mantine
 * component inherits the Monosuite palette without per-component overrides.
 */
export const monosuiteCssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--monosuite-header-height': `${layout.headerHeight}px`,
    '--monosuite-navbar-width': `${layout.navbarWidth}px`,
    '--monosuite-content-max-width': `${layout.contentMaxWidth}px`,
    ...chromeVariables,
  },
  light: {
    ...toColorVariables(semanticColors.light),
    '--mantine-color-body': semanticColors.light.surface,
    '--mantine-color-text': semanticColors.light.text,
    '--mantine-color-dimmed': semanticColors.light.textMuted,
    '--mantine-color-placeholder': semanticColors.light.textSubtle,
    '--mantine-color-default': semanticColors.light.surface,
    '--mantine-color-default-hover': semanticColors.light.surfaceSunken,
    '--mantine-color-default-color': semanticColors.light.text,
    '--mantine-color-default-border': semanticColors.light.border,
    '--mantine-color-disabled': semanticColors.light.surfaceSunken,
    '--mantine-color-disabled-color': semanticColors.light.textSubtle,
  },
  dark: {
    ...toColorVariables(semanticColors.dark),
    '--mantine-color-body': semanticColors.dark.surface,
    '--mantine-color-text': semanticColors.dark.text,
    '--mantine-color-dimmed': semanticColors.dark.textMuted,
    '--mantine-color-placeholder': semanticColors.dark.textSubtle,
    '--mantine-color-default': semanticColors.dark.surfaceRaised,
    '--mantine-color-default-hover': dark[5],
    '--mantine-color-default-color': semanticColors.dark.text,
    '--mantine-color-default-border': semanticColors.dark.border,
    '--mantine-color-disabled': semanticColors.dark.surfaceSunken,
    '--mantine-color-disabled-color': semanticColors.dark.textSubtle,
    '--mantine-color-error': danger[5],
    ...darkPrimaryLightVars,
  },
});
