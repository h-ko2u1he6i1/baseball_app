import { describe, it, expect } from 'vitest';
import { isValidDateString, formatIsoDate, jstYmd, jstYmdDaysAgo } from './date';

describe('isValidDateString', () => {
  it('accepts real dates', () => {
    expect(isValidDateString('2026-09-07')).toBe(true);
    expect(isValidDateString('2024-02-29')).toBe(true); // 閏年
  });

  it('rejects malformed or impossible dates', () => {
    expect(isValidDateString('2026-9-7')).toBe(false);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2025-02-29')).toBe(false); // 非閏年
    expect(isValidDateString('not-a-date')).toBe(false);
    expect(isValidDateString(20260907)).toBe(false);
    expect(isValidDateString(null)).toBe(false);
  });
});

describe('formatIsoDate', () => {
  it('reformats without timezone drift', () => {
    expect(formatIsoDate('2026-09-07')).toBe('2026/09/07');
  });
  it('passes through unexpected input', () => {
    expect(formatIsoDate('garbage')).toBe('garbage');
  });
});

describe('jstYmd / jstYmdDaysAgo', () => {
  it('returns YYYY-MM-DD', () => {
    expect(jstYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('day 0 equals today (JST)', () => {
    expect(jstYmdDaysAgo(0)).toBe(jstYmd());
  });
  it('counts back correctly across a month boundary', () => {
    // 2026-03-01 の 1 日前は 2026-02-28
    const d = new Date('2026-03-01T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    expect(d.toISOString().slice(0, 10)).toBe('2026-02-28');
  });
});
