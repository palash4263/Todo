import { CircleAlert, RotateCw } from 'lucide-react';

export function ListSkeleton({ rows = 3 }) {
  return (
    <ul aria-label="Loading" className="animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="relative flex h-16 items-center pt-0.5 after:absolute after:right-0 after:bottom-0 after:left-8 after:h-px after:bg-line">
          <span className="size-5 bg-line" />
          <span className="ml-3 h-3 flex-1 bg-line" style={{ maxWidth: `${60 - i * 10}%` }} />
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="border border-dashed border-line px-4 py-8 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 text-xs text-label">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="flex items-center gap-3 bg-danger-50 px-4 py-3 text-[13px] text-pending-icon-ink">
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
