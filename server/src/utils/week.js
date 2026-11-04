// Week math. Weeks run Monday 00:00 → next Monday 00:00 in the user's time zone.
const { fromZonedTime, formatInTimeZone } = require('date-fns-tz');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Shift a 'YYYY-MM-DD' calendar date by n days (pure calendar math, no time zone).
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function isValidDate(dateStr) {
  if (!DATE_RE.test(dateStr)) return false;
  return addDays(dateStr, 0) === dateStr; // rejects 2026-02-30 etc.
}

function isMonday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 1;
}

// Unknown or missing zones fall back to UTC.
function resolveTimeZone(tz) {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

// UTC instants [start, end) for the week that begins on Monday `weekStart` in `tz`.
// The end is next Monday 00:00 local, so weeks with a DST change are still correct.
function weekRange(weekStart, tz) {
  return {
    start: fromZonedTime(`${weekStart}T00:00:00`, tz),
    end: fromZonedTime(`${addDays(weekStart, 7)}T00:00:00`, tz),
  };
}

// Monday ('YYYY-MM-DD') of the week containing `date`, as seen in `tz`.
function weekStartOf(date, tz) {
  const local = formatInTimeZone(date, tz, 'yyyy-MM-dd');
  const isoDay = Number(formatInTimeZone(date, tz, 'i')); // 1 = Monday … 7 = Sunday
  return addDays(local, 1 - isoDay);
}

module.exports = { addDays, isValidDate, isMonday, resolveTimeZone, weekRange, weekStartOf };
