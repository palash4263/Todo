import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSameDay, isToday } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import WeekStrip from '../components/WeekStrip';
import WeekStats from '../components/WeekStats';
import WeekCards from '../components/WeekCards';
import TaskItem from '../components/TaskItem';
import { EmptyState, ErrorState, ListSkeleton } from '../components/States';
import { useWeekTasks } from '../hooks/useTasks';
import { useSheet } from '../context/sheet';
import { formatShortDate, today, toYmd, weekStartOf } from '../lib/dates';

export default function Home() {
  const [selected, setSelected] = useState(today);
  const [showWeek, setShowWeek] = useState(false);
  const { openCreate } = useSheet();

  const weekStart = toYmd(weekStartOf(selected));
  const isCurrentWeek = weekStart === toYmd(weekStartOf(today()));
  const { data: tasks = [], isPending, isError, error, refetch, isPlaceholderData } = useWeekTasks(weekStart);

  const busyDays = useMemo(() => new Set(tasks.map((t) => toYmd(new Date(t.dueAt)))), [tasks]);
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const visible = showWeek ? tasks : tasks.filter((t) => isSameDay(new Date(t.dueAt), selected));

  const listTitle = showWeek ? (isCurrentWeek ? 'Tasks This Week' : 'Tasks That Week') : isToday(selected) ? 'Tasks Today' : `Tasks on ${formatShortDate(selected)}`;

  return (
    <div className="mx-auto max-w-md px-4 pt-5 pb-32 sm:px-5 lg:grid lg:max-w-5xl lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-10">
      <main className="min-w-0">
        <Link
          to="/search"
          className="mb-6 flex h-11 items-center justify-between rounded-[3px] border border-line px-3.5 text-[11px] text-ink/70 transition-colors hover:border-brand/50"
        >
          Search for a task
          <Search aria-hidden className="size-4 text-ink" />
        </Link>

        <WeekStrip selected={selected} onSelect={setSelected} busyDays={busyDays} />

        <div className="mt-6">
          <WeekStats completed={completed} pending={tasks.length - completed} loading={isPending || isPlaceholderData} caption={isCurrentWeek ? 'This Week' : 'That Week'} />
        </div>

        <section className="mt-7" aria-labelledby="list-title">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="list-title" className="text-[15px] font-medium">
              {listTitle}
            </h2>
            <button type="button" onClick={() => setShowWeek((s) => !s)} className="rounded px-1 py-1 text-[11px] font-medium text-brand hover:underline">
              {showWeek ? 'Show Day' : 'View All'}
            </button>
          </div>

          {isPending ? (
            <ListSkeleton />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : visible.length === 0 ? (
            <div className="mt-2">
              <EmptyState title={showWeek ? 'Nothing planned this week' : 'Nothing planned for this day'} hint="Tap + to add a task." />
            </div>
          ) : (
            <ul className={isPlaceholderData ? 'opacity-60' : ''}>
              {visible.map((t) => (
                <TaskItem key={t.id} task={t} showDate={showWeek} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <aside className="mt-10 min-w-0 lg:mt-0">
        <WeekCards />
      </aside>

      <button
        type="button"
        onClick={() => openCreate(selected)}
        aria-label="Add task"
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition hover:bg-brand/90 active:scale-95 lg:right-10 lg:left-auto lg:translate-x-0"
      >
        <Plus className="size-6" strokeWidth={1.75} />
      </button>
    </div>
  );
}
