import { describe, expect, it } from 'vitest';
import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
  it('renders zero without a fractional part', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('renders plain bytes as whole numbers', () => {
    expect(formatBytes(512, { locale: 'en-US' })).toBe('512 B');
  });

  it('steps up to the largest fitting unit', () => {
    expect(formatBytes(2048, { locale: 'en-US' })).toBe('2.0 KB');
    expect(formatBytes(1_572_864, { locale: 'en-US' })).toBe('1.5 MB');
    expect(formatBytes(3_221_225_472, { locale: 'en-US' })).toBe('3.0 GB');
  });

  it('honours an explicit precision', () => {
    expect(formatBytes(1_572_864, { locale: 'en-US', fractionDigits: 2 })).toBe('1.50 MB');
  });

  it('falls back for values that are not a usable size', () => {
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Number.NaN)).toBe('—');
    expect(formatBytes(Number.POSITIVE_INFINITY, { fallback: 'unknown' })).toBe('unknown');
  });
});
