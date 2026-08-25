const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;
const BASE = 1024;

export interface FormatBytesOptions {
  /**
   * Fraction digits to render. Defaults to 0 for plain bytes and 1 for every
   * larger unit, which keeps table columns narrow but still precise.
   */
  fractionDigits?: number;
  locale?: string;
  /** Rendered when the input is not a usable byte count. */
  fallback?: string;
}

/**
 * Formats a byte count into a human readable size.
 *
 * @example
 * formatBytes(0);          // '0 B'
 * formatBytes(2048);       // '2.0 KB'
 * formatBytes(1_572_864);  // '1.5 MB'
 */
export function formatBytes(bytes: number, options: FormatBytesOptions = {}): string {
  const { fractionDigits, locale, fallback = '—' } = options;

  if (!Number.isFinite(bytes) || bytes < 0) {
    return fallback;
  }

  if (bytes === 0) {
    return '0 B';
  }

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(BASE)), UNITS.length - 1);
  const value = bytes / BASE ** exponent;
  const digits = fractionDigits ?? (exponent === 0 ? 0 : 1);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

  return `${formatted} ${UNITS[exponent]}`;
}
