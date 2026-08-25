import { describe, expect, it } from 'vitest';
import { formatDate } from './formatDate';

const TIMESTAMP = '2026-03-12T14:05:00Z';
const BASE = { locale: 'en-GB', timeZone: 'UTC' } as const;

describe('formatDate', () => {
  it('defaults to the date only variant', () => {
    expect(formatDate(TIMESTAMP, BASE)).toBe('12 Mar 2026');
  });

  it('renders date and time together', () => {
    const result = formatDate(TIMESTAMP, { ...BASE, variant: 'datetime' });
    expect(result).toContain('12 Mar 2026');
    expect(result).toContain('14:05');
  });

  it('renders time only', () => {
    expect(formatDate(TIMESTAMP, { ...BASE, variant: 'time' })).toBe('14:05');
  });

  it('accepts Date and epoch inputs', () => {
    expect(formatDate(new Date(TIMESTAMP), BASE)).toBe('12 Mar 2026');
    expect(formatDate(new Date(TIMESTAMP).getTime(), BASE)).toBe('12 Mar 2026');
  });

  it('falls back for unparseable input', () => {
    expect(formatDate('not a date', BASE)).toBe('—');
  });
});
