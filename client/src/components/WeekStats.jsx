import { SquareCheck, SquareX } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

const TONES = {
  done: { card: 'bg-brand-50', icon: 'bg-done-icon text-done-icon-ink' },
  pending: { card: 'bg-danger-50', icon: 'bg-pending-icon text-pending-icon-ink' },
};

// 162×96 card: 28px icon 15px/16px in, label beside it, count on the next line aligned with the label.
function StatCard({ icon: Icon, label, value, tone, caption }) {
  const t = TONES[tone];
  return (
    <div className={`h-24 pt-4 pl-[15px] ${t.card}`}>
      <div className="flex items-center">
        <span className={`grid size-7 place-items-center ${t.icon}`}>
          <Icon aria-hidden size={24} strokeWidth={2} />
        </span>
        <span className="ml-[11px] text-xs leading-4">{label}</span>
      </div>
      <p className="mt-[5px] flex items-baseline pl-[39px]">
        <span className="text-[22px] leading-7 font-semibold tabular-nums">{value === null ? '--' : pad(value)}</span>
        <span className="ml-[4.5px] text-[10px] text-caption">{caption}</span>
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
      <div className="mt-[30px] grid grid-cols-2 gap-[17px]">
        <StatCard icon={SquareCheck} tone="done" label="Task Complete" value={loading ? null : completed} caption={caption} />
        <StatCard icon={SquareX} tone="pending" label="Task Pending" value={loading ? null : pending} caption={caption} />
      </div>

      <section className="mt-[31px]" aria-labelledby="progress-title">
        <h2 id="progress-title" className="text-lg leading-6 font-semibold text-black">
          Weekly Progress
        </h2>
        <div
          role="progressbar"
          aria-labelledby="progress-title"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${completed} of ${total} tasks completed`}
          className="relative -left-px mt-4 h-6 overflow-hidden bg-brand-100"
        >
          <div className="h-full bg-brand-dark transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </section>
    </>
  );
}
