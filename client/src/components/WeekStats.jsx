import { SquareCheck, SquareX } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

function StatCard({ icon: Icon, label, value, tone, caption }) {
  const styles = {
    done: { card: 'bg-brand-50', icon: 'bg-brand/70 text-white' },
    pending: { card: 'bg-danger-50', icon: 'bg-danger/15 text-danger' },
  }[tone];
  return (
    <div className={`rounded-[3px] px-3 py-3.5 ${styles.card}`}>
      <div className="flex items-center gap-2">
        <span className={`grid size-6 place-items-center rounded-[3px] ${styles.icon}`}>
          <Icon aria-hidden className="size-4" strokeWidth={1.75} />
        </span>
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="mt-1.5 pl-8">
        <span className="text-lg font-semibold tabular-nums">{value === null ? '--' : pad(value)}</span>
        <span className="ml-1.5 text-[9px] text-muted">{caption}</span>
      </p>
    </div>
  );
}

// "Task Complete" / "Task Pending" cards and the Weekly Progress bar for the selected week.
export default function WeekStats({ completed, pending, loading, caption }) {
  const total = completed + pending;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={SquareCheck} tone="done" label="Task Complete" value={loading ? null : completed} caption={caption} />
        <StatCard icon={SquareX} tone="pending" label="Task Pending" value={loading ? null : pending} caption={caption} />
      </div>

      <section className="mt-7" aria-labelledby="progress-title">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="progress-title" className="text-[15px] font-medium">
            Weekly Progress
          </h2>
          {!loading && total > 0 && (
            <span className="text-[11px] text-muted">
              {completed} of {total} done
            </span>
          )}
        </div>
        <div
          role="progressbar"
          aria-labelledby="progress-title"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct}% of this week's tasks completed`}
          className="h-4.5 overflow-hidden bg-brand-100"
        >
          <div className="h-full bg-brand-dark transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </section>
    </>
  );
}
