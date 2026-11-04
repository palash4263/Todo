import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isSameDay, isToday } from 'date-fns';
import SearchBox from '../components/SearchBox';
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

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const visible = showWeek ? tasks : tasks.filter((t) => isSameDay(new Date(t.dueAt), selected));

  const listTitle = showWeek ? (isCurrentWeek ? 'Tasks This Week' : 'Tasks That Week') : isToday(selected) ? 'Tasks Today' : `Tasks on ${formatShortDate(selected)}`;

  return (
    <div className="mx-auto max-w-md px-6 pt-[37px] pb-36 lg:grid lg:max-w-5xl lg:grid-cols-2 lg:gap-12 lg:px-8">
      <main className="min-w-0">
        <SearchBox as={Link} to="/search" className="mr-px ml-0.5 transition-colors hover:border-brand/50">
          Search for a task
        </SearchBox>

        <WeekStrip selected={selected} onSelect={setSelected} />

        <WeekStats completed={completed} pending={tasks.length - completed} loading={isPending || isPlaceholderData} caption={isCurrentWeek ? 'This Week' : 'That Week'} />

        <section className="mt-[31px]" aria-labelledby="list-title">
          <div className="flex items-baseline justify-between">
            <h2 id="list-title" className="text-lg leading-6 font-semibold">
              {listTitle}
            </h2>
            <button type="button" onClick={() => setShowWeek((s) => !s)} className="text-sm font-medium text-brand hover:underline">
              {showWeek ? 'Show Day' : 'View All'}
            </button>
          </div>

          <div className="mt-[7px]">
            {isPending ? (
              <ListSkeleton />
            ) : isError ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : visible.length === 0 ? (
              <div className="pt-4">
                <EmptyState title={showWeek ? 'Nothing planned this week' : 'Nothing planned for this day'} hint="Tap + to add a task." />
              </div>
            ) : (
              <ul className={isPlaceholderData ? 'opacity-60' : ''}>
                {visible.map((t) => (
                  <TaskItem key={t.id} task={t} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <aside className="mt-12 min-w-0 lg:mt-0">
        <WeekCards />
      </aside>

      {/* 76px, centred, 28px from the bottom */}
      <button
        type="button"
        onClick={() => openCreate(selected)}
        aria-label="Add task"
        className="fixed bottom-[max(28px,env(safe-area-inset-bottom))] left-1/2 z-30 grid size-[76px] -translate-x-1/2 place-items-center rounded-full bg-brand text-white transition hover:bg-brand/90 active:scale-95 lg:right-10 lg:left-auto lg:translate-x-0"
      >
        <svg aria-hidden width="21" height="21" viewBox="0 0 21 21" stroke="currentColor" strokeWidth="2">
          <path d="M10.5 0v21M0 10.5h21" />
        </svg>
      </button>
    </div>
  );
}
