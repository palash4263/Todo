import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SearchBox from '../components/SearchBox';
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
    <main className="mx-auto min-h-dvh max-w-md bg-white px-6 pt-[31px] pb-16 [--row-bg:#fff] lg:max-w-2xl">
      <button type="button" onClick={back} aria-label="Back" className="relative block text-black before:absolute before:-inset-2 before:content-['']">
        <ArrowLeft size={24} strokeWidth={2} />
      </button>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-[29px]">
        <SearchBox as="label" className="cursor-text transition-colors focus-within:border-brand">
          <input
            type="search"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by title or description"
            aria-label="Search tasks"
            maxLength={100}
            className="min-w-0 flex-1 bg-transparent text-xs text-hint outline-none placeholder:text-hint [&::-webkit-search-cancel-button]:hidden"
          />
        </SearchBox>
      </form>

      <div aria-live="polite" className="mt-[22px]">
        {!q ? (
          <p className="pt-4 text-xs text-label">Type a keyword to find tasks by title or description.</p>
        ) : isPending ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : results.length === 0 ? (
          <div className="pt-4">
            <EmptyState title={`No tasks match "${q}"`} hint="Try a different word." />
          </div>
        ) : (
          <>
            <p className="sr-only">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            <ul className={isPlaceholderData ? 'opacity-60' : ''}>
              {results.map((t) => (
                <TaskItem key={t.id} task={t} actionsFromMd />
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
