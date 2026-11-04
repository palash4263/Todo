import { CircleAlert, RotateCw } from 'lucide-react';

export function ListSkeleton({ rows = 3 }) {
  return (
    <ul aria-label="Loading" className="animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 border-b border-line py-4 last:border-b-0">
          <span className="size-4.5 rounded-xs bg-line" />
          <span className="h-3 flex-1 rounded bg-line" style={{ maxWidth: `${60 - i * 10}%` }} />
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="rounded-[3px] border border-dashed border-line px-4 py-8 text-center">
      <p className="text-[13px] text-ink">{title}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-[3px] bg-danger-50 px-4 py-3 text-[13px] text-danger">
      <CircleAlert aria-hidden className="size-4 shrink-0" />
      <span className="flex-1">{error?.message ?? 'Something went wrong'}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="flex items-center gap-1 font-medium hover:underline">
          <RotateCw aria-hidden className="size-3.5" /> Retry
        </button>
      )}
    </div>
  );
}
