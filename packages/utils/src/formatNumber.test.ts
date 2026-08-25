import { describe, expect, it } from 'vitest';
import { formatNumber, formatPercent } from './formatNumber';

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234, { locale: 'en-US' })).toBe('1,234');
  });

  it('supports compact notation for KPI tiles', () => {
    expect(formatNumber(1234, { locale: 'en-US', compact: true })).toBe('1.2K');
    expect(formatNumber(3_400_000, { locale: 'en-US', compact: true })).toBe('3.4M');
  });

  it('honours an explicit precision', () => {
    expect(formatNumber(0.8734, { locale: 'en-US', fractionDigits: 2 })).toBe('0.87');
  });

  it('falls back for non finite values', () => {
    expect(formatNumber(Number.NaN)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('renders a ratio as a percentage', () => {
    expect(formatPercent(0.976, { locale: 'en-US' })).toBe('98%');
    expect(formatPercent(0.976, { locale: 'en-US', fractionDigits: 1 })).toBe('97.6%');
  });

  it('falls back for non finite values', () => {
    expect(formatPercent(Number.NaN)).toBe('—');
  });
});
