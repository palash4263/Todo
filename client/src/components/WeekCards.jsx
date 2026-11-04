import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TaskItem from './TaskItem';
import { EmptyState, ErrorState, ListSkeleton } from './States';
import { useWeekSummaries, useWeekTasks } from '../hooks/useTasks';
import { formatWeekRange, today, toYmd, weekStartOf } from '../lib/dates';

// Not in the Figma (the assignment asks for expandable week cards); styled with the same tokens.
function WeekCard({ week, isCurrent }) {
  const [open, setOpen] = useState(isCurrent);
  const tasks = useWeekTasks(week.weekStart, { enabled: open });
  const pct = week.total ? Math.round((week.completed / week.total) * 100) : 0;
  const panelId = `week-${week.weekStart}`;

  return (
    <li className={`border bg-white transition-colors ${open ? 'border-brand/40' : 'border-line'}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId} className="w-full px-4 py-3.5 text-left">
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm font-medium">{formatWeekRange(week.weekStart)}</span>
          {isCurrent && <span className="bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand">This week</span>}
          <ChevronDown aria-hidden className={`size-4 text-label transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
        <div className="mt-2.5 flex items-center gap-4 text-xs">
          <span>
            <span className="font-semibold tabular-nums">{week.open}</span> open
          </span>
          <span>
            <span className="font-semibold tabular-nums">{week.completed}</span> completed
          </span>
          <span className="ml-auto text-caption tabular-nums">{pct}%</span>
        </div>
        <div aria-hidden className="mt-2 h-1.5 bg-brand-100">
          <div className="h-full bg-brand-dark" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {open && (
        <div id={panelId} className="border-t border-line px-4 [--row-bg:#fff]">
          {tasks.isPending ? (
            <ListSkeleton rows={Math.min(week.total, 3) || 1} />
          ) : tasks.isError ? (
            <div className="py-3">
              <ErrorState error={tasks.error} onRetry={tasks.refetch} />
            </div>
          ) : tasks.data.length === 0 ? (
            <p className="py-4 text-center text-xs text-label">No tasks left in this week.</p>
          ) : (
            <ul>
              {tasks.data.map((t) => (
                <TaskItem key={t.id} task={t} />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

// Every week that has tasks (newest first), each expandable to show its tasks.
export default function WeekCards() {
  const { data: weeks, isPending, isError, error, refetch } = useWeekSummaries();
  const current = toYmd(weekStartOf(today()));

  return (
    <section aria-labelledby="weeks-title">
      <h2 id="weeks-title" className="mb-4 text-lg leading-6 font-semibold">
        All Weeks
      </h2>
      {isPending ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[86px] animate-pulse bg-line/60" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : weeks.length === 0 ? (
        <EmptyState title="No tasks yet" hint="Your weeks will show up here once you add a task." />
      ) : (
        <ul className="space-y-3">
          {weeks.map((w) => (
            <WeekCard key={w.weekStart} week={w} isCurrent={w.weekStart === current} />
          ))}
        </ul>
      )}
    </section>
  );
}
