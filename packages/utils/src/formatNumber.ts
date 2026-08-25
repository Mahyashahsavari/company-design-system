export interface FormatNumberOptions {
  locale?: string;
  /** Use compact notation, for example 1.2K or 3.4M. Useful for KPI tiles. */
  compact?: boolean;
  fractionDigits?: number;
  /** Rendered when the input is not a finite number. */
  fallback?: string;
}

/**
 * Formats a number for display, with optional compact notation.
 *
 * @example
 * formatNumber(1234);                        // '1,234'
 * formatNumber(1234, { compact: true });     // '1.2K'
 * formatNumber(0.8734, { fractionDigits: 2 }); // '0.87'
 */
export function formatNumber(value: number, options: FormatNumberOptions = {}): string {
  const { locale, compact = false, fractionDigits, fallback = '—' } = options;

  if (!Number.isFinite(value)) {
    return fallback;
  }

  const digits = fractionDigits ?? (compact ? 1 : 0);

  return new Intl.NumberFormat(locale, {
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: fractionDigits === undefined ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export interface FormatPercentOptions {
  locale?: string;
  fractionDigits?: number;
  fallback?: string;
}

/**
 * Formats a 0-1 ratio as a percentage.
 *
 * @example
 * formatPercent(0.976); // '98%'
 */
export function formatPercent(ratio: number, options: FormatPercentOptions = {}): string {
  const { locale, fractionDigits = 0, fallback = '—' } = options;

  if (!Number.isFinite(ratio)) {
    return fallback;
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
}
