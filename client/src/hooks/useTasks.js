import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskToBody, tasksApi } from '../api/tasks';
import { useToast } from '../context/toast';

// Every task query lives under ['tasks'], so one invalidation refreshes lists and week summaries.
const keys = {
  all: ['tasks'],
  lists: ['tasks', 'list'],
  list: (params) => ['tasks', 'list', params],
  weeks: ['tasks', 'weeks'],
};

export const useWeekTasks = (weekStart, { enabled = true } = {}) =>
  useQuery({
    queryKey: keys.list({ weekStart }),
    queryFn: () => tasksApi.list({ weekStart }),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useSearchTasks = (q) =>
  useQuery({
    queryKey: keys.list({ q }),
    queryFn: () => tasksApi.list({ q }),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });

export const useWeekSummaries = () => useQuery({ queryKey: keys.weeks, queryFn: tasksApi.weeks });

// Apply `update` to every cached task list, returning a snapshot to roll back to.
async function patchLists(qc, update) {
  await qc.cancelQueries({ queryKey: keys.lists });
  const snapshot = qc.getQueriesData({ queryKey: keys.lists });
  qc.setQueriesData({ queryKey: keys.lists }, (old) => (old ? update(old) : old));
  return snapshot;
}

const rollback = (qc, snapshot) => snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tasksApi.create,
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => tasksApi.update(id, body),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useToggleStatus() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, status }) => tasksApi.setStatus(id, status),
    onMutate: async ({ id, status }) => ({
      snapshot: await patchLists(qc, (list) => list.map((t) => (t.id === id ? { ...t, status } : t))),
    }),
    onError: (err, _vars, ctx) => {
      rollback(qc, ctx?.snapshot);
      toast(err.message, { tone: 'error' });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const toast = useToast();
  // The row is gone by the time Undo is tapped, so this can't rely on a mounted mutation hook.
  const undo = (task) =>
    tasksApi
      .create(taskToBody(task))
      .catch((err) => toast(err.message, { tone: 'error' }))
      .finally(() => qc.invalidateQueries({ queryKey: keys.all }));
  return useMutation({
    mutationFn: (task) => tasksApi.remove(task.id),
    onMutate: async (task) => ({
      snapshot: await patchLists(qc, (list) => list.filter((t) => t.id !== task.id)),
    }),
    onError: (err, _task, ctx) => {
      rollback(qc, ctx?.snapshot);
      toast(err.message, { tone: 'error' });
    },
    onSuccess: (_res, task) => {
      toast('Task deleted', { action: { label: 'Undo', onClick: () => undo(task) } });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
