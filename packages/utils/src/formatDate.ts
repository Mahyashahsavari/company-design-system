import { toDate, type DateInput } from './date';

export type DateVariant = 'date' | 'datetime' | 'time';

export interface FormatDateOptions {
  locale?: string;
  /** How much of the timestamp to show. Defaults to `'date'`. */
  variant?: DateVariant;
  timeZone?: string;
  /** Rendered when the input cannot be parsed. */
  fallback?: string;
}

const VARIANT_OPTIONS: Record<DateVariant, Intl.DateTimeFormatOptions> = {
  date: { day: '2-digit', month: 'short', year: 'numeric' },
  datetime: {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  },
  time: { hour: '2-digit', minute: '2-digit', hour12: false },
};

/**
 * Formats a date for display using a fixed set of design system variants, so
 * dates read the same way in every Monosuite product.
 *
 * @example
 * formatDate('2026-03-12T14:05:00Z', { locale: 'en-GB', timeZone: 'UTC' });
 * // '12 Mar 2026'
 */
export function formatDate(input: DateInput, options: FormatDateOptions = {}): string {
  const { locale, variant = 'date', timeZone, fallback = '—' } = options;
  const date = toDate(input);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    ...VARIANT_OPTIONS[variant],
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}
