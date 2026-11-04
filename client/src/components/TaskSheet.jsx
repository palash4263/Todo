import { useEffect, useState } from 'react';
import { Clock, X } from 'lucide-react';
import PickerField, { CalendarIcon } from './PickerField';
import { useCreateTask, useUpdateTask } from '../hooks/useTasks';
import { useToast } from '../context/toast';
import { combine, formatHm, formatLongDate, formatShortDate, fromYmd, toHm, toYmd } from '../lib/dates';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
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

// Figma spacing: 24px between fields, 10px from a label to its field, 40px fields.
const LABEL = 'mb-2.5 block text-xs leading-4 font-medium text-label';
const FIELD = 'mt-6';
const INPUT = 'w-full border bg-white px-[9px] text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-brand';

const clock = <Clock aria-hidden size={14} strokeWidth={1.7} className="mr-3.5 ml-[11px] shrink-0" />;

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
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 animate-fade bg-black/25" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onSubmit={submit}
        noValidate
        className="relative max-h-[92dvh] w-full max-w-md animate-sheet overflow-y-auto bg-white px-6 pt-[26px] pb-[max(2rem,env(safe-area-inset-bottom))] md:animate-fade"
      >
        <div className="flex h-6 items-center justify-between">
          <h2 id="sheet-title" className="text-lg leading-6 font-medium">
            {editing ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="relative before:absolute before:-inset-2 before:content-['']">
            <X aria-hidden size={24} strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-[33px]">
          <label htmlFor="title" className={LABEL}>
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
            className={`h-10 ${INPUT} ${errors.title ? 'border-danger' : 'border-line'}`}
          />
          {fieldError('title')}
        </div>

        <fieldset className={FIELD}>
          <legend className={LABEL}>Set Time</legend>
          <div className="grid grid-cols-2 gap-[30px]">
            <div>
              <PickerField id="start" type="time" label="Start time" value={form.start} onChange={set('start')} display={form.start && formatHm(form.start)} placeholder="Start" icon={clock} invalid={Boolean(errors.start)} className="font-medium" />
              {fieldError('start')}
            </div>
            <div>
              <PickerField id="end" type="time" label="End time" value={form.end} onChange={set('end')} display={form.end && formatHm(form.end)} placeholder="Ends" icon={clock} invalid={Boolean(errors.end)} clearable className="font-medium" />
              {fieldError('end')}
            </div>
          </div>
        </fieldset>

        <div className={FIELD}>
          <p className={LABEL}>Set Date</p>
          <PickerField
            id="date"
            type="date"
            label="Date"
            value={form.date}
            onChange={set('date')}
            display={form.date && formatLongDate(fromYmd(form.date))}
            placeholder="Pick a date"
            trailingIcon={<span className="mr-[11.5px] shrink-0"><CalendarIcon /></span>}
            invalid={Boolean(errors.date)}
            className="pl-[9px]"
          />
          {fieldError('date')}
        </div>

        {/* Not in the Figma; the assignment asks for priority. Styled like the other fields. */}
        <fieldset className={FIELD}>
          <legend className={LABEL}>Priority</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {PRIORITIES.map((p) => (
              <label
                key={p.value}
                className="flex h-10 cursor-pointer items-center justify-center border border-line text-sm font-medium text-ink transition-colors has-checked:border-brand has-checked:bg-brand-50 has-checked:text-brand has-focus-visible:outline-2 has-focus-visible:outline-brand"
              >
                <input type="radio" name="priority" value={p.value} checked={form.priority === p.value} onChange={() => set('priority')(p.value)} className="sr-only" />
                {p.label}
              </label>
            ))}
          </div>
          {fieldError('priority')}
        </fieldset>

        <div className={FIELD}>
          <label htmlFor="description" className={LABEL}>
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            maxLength={1000}
            onChange={(e) => set('description')(e.target.value)}
            placeholder="Add Description"
            className={`block h-[100px] resize-none pt-[9px] leading-5 ${INPUT} border-line`}
          />
          {fieldError('description')}
        </div>

        {errors.form && (
          <p role="alert" className="mt-4 bg-danger-50 px-3 py-2 text-xs text-pending-icon-ink">
            {errors.form}
          </p>
        )}

        <button type="submit" disabled={saving} className="mt-[26px] h-12 w-full bg-brand text-base font-medium text-white transition hover:bg-brand/90 disabled:opacity-60">
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
        </button>
      </form>
    </div>
  );
}
