import { api } from './client';
import { TZ } from '../lib/dates';

export const tasksApi = {
  list: (params) => api('/tasks', { params: { tz: TZ, ...params } }),
  weeks: () => api('/tasks/weeks', { params: { tz: TZ } }),
  create: (body) => api('/tasks', { method: 'POST', body }),
  update: (id, body) => api(`/tasks/${id}`, { method: 'PATCH', body }),
  setStatus: (id, status) => api(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  remove: (id) => api(`/tasks/${id}`, { method: 'DELETE' }),
};

// The fields needed to recreate a task (used by "Undo" after a delete)
export const taskToBody = ({ title, description, dueAt, endAt, priority, status }) => ({
  title,
  description,
  dueAt,
  endAt,
  priority,
  status,
});
