import { useEffect, useState } from 'react';
import { CalendarDays, Clock, X } from 'lucide-react';
import PickerField from './PickerField';
import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { useToast } from '../context/toast';
import { combine, formatHm, formatLongDate, formatShortDate, fromYmd, toHm, toYmd } from '../lib/dates';

const PRIORITIES = [
  { value: 'low', label: 'Low', dot: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-400' },
  { value: 'high', label: 'High', dot: 'bg-danger' },
];

function initialForm(task, date) {
  if (!task) return { title: '', start: '', end: '', date: toYmd(date), description: '', priority: 'medium' };
  const due = new Date(task.dueAt);
  return {
    title: task.title,
    start: toHm(due),
    end: task.endAt ? toHm(new Date(task.endAt)) : '',
    date: toYmd(due),
    description: task.description ?? '',
    priority: task.priority,
  };
}

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Give your task a title';
  if (!form.date) errors.date = 'Pick a date';
  if (!form.start) errors.start = 'Pick a start time';
  if (form.start && form.end && form.end <= form.start) errors.end = 'End time must be after the start time';
  return errors;
}

// API field names -> form field names
const fieldFromApi = { title: 'title', description: 'description', dueAt: 'start', endAt: 'end', priority: 'priority' };

// Bottom sheet for creating (task = null) or viewing/editing a task.
export default function TaskSheet({ task, date, onClose }) {
  const editing = Boolean(task);
  const [form, setForm] = useState(() => initialForm(task, date));
  const [errors, setErrors] = useState({});
  const create = useCreateTask();
  const update = useUpdateTask();
  const toast = useToast();
  const saving = create.isPending || update.isPending;

  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  function submit(e) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      dueAt: combine(form.date, form.start).toISOString(),
      endAt: form.end ? combine(form.date, form.end).toISOString() : null,
      priority: form.priority,
    };
    const onError = (err) => {
      const fields = Object.fromEntries(
        Object.entries(err.fields ?? {}).map(([k, msg]) => [fieldFromApi[k] ?? 'form', msg])
      );
      setErrors(Object.keys(fields).length ? fields : { form: err.message });
    };

    const done = (message) => () => {
      toast(message);
      onClose();
    };
    if (editing) {
      update.mutate({ id: task.id, ...body }, { onSuccess: done('Changes saved'), onError });
    } else {
      create.mutate(body, { onSuccess: done(`Task added for ${formatShortDate(fromYmd(form.date))}`), onError });
    }
  }

  const fieldError = (name) =>
    errors[name] && (
      <p id={`${name}-error`} className="mt-1 text-xs text-danger">
        {errors[name]}
      </p>
    );

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center md:p-6">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 animate-fade bg-black/35" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onSubmit={submit}
        noValidate
        className="relative max-h-[92dvh] w-full max-w-md animate-sheet overflow-y-auto rounded-t-2xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 md:animate-fade md:rounded-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="sheet-title" className="text-[15px] font-medium">
            {editing ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="-mr-2 grid size-9 place-items-center rounded-full hover:bg-brand-50">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="title" className="mb-2 block text-[11px] text-ink/80">
              Task title
            </label>
            <input
              id="title"
              autoFocus={!editing}
              value={form.title}
              maxLength={120}
              onChange={(e) => set('title')(e.target.value)}
              placeholder="Doing Homework"
              aria-invalid={Boolean(errors.title) || undefined}
              aria-describedby={errors.title ? 'title-error' : undefined}
              className={`h-11 w-full rounded border px-3 text-[13px] outline-none transition-colors placeholder:text-muted focus:border-brand ${
                errors.title ? 'border-danger' : 'border-line'
              }`}
            />
            {fieldError('title')}
          </div>

          <fieldset>
            <legend className="mb-2 text-[11px] text-ink/80">Set Time</legend>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <PickerField id="start" type="time" label="Start time" value={form.start} onChange={set('start')} display={form.start && formatHm(form.start)} placeholder="Start" icon={Clock} invalid={Boolean(errors.start)} />
                {fieldError('start')}
              </div>
              <div>
                <PickerField id="end" type="time" label="End time" value={form.end} onChange={set('end')} display={form.end && formatHm(form.end)} placeholder="Ends" icon={Clock} invalid={Boolean(errors.end)} clearable />
                {fieldError('end')}
              </div>
            </div>
          </fieldset>

          <div>
            <p className="mb-2 text-[11px] text-ink/80">Set Date</p>
            <PickerField id="date" type="date" label="Date" value={form.date} onChange={set('date')} display={form.date && formatLongDate(fromYmd(form.date))} placeholder="Pick a date" icon={CalendarDays} iconSide="right" invalid={Boolean(errors.date)} />
            {fieldError('date')}
          </div>

          <fieldset>
            <legend className="mb-2 text-[11px] text-ink/80">Priority</legend>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-line text-[13px] transition-colors has-checked:border-brand has-checked:bg-brand-50 has-checked:text-brand has-focus-visible:ring-2 has-focus-visible:ring-brand/40"
                >
                  <input type="radio" name="priority" value={p.value} checked={form.priority === p.value} onChange={() => set('priority')(p.value)} className="sr-only" />
                  <span aria-hidden className={`size-2 rounded-full ${p.dot}`} />
                  {p.label}
                </label>
              ))}
            </div>
            {fieldError('priority')}
          </fieldset>

          <div>
            <p className="mb-2 text-[11px] text-ink/80">Description</p>
            <textarea
              aria-label="Description"
              value={form.description}
              maxLength={1000}
              rows={4}
              onChange={(e) => set('description')(e.target.value)}
              placeholder="Add Description"
              className="w-full resize-none rounded border border-line px-3 py-3 text-[13px] outline-none transition-colors placeholder:text-ink/80 focus:border-brand"
            />
            {fieldError('description')}
          </div>
        </div>

        {errors.form && (
          <p role="alert" className="mt-4 rounded bg-danger-50 px-3 py-2 text-xs text-danger">
            {errors.form}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 h-11 w-full rounded-[3px] bg-brand text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </div>
  );
}
