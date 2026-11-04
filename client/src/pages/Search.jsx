import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import TaskItem from '../components/TaskItem';
import { EmptyState, ErrorState, ListSkeleton } from '../components/States';
import { useSearchTasks } from '../hooks/useTasks';

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function Search() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(() => params.get('q') ?? '');
  const q = useDebounced(text.trim(), 300);
  const { data: results = [], isPending, isError, error, refetch, isPlaceholderData } = useSearchTasks(q);

  // Keep the query in the URL so Back from a task, or a refresh, keeps the results.
  useEffect(() => {
    setParams(q ? { q } : {}, { replace: true });
  }, [q, setParams]);

  // Go back if we came from inside the app, otherwise go home.
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/', { replace: true }));

  return (
    <main className="mx-auto max-w-md px-4 pt-5 pb-16 sm:px-5 lg:max-w-2xl lg:pt-10">
      <button type="button" onClick={back} aria-label="Back" className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-brand-50">
        <ArrowLeft className="size-5" strokeWidth={1.75} />
      </button>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-3 mb-5">
        <div className="flex h-11 items-center gap-2 rounded-[3px] border border-line px-3.5 transition-colors focus-within:border-brand">
          <input
            type="search"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by title or description"
            aria-label="Search tasks"
            maxLength={100}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[11px] placeholder:text-ink/60 [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button type="button" onClick={() => setText('')} aria-label="Clear search" className="grid size-6 place-items-center rounded-full text-muted hover:bg-line">
              <X className="size-3.5" />
            </button>
          )}
          <SearchIcon aria-hidden className="size-4 shrink-0" />
        </div>
      </form>

      <div aria-live="polite">
        {!q ? (
          <p className="px-1 text-[12px] text-muted">Type a keyword to find tasks by title or description.</p>
        ) : isPending ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : results.length === 0 ? (
          <EmptyState title={`No tasks match "${q}"`} hint="Try a different word." />
        ) : (
          <>
            <p className="mb-1 px-1 text-[11px] text-muted">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            <ul className={isPlaceholderData ? 'opacity-60' : ''}>
              {results.map((t) => (
                <TaskItem key={t.id} task={t} showDate />
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
