import { useEffect, useRef } from 'react';
import { addDays, addWeeks, format, isSameDay } from 'date-fns';
import { formatWeekRange, today, toYmd, weekDays, weekStartOf } from '../lib/dates';

const SWIPE = 40; // px of horizontal drag that changes the week

// Mon–Sun day picker. Swipe left/right (or use the arrow keys) to change week.
export default function WeekStrip({ selected, onSelect }) {
  const weekStart = weekStartOf(selected);
  const days = weekDays(weekStart);
  const isCurrentWeek = isSameDay(weekStart, weekStartOf(today()));
  const drag = useRef(null);
  const swiped = useRef(false);
  const keyboard = useRef(false);
  const strip = useRef(null);

  // After keyboard navigation, keep focus on the newly selected day (it may be in a new week).
  useEffect(() => {
    if (!keyboard.current) return;
    keyboard.current = false;
    strip.current?.querySelector('[aria-pressed="true"]')?.focus();
  }, [selected]);

  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - d.y)) {
      swiped.current = true;
      onSelect(addWeeks(selected, dx < 0 ? 1 : -1));
    }
  };
  // A tap that ends a swipe shouldn't also select the day under the finger.
  const pick = (day) => {
    if (swiped.current) swiped.current = false;
    else onSelect(day);
  };
  const onKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, PageUp: -7, PageDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    keyboard.current = true;
    onSelect(addDays(selected, step));
  };

  return (
    <section aria-label="Choose a day" className="relative mt-3">
      <p className="sr-only" aria-live="polite">
        Week of {formatWeekRange(toYmd(weekStart))}
      </p>
      <div
        ref={strip}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={onKeyDown}
        className="-mx-2 flex touch-pan-y justify-between select-none"
      >
        {days.map((day) => {
          const active = isSameDay(day, selected);
          return (
            <button
              key={toYmd(day)}
              type="button"
              onClick={() => pick(day)}
              aria-pressed={active}
              aria-label={format(day, 'EEEE d MMMM')}
              tabIndex={active ? 0 : -1}
              className={`flex h-[63px] w-[39px] flex-col items-center outline-offset-2 ${active ? 'bg-brand pt-[10.5px] text-white' : 'pt-[8.5px] text-muted'}`}
            >
              <span className="text-[10px] leading-[14px]">{format(day, 'EEE')}</span>
              <span className={`text-[15px] leading-5 ${active ? 'mt-[3.25px]' : 'mt-[3.5px]'}`}>{format(day, 'dd')}</span>
              {active && <span aria-hidden className="mt-[5.25px] size-1 rounded-full bg-white" />}
            </button>
          );
        })}
      </div>

      {/* Hidden until focused: keyboard and screen-reader access to other weeks */}
      <div className="absolute -top-9 right-0 flex gap-1">
        {[
          ['Previous week', -1],
          ['Next week', 1],
        ].map(([label, n]) => (
          <button key={label} type="button" onClick={() => onSelect(addWeeks(selected, n))} className="sr-only rounded bg-white px-2 py-1 text-[11px] text-brand shadow focus:not-sr-only">
            {label}
          </button>
        ))}
      </div>

      {!isCurrentWeek && (
        <button type="button" onClick={() => onSelect(today())} className="mt-2 ml-auto block text-[11px] font-medium text-brand hover:underline">
          Back to this week
        </button>
      )}
    </section>
  );
}
