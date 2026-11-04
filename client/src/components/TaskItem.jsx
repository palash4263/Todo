import { useRef, useState } from 'react';
import { Check, SquarePen, Trash2 } from 'lucide-react';
import { useDeleteTask, useToggleStatus } from '../hooks/useTasks';
import { useSheet } from '../context/sheet';
import { formatTaskWhen } from '../lib/dates';

const REVEAL = 88; // width of the Delete button revealed by swiping left
const PRIORITY_DOT = { low: 'bg-emerald-500', medium: 'bg-amber-400', high: 'bg-danger' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

export function Checkbox({ checked, onChange, label }) {
  return (
    <span className="relative grid size-4.5 shrink-0 place-items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer size-4.5 cursor-pointer appearance-none rounded-xs border-[1.5px] border-brand bg-white transition-colors checked:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <Check aria-hidden strokeWidth={3} className="pointer-events-none absolute size-3 text-brand opacity-0 peer-checked:opacity-100" />
    </span>
  );
}

// A task row: checkbox to complete, tap to view/edit, swipe left (or the bin icon) to delete.
export default function TaskItem({ task, showDate = false }) {
  const { openEdit } = useSheet();
  const toggle = useToggleStatus();
  const remove = useDeleteTask();
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);
  const swiped = useRef(false);
  const done = task.status === 'completed';

  function onPointerDown(e) {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, from: offset, active: false };
    swiped.current = false;
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.active) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(e.clientY - d.y) > Math.abs(dx)) {
        drag.current = null; // vertical scroll, not a swipe
        return;
      }
      d.active = true;
      setDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released; the swipe still works without capture */
      }
    }
    setOffset(Math.max(-REVEAL, Math.min(0, d.from + dx)));
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    swiped.current = true;
    setDragging(false);
    setOffset((o) => (o < -REVEAL / 2 ? -REVEAL : 0));
  }

  // A tap on the row opens the task, unless it ends a swipe or closes an open Delete button.
  function onRowClick() {
    if (swiped.current) swiped.current = false;
    else if (offset !== 0) setOffset(0);
    else openEdit(task);
  }

  const deleteTask = () => remove.mutate(task);

  return (
    <li className="relative overflow-hidden border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={deleteTask}
        tabIndex={offset ? 0 : -1}
        aria-hidden={!offset}
        className="absolute inset-y-0 right-0 bg-danger text-sm font-medium text-white"
        style={{ width: REVEAL }}
      >
        Delete
      </button>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative flex touch-pan-y select-none items-center gap-3 bg-white py-3.5 ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <Checkbox
          checked={done}
          onChange={() => toggle.mutate({ id: task.id, status: done ? 'in_progress' : 'completed' })}
          label={`Mark "${task.title}" as ${done ? 'in progress' : 'completed'}`}
        />

        <button type="button" onClick={onRowClick} className="min-w-0 flex-1 text-left outline-none focus-visible:underline">
          <span className={`block truncate text-[13px] ${done ? 'text-ink/70 line-through' : 'text-ink'}`}>{task.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
            <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
            <span className="sr-only">{PRIORITY_LABEL[task.priority]} priority,</span>
            <span className="truncate">{formatTaskWhen(task, { withDate: showDate })}</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1 text-muted">
          <button type="button" onClick={deleteTask} aria-label={`Delete "${task.title}"`} className="grid size-8 place-items-center rounded hover:bg-danger-50 hover:text-danger">
            <Trash2 className="size-4.5" strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => openEdit(task)} aria-label={`Edit "${task.title}"`} className="grid size-8 place-items-center rounded hover:bg-brand-50 hover:text-brand">
            <SquarePen className="size-4.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </li>
  );
}
