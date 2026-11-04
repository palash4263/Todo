const { addDays, isValidDate, isMonday, resolveTimeZone, weekRange, weekStartOf } = require('../src/utils/week');

describe('week utils', () => {
  test('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-11-02', 6)).toBe('2026-11-08');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('isValidDate rejects malformed and impossible dates', () => {
    expect(isValidDate('2026-11-02')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-11-2')).toBe(false);
    expect(isValidDate('nope')).toBe(false);
  });

  test('isMonday', () => {
    expect(isMonday('2026-11-02')).toBe(true);
    expect(isMonday('2026-11-08')).toBe(false);
  });

  test('resolveTimeZone falls back to UTC', () => {
    expect(resolveTimeZone('Asia/Kolkata')).toBe('Asia/Kolkata');
    expect(resolveTimeZone('Mars/Olympus')).toBe('UTC');
    expect(resolveTimeZone(undefined)).toBe('UTC');
  });

  test('weekRange in IST starts Monday 00:00 IST (= Sunday 18:30 UTC)', () => {
    const { start, end } = weekRange('2026-11-02', 'Asia/Kolkata');
    expect(start.toISOString()).toBe('2026-11-01T18:30:00.000Z');
    expect(end.toISOString()).toBe('2026-11-08T18:30:00.000Z');
  });

  test('weekRange across a DST change is 169 hours (US clocks fall back on Nov 1 2026)', () => {
    const { start, end } = weekRange('2026-10-26', 'America/New_York');
    expect((end - start) / 36e5).toBe(169); // that week gains an hour
  });

  test('weekStartOf: Sunday 23:59 and Monday 00:00 IST fall in different weeks', () => {
    const sundayLate = new Date('2026-11-08T18:29:00.000Z'); // Sun 23:59 IST
    const mondayStart = new Date('2026-11-08T18:30:00.000Z'); // Mon 00:00 IST
    expect(weekStartOf(sundayLate, 'Asia/Kolkata')).toBe('2026-11-02');
    expect(weekStartOf(mondayStart, 'Asia/Kolkata')).toBe('2026-11-09');
  });

  test('the same instant can sit in different weeks per time zone', () => {
    const instant = new Date('2026-11-08T20:30:00.000Z'); // Sun 20:30 UTC, Mon 02:00 IST
    expect(weekStartOf(instant, 'UTC')).toBe('2026-11-02');
    expect(weekStartOf(instant, 'Asia/Kolkata')).toBe('2026-11-09');
  });
});
