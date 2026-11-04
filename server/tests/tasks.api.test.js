// Full API tests against a real (in-memory) MongoDB.
// The first run downloads a MongoDB binary (~100 MB) into node_modules/.cache.
const os = require('os');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../src/app');
const { Task } = require('../src/models/Task');

let mongo;
const app = createApp();
const TZ = 'Asia/Kolkata';

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  // The driver loads `os` with a dynamic import(), which Jest's CommonJS sandbox can't run. Without it
  // the handshake metadata is empty and MongoDB 8 rejects the connection, so hand `os` over directly.
  await mongoose.connect(mongo.getUri(), { runtimeAdapters: { os } });
});
afterEach(() => Task.deleteMany({}));
afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

const create = (body) => request(app).post('/api/tasks').send(body);

describe('CRUD', () => {
  test('create with only the mandatory fields applies defaults', async () => {
    const res = await create({ title: '  Doing Homework ', dueAt: '2026-11-05T12:30:00.000Z' });
    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/tasks/${res.body.id}`);
    expect(res.body).toMatchObject({
      title: 'Doing Homework',
      description: '',
      priority: 'medium',
      status: 'in_progress',
      endAt: null,
      completedAt: null,
      dueAt: '2026-11-05T12:30:00.000Z',
    });
    expect(res.body._id).toBeUndefined();
  });

  test('get, edit every field, and delete', async () => {
    const { body: t } = await create({ title: 'A', dueAt: '2026-11-05T10:00:00Z' });

    expect((await request(app).get(`/api/tasks/${t.id}`)).body.title).toBe('A');

    const edit = await request(app).patch(`/api/tasks/${t.id}`).send({
      title: 'B',
      description: 'desc',
      dueAt: '2026-11-06T09:00:00Z',
      endAt: '2026-11-06T10:00:00Z',
      priority: 'high',
    });
    expect(edit.status).toBe(200);
    expect(edit.body).toMatchObject({ title: 'B', description: 'desc', priority: 'high', endAt: '2026-11-06T10:00:00.000Z' });

    const cleared = await request(app).patch(`/api/tasks/${t.id}`).send({ endAt: null });
    expect(cleared.body.endAt).toBeNull();

    expect((await request(app).delete(`/api/tasks/${t.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/tasks/${t.id}`)).status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${t.id}`)).status).toBe(404);
  });

  test('endAt must be after dueAt, on create and on edit', async () => {
    const bad = await create({ title: 'A', dueAt: '2026-11-05T10:00:00Z', endAt: '2026-11-05T09:00:00Z' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.fields.endAt).toBe('endAt must be after dueAt');

    const { body: t } = await create({ title: 'A', dueAt: '2026-11-05T10:00:00Z', endAt: '2026-11-05T11:00:00Z' });
    const moved = await request(app).patch(`/api/tasks/${t.id}`).send({ dueAt: '2026-11-05T12:00:00Z' });
    expect(moved.status).toBe(400);
  });

  test('status toggle sets and clears completedAt', async () => {
    const { body: t } = await create({ title: 'A', dueAt: '2026-11-05T10:00:00Z' });
    const done = await request(app).patch(`/api/tasks/${t.id}/status`).send({ status: 'completed' });
    expect(done.body.status).toBe('completed');
    expect(done.body.completedAt).not.toBeNull();

    const undone = await request(app).patch(`/api/tasks/${t.id}/status`).send({ status: 'in_progress' });
    expect(undone.body.completedAt).toBeNull();
  });
});

