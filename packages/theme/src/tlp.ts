/**
 * Official FIRST Traffic Light Protocol (TLP) Version 2.0 colours.
 *
 * These tokens are scheme-independent: TLP/PAP labels always use coloured
 * text on a black background. PAP reuses the same visual tokens as TLP.
 * Hex belongs here — product UI must reference the CSS variables.
 */
export const tlpColors = {
  background: '#000000',
  red: '#FF2B2B',
  amber: '#FFC000',
  green: '#33FF00',
  clear: '#FFFFFF',
} as const;

export const tlpCssVariables = {
  '--monosuite-color-tlp-bg': tlpColors.background,
  '--monosuite-color-tlp-red': tlpColors.red,
  '--monosuite-color-tlp-amber': tlpColors.amber,
  '--monosuite-color-tlp-green': tlpColors.green,
  '--monosuite-color-tlp-clear': tlpColors.clear,
} as const;
