import { useRef, useState } from 'react';
import { useDeleteTask, useToggleStatus } from '../hooks/useTasks';
import { useSheet } from '../context/sheet';
import { formatTaskWhen } from '../lib/dates';

const REVEAL = 88; // width of the Delete button revealed by swiping left
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

// Lucide's trash-2 and square-pen paths, cropped to their ink so they render at Figma's 20×22 and 22×22.
function TrashIcon() {
  return (
    <svg aria-hidden width="20" height="22" viewBox="2 1 20 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden width="22" height="22" viewBox="1.5 1 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
    </svg>
  );
}

export function Checkbox({ checked, onChange, label }) {
  return (
    <span className="relative size-5 shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer size-5 cursor-pointer appearance-none border border-brand bg-white align-top focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <svg aria-hidden viewBox="0 0 20 20" className="pointer-events-none absolute inset-0 hidden text-brand peer-checked:block">
        <polyline points="5.6,10.2 8.6,13.3 14.4,6.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

// A task row: checkbox to complete, tap to view/edit, swipe left (or the bin icon) to delete.
// `actionsFromMd` hides the bin/edit icons on phones, as in the Figma search screen.
export default function TaskItem({ task, actionsFromMd = false }) {
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
    <li className="relative h-16 overflow-hidden">
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

      {/* 64px row: content centred 33px from the top, divider on the last pixel from x=32 */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative flex h-full touch-pan-y items-center bg-(--row-bg) pt-0.5 select-none after:absolute after:right-0 after:bottom-0 after:left-8 after:h-px after:bg-line ${
          dragging ? '' : 'transition-transform duration-200'
        }`}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <Checkbox
          checked={done}
          onChange={() => toggle.mutate({ id: task.id, status: done ? 'in_progress' : 'completed' })}
          label={`Mark "${task.title}" as ${done ? 'in progress' : 'completed'}`}
        />

        <button type="button" onClick={onRowClick} className="relative -top-px ml-3 min-w-0 flex-1 text-left outline-none focus-visible:underline">
          <span className={`block truncate text-sm leading-5 font-medium text-ink ${done ? 'line-through' : ''}`}>{task.title}</span>
          <span className="sr-only">
            , {formatTaskWhen(task, { withDate: true })}, {PRIORITY_LABEL[task.priority]} priority
          </span>
        </button>

        <div className={`relative -top-[3px] ml-3 shrink-0 items-center text-muted ${actionsFromMd ? 'hidden md:flex' : 'flex'}`}>
          <button type="button" onClick={deleteTask} aria-label={`Delete "${task.title}"`} className="hover:text-danger">
            <TrashIcon />
          </button>
          <button type="button" onClick={() => openEdit(task)} aria-label={`Edit "${task.title}"`} className="ml-3.5 hover:text-brand">
            <EditIcon />
          </button>
        </div>
      </div>
    </li>
  );
}
