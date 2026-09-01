import { createMonosuiteTheme } from '../theme';

/**
 * Product theme for MonoSuite War Room (IWR).
 * Teal primary (#069494) and Nunito — does not change the shared indigo brand.
 */
export const warRoomTheme = createMonosuiteTheme({
  primaryColor: 'teal',
  fontFamily:
    '"Nunito", "Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  headings: {
    fontFamily:
      '"Nunito", "Vazirmatn", -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Roboto, Helvetica, Arial, sans-serif',
  },
});
