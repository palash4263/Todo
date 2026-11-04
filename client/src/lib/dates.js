import { addDays, format, isSameDay, isSameMonth, isSameYear, parseISO, startOfDay, startOfWeek } from 'date-fns';

// Sent with every week request so the server groups weeks by the user's local Monday.
export const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const today = () => startOfDay(new Date());
export const weekStartOf = (date) => startOfWeek(date, { weekStartsOn: 1 });
export const weekDays = (weekStart) => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

export const toYmd = (date) => format(date, 'yyyy-MM-dd');
export const fromYmd = (ymd) => parseISO(ymd); // local midnight
export const toHm = (date) => format(date, 'HH:mm');

// '2026-11-05' + '14:30' -> Date at that local time
export const combine = (ymd, hm) => new Date(`${ymd}T${hm}`);

export const formatTime = (date) => format(date, 'h:mm a');
export const formatHm = (hm) => formatTime(combine('2000-01-01', hm));

// "Friday 14, January", as in the Figma
export function formatLongDate(date) {
  return format(date, isSameYear(date, new Date()) ? 'EEEE d, MMMM' : 'EEEE d, MMMM yyyy');
}

export function formatShortDate(date) {
  return format(date, isSameYear(date, new Date()) ? 'EEE, d MMM' : 'EEE, d MMM yyyy');
}

// "2 – 8 Nov 2026", "30 Nov – 6 Dec 2026", "29 Dec 2026 – 4 Jan 2027"
export function formatWeekRange(weekStartYmd) {
  const start = fromYmd(weekStartYmd);
  const end = addDays(start, 6);
  if (isSameMonth(start, end)) return `${format(start, 'd')} – ${format(end, 'd MMM yyyy')}`;
  if (isSameYear(start, end)) return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
  return `${format(start, 'd MMM yyyy')} – ${format(end, 'd MMM yyyy')}`;
}

// "10:00 AM – 11:30 AM", optionally prefixed with the date
export function formatTaskWhen(task, { withDate = false } = {}) {
  const due = new Date(task.dueAt);
  let when = formatTime(due);
  if (task.endAt) {
    const end = new Date(task.endAt);
    when += ` – ${isSameDay(due, end) ? formatTime(end) : `${formatShortDate(end)} ${formatTime(end)}`}`;
  }
  return withDate ? `${formatShortDate(due)} · ${when}` : when;
}
