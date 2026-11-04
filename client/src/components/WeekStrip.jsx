import { addWeeks, format, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { today, toYmd, weekDays, weekStartOf } from '../lib/dates';

// Mon–Sun day picker. `busyDays` is a Set of 'YYYY-MM-DD' that have tasks.
export default function WeekStrip({ selected, onSelect, busyDays }) {
  const weekStart = weekStartOf(selected);
  const days = weekDays(weekStart);
  const isCurrentWeek = isSameDay(weekStart, weekStartOf(today()));
  const label = format(days[0], 'MMM') === format(days[6], 'MMM') ? format(days[0], 'MMMM yyyy') : `${format(days[0], 'MMM')} – ${format(days[6], 'MMM yyyy')}`;

  const shift = (n) => onSelect(addWeeks(selected, n));

  return (
    <section aria-label="Choose a day">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-ink/80" aria-live="polite">
          {label}
        </p>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button type="button" onClick={() => onSelect(today())} className="mr-1 rounded px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand-50">
              Today
            </button>
          )}
          <button type="button" onClick={() => shift(-1)} aria-label="Previous week" className="grid size-7 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => shift(1)} aria-label="Next week" className="grid size-7 place-items-center rounded-full text-muted hover:bg-brand-50 hover:text-brand">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const active = isSameDay(day, selected);
          const busy = busyDays.has(toYmd(day));
          return (
            <button
              key={toYmd(day)}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={active}
              aria-label={`${format(day, 'EEEE d MMMM')}${busy ? ', has tasks' : ''}`}
              className={`flex flex-col items-center gap-1 rounded-[3px] py-2 transition-colors ${
                active ? 'bg-brand text-white' : 'hover:bg-brand-50'
              }`}
            >
              <span className={`text-[9px] ${active ? 'text-white' : 'text-muted'}`}>{format(day, 'EEE')}</span>
              <span className={`text-xs ${active ? 'font-medium' : isToday(day) ? 'font-semibold text-brand' : 'text-muted'}`}>{format(day, 'dd')}</span>
              <span aria-hidden className={`size-1 rounded-full ${active ? 'bg-white' : busy ? 'bg-brand' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
