import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './formatRelativeTime';

const NOW = '2026-03-12T12:00:00Z';
const at = (isoOffsetMs: number) => new Date(Date.parse(NOW) + isoOffsetMs);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeTime', () => {
  it('describes recent past events', () => {
    expect(formatRelativeTime(at(-5 * MINUTE), { locale: 'en-US', now: NOW })).toBe(
      '5 minutes ago',
    );
    expect(formatRelativeTime(at(-2 * HOUR), { locale: 'en-US', now: NOW })).toBe('2 hours ago');
  });

  it('describes future events', () => {
    expect(formatRelativeTime(at(3 * DAY), { locale: 'en-US', now: NOW })).toBe('in 3 days');
  });

  it('escalates to larger units as the gap grows', () => {
    expect(formatRelativeTime(at(-400 * DAY), { locale: 'en-US', now: NOW })).toBe('last year');
  });

  it('falls back for unparseable input', () => {
    expect(formatRelativeTime('not a date', { now: NOW })).toBe('—');
  });
});