describe('search', () => {
  beforeEach(async () => {
    await create({ title: 'Finishing Wireframe', dueAt: '2026-11-05T10:00:00Z' });
    await create({ title: 'Meeting with team', description: 'Weekly report review', dueAt: '2026-11-04T10:00:00Z' });
    await create({ title: 'Buy a cat food (2kg)', dueAt: '2026-11-06T10:00:00Z' });
  });

  test('matches partial words in title and description, case-insensitive, sorted by dueAt', async () => {
    const res = await request(app).get('/api/tasks?q=REPO');
    expect(res.body.map((t) => t.title)).toEqual(['Meeting with team']);

    const fin = await request(app).get('/api/tasks?q=finish');
    expect(fin.body).toHaveLength(1);

    const all = await request(app).get('/api/tasks?q=a');
    expect(all.body.map((t) => t.title)).toEqual(['Meeting with team', 'Finishing Wireframe', 'Buy a cat food (2kg)']);
  });

  test('regex characters in the query are treated literally', async () => {
    expect((await request(app).get('/api/tasks?q=(2kg)')).body).toHaveLength(1);
    expect((await request(app).get(`/api/tasks?q=${encodeURIComponent('.*')}`)).body).toHaveLength(0);
  });
});

describe('weeks (Mon–Sun, Asia/Kolkata)', () => {
  beforeEach(async () => {
    // Week of Mon 2 Nov 2026
    await create({ title: 'Mon 00:00 IST', dueAt: '2026-11-01T18:30:00Z' });
    await create({ title: 'Wed', dueAt: '2026-11-04T06:00:00Z', status: 'completed' });
    await create({ title: 'Sun 23:59 IST', dueAt: '2026-11-08T18:29:00Z' });
    // Week of Mon 9 Nov 2026: Mon 02:00 IST, which is still Sunday in UTC
    await create({ title: 'Mon 02:00 IST', dueAt: '2026-11-08T20:30:00Z' });
    // Week of Mon 26 Oct 2026: Sun 23:30 IST
    await create({ title: 'Prev Sun', dueAt: '2026-11-01T18:00:00Z', status: 'completed' });
  });

  test('summaries group by local week, newest first', async () => {
    const res = await request(app).get(`/api/tasks/weeks?tz=${TZ}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { weekStart: '2026-11-09', weekEnd: '2026-11-15', open: 1, completed: 0, total: 1 },
      { weekStart: '2026-11-02', weekEnd: '2026-11-08', open: 2, completed: 1, total: 3 },
      { weekStart: '2026-10-26', weekEnd: '2026-11-01', open: 0, completed: 1, total: 1 },
    ]);
  });

  test('UTC grouping would differ, which is why tz matters', async () => {
    const res = await request(app).get('/api/tasks/weeks');
    const total = (weekStart) => res.body.find((w) => w.weekStart === weekStart)?.total;
    // In UTC, Mon 00:00 IST (Sun 18:30 UTC) slips back a week and Mon 02:00 IST (Sun 20:30 UTC) joins week of 2 Nov
    expect(total('2026-11-09')).toBeUndefined();
    expect(total('2026-11-02')).toBe(3);
    expect(total('2026-10-26')).toBe(2);
  });

  test('single-week summary, including an empty week', async () => {
    const one = await request(app).get(`/api/tasks/weeks?tz=${TZ}&weekStart=2026-11-02`);
    expect(one.body).toEqual({ weekStart: '2026-11-02', weekEnd: '2026-11-08', open: 2, completed: 1, total: 3 });

    const empty = await request(app).get(`/api/tasks/weeks?tz=${TZ}&weekStart=2026-12-07`);
    expect(empty.body).toMatchObject({ open: 0, completed: 0, total: 0 });
  });

  test('tasks for one week include its edges and nothing else', async () => {
    const res = await request(app).get(`/api/tasks?tz=${TZ}&weekStart=2026-11-02`);
    expect(res.body.map((t) => t.title)).toEqual(['Mon 00:00 IST', 'Wed', 'Sun 23:59 IST']);

    const open = await request(app).get(`/api/tasks?tz=${TZ}&weekStart=2026-11-02&status=in_progress`);
    expect(open.body).toHaveLength(2);
  });

  test('completing a task moves it between counts', async () => {
    const { body: tasks } = await request(app).get(`/api/tasks?tz=${TZ}&weekStart=2026-11-09`);
    await request(app).patch(`/api/tasks/${tasks[0].id}/status`).send({ status: 'completed' });
    const res = await request(app).get(`/api/tasks/weeks?tz=${TZ}&weekStart=2026-11-09`);
    expect(res.body).toMatchObject({ open: 0, completed: 1 });
  });
});
