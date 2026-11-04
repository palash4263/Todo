const { Task } = require('../models/Task');
const ApiError = require('../utils/ApiError');
const { addDays, resolveTimeZone, weekRange, weekStartOf } = require('../utils/week');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findTaskOr404(id) {
  const task = await Task.findById(id);
  if (!task) throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  return task;
}

// GET /api/tasks?q=&weekStart=&status=&tz=
async function listTasks(req, res) {
  const { q, weekStart, status, tz: rawTz } = req.valid.query;
  const tz = resolveTimeZone(rawTz);
  const filter = {};

  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (weekStart) {
    const { start, end } = weekRange(weekStart, tz);
    filter.dueAt = { $gte: start, $lt: end };
  }
  if (status) filter.status = status;

  const tasks = await Task.find(filter).sort({ dueAt: 1, createdAt: 1 }).limit(500);
  res.json(tasks);
}

// GET /api/tasks/weeks?tz=&weekStart=
// Without weekStart: one summary per week that has tasks, newest first.
// With weekStart: that single week's summary (zeros if it has no tasks).
async function weekSummaries(req, res) {
  const { weekStart, tz: rawTz } = req.valid.query;
  const tz = resolveTimeZone(rawTz);
  const summarize = (start, open, completed) => ({
    weekStart: start,
    weekEnd: addDays(start, 6),
    open,
    completed,
    total: open + completed,
  });

  if (weekStart) {
    const { start, end } = weekRange(weekStart, tz);
    const [row] = await Task.aggregate([
      { $match: { dueAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: null,
          open: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
    ]);
    return res.json(summarize(weekStart, row?.open ?? 0, row?.completed ?? 0));
  }

  const rows = await Task.aggregate([
    {
      $group: {
        _id: { $dateTrunc: { date: '$dueAt', unit: 'week', startOfWeek: 'monday', timezone: tz } },
        open: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { _id: -1 } },
  ]);
  res.json(rows.map((r) => summarize(weekStartOf(r._id, tz), r.open, r.completed)));
}

// GET /api/tasks/:id
async function getTask(req, res) {
  res.json(await findTaskOr404(req.params.id));
}

// POST /api/tasks
async function createTask(req, res) {
  const task = await Task.create(req.valid.body);
  res.status(201).location(`/api/tasks/${task.id}`).json(task);
}

// PATCH /api/tasks/:id
async function updateTask(req, res) {
  const task = await findTaskOr404(req.params.id);
  task.set(req.valid.body);
  await task.save(); // runs model validation, incl. endAt > dueAt against the merged values
  res.json(task);
}

// PATCH /api/tasks/:id/status
async function updateStatus(req, res) {
  const task = await findTaskOr404(req.params.id);
  task.status = req.valid.body.status;
  await task.save();
  res.json(task);
}

// DELETE /api/tasks/:id
async function deleteTask(req, res) {
  const deleted = await Task.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  res.status(204).end();
}

module.exports = { listTasks, weekSummaries, getTask, createTask, updateTask, updateStatus, deleteTask };
