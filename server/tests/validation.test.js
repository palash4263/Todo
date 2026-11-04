// Request validation and routing — these never reach the database.
const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();
const validId = '6727f1a2b3c4d5e6f7a8b9c0';

describe('validation and routing (no database)', () => {
  test('GET /api lists the endpoints', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.endpoints).toContain('GET /api/health');
  });

  test('GET /api/health responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('unknown route returns 404 in the error shape', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('create without title and dueAt returns field errors', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toEqual(
      expect.objectContaining({ title: 'title is required', dueAt: 'dueAt is required' })
    );
  });

  test('blank title is rejected', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ', dueAt: '2026-11-05T10:00:00Z' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.title).toBe('title is required');
  });

  test('bad date, priority and unknown fields are rejected', async () => {
    const bad = await request(app).post('/api/tasks').send({ title: 'A', dueAt: 'tomorrow' });
    expect(bad.body.error.fields.dueAt).toMatch(/ISO 8601/);

    const prio = await request(app).post('/api/tasks').send({ title: 'A', dueAt: '2026-11-05T10:00:00Z', priority: 'urgent' });
    expect(prio.body.error.fields.priority).toMatch(/low, medium, high/);

    const extra = await request(app).post('/api/tasks').send({ title: 'A', dueAt: '2026-11-05T10:00:00Z', foo: 1 });
    expect(extra.status).toBe(400);
    expect(extra.body.error.message).toMatch(/Unknown field/);
  });

  test('malformed JSON returns INVALID_JSON', async () => {
    const res = await request(app).post('/api/tasks').set('Content-Type', 'application/json').send('{"title":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  test('invalid ObjectId returns INVALID_ID', async () => {
    for (const [method, path] of [['get', '/api/tasks/123'], ['patch', '/api/tasks/123'], ['delete', '/api/tasks/123']]) {
      const res = await request(app)[method](path).send({ title: 'x' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    }
  });

  test('empty PATCH body and bad status are rejected', async () => {
    const empty = await request(app).patch(`/api/tasks/${validId}`).send({});
    expect(empty.status).toBe(400);
    expect(empty.body.error.message).toMatch(/at least one field/);

    const status = await request(app).patch(`/api/tasks/${validId}/status`).send({ status: 'done' });
    expect(status.status).toBe(400);
  });

  test('weekStart must be a valid Monday', async () => {
    const notMonday = await request(app).get('/api/tasks?weekStart=2026-11-04');
    expect(notMonday.body.error.message).toBe('weekStart must be a Monday');
    const notDate = await request(app).get('/api/tasks/weeks?weekStart=11-02-2026');
    expect(notDate.status).toBe(400);
  });

  test('CORS header is sent', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
