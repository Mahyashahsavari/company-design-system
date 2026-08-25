import { toDate, type DateInput } from './date';

interface Division {
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}

const DIVISIONS: readonly Division[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export interface FormatRelativeTimeOptions {
  locale?: string;
  /** Reference point. Defaults to now. Injectable so this stays testable. */
  now?: DateInput;
  fallback?: string;
}

/**
 * Formats a timestamp relative to now - the form an activity feed or incident
 * list wants.
 *
 * @example
 * formatRelativeTime(fiveMinutesAgo); // '5 minutes ago'
 * formatRelativeTime(inTwoDays);      // 'in 2 days'
 */
export function formatRelativeTime(
  input: DateInput,
  options: FormatRelativeTimeOptions = {},
): string {
  const { locale, now, fallback = '—' } = options;
  const date = toDate(input);
  const reference = now === undefined ? new Date() : toDate(now);

  if (!date || !reference) {
    return fallback;
  }

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  let duration = (date.getTime() - reference.getTime()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return fallback;
}
