import { createMonosuiteTheme } from '../theme';

/**
 * Product theme for MonoSuite War Room (IWR).
 * Teal primary (#069494) and Nunito — does not change the shared indigo brand.
 */
export const warRoomTheme = createMonosuiteTheme({
  primaryColor: 'teal',
  fontFamily:
    '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily:
      '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});
