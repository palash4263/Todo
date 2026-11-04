# To-Do API

REST API for the To-Do List app. Node 20+, Express 5, MongoDB (Mongoose), zod validation.

## Run locally

```bash
cd server
npm install
cp .env.example .env      # then put your MongoDB Atlas connection string in MONGODB_URI
npm run dev               # http://localhost:5000/api/health
npm test                  # unit, validation and full API tests (in-memory MongoDB)
```

The first `npm test` downloads a MongoDB binary (about 100 MB) for the in-memory database; later runs are fast.

| Variable | Example | Notes |
| --- | --- | --- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/todo` | Required. URL-encode special characters in the password |
| `PORT` | `5000` | Render sets this itself |
| `CLIENT_ORIGIN` | `http://localhost:5173,https://your-app.netlify.app` | Comma-separated, no trailing slash. `*` allows any origin |
| `NODE_ENV` | `development` / `production` | Controls log format |
| `DNS_SERVERS` | `8.8.8.8,1.1.1.1` | Optional. Set locally if startup fails with `querySrv ECONNREFUSED` |

## Endpoints

All under `/api`. Tasks are returned with an `id` field (not `_id`). Dates are ISO 8601 strings in UTC.

| Method | Path | Body / query | Success |
| --- | --- | --- | --- |
| GET | `/` (i.e. `/api`) | | 200 list of endpoints |
| GET | `/health` | | 200 `{ ok, db }` |
| GET | `/tasks` | `?q=` search title + description · `?weekStart=YYYY-MM-DD` (a Monday) · `?status=in_progress\|completed` · `?tz=Asia/Kolkata` | 200 task[] sorted by `dueAt` |
| GET | `/tasks/weeks` | `?tz=` · optional `?weekStart=` for one week | 200 `[{ weekStart, weekEnd, open, completed, total }]`, newest first (an object when `weekStart` is given) |
| GET | `/tasks/:id` | | 200 task |
| POST | `/tasks` | `title`*, `dueAt`*, `endAt`, `description`, `priority`, `status` | 201 task |
| PATCH | `/tasks/:id` | any of the create fields (`endAt: null` clears it) | 200 task |
| PATCH | `/tasks/:id/status` | `{ "status": "completed" }` or `"in_progress"` | 200 task |
| DELETE | `/tasks/:id` | | 204 |

**Task**

```json
{
  "id": "6727f1a2b3c4d5e6f7a8b9c0",
  "title": "Doing Homework",
  "description": "",
  "dueAt": "2026-11-05T12:30:00.000Z",
  "endAt": null,
  "priority": "medium",
  "status": "in_progress",
  "completedAt": null,
  "createdAt": "2026-11-04T07:00:00.000Z",
  "updatedAt": "2026-11-04T07:00:00.000Z"
}
```

Rules: `title` 1–120 chars (trimmed); `description` up to 1000; `dueAt` required; `endAt` must be after `dueAt`; `priority` is `low | medium | high` (default `medium`); unknown fields are rejected. `completedAt` is set automatically when a task is completed.

**Errors** always look like this:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "title is required",
             "fields": { "title": "title is required" } } }
```

Codes: `VALIDATION_ERROR`, `INVALID_ID`, `INVALID_JSON` (400) · `NOT_FOUND` (404) · `PAYLOAD_TOO_LARGE` (413) · `INTERNAL_ERROR` (500).

## Weeks and time zones

Weeks run Monday 00:00 to Sunday 23:59 **in the user's time zone**. The server runs in UTC, so the client must send its zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) as `tz` on week requests. Without it, a task due Monday 02:00 IST (Sunday 20:30 UTC) would count in the previous week. Unknown zones fall back to UTC. Grouping uses MongoDB's `$dateTrunc` (MongoDB 5.0+; Atlas is newer).

## Try it

```bash
API=http://localhost:5000/api
curl -X POST $API/tasks -H 'Content-Type: application/json' \
  -d '{"title":"Doing Homework","dueAt":"2026-11-05T12:30:00.000Z","priority":"high"}'
curl "$API/tasks/weeks?tz=Asia/Kolkata"
curl "$API/tasks?weekStart=2026-11-02&tz=Asia/Kolkata"
curl "$API/tasks?q=home"
curl -X PATCH $API/tasks/<id>/status -H 'Content-Type: application/json' -d '{"status":"completed"}'
curl -X DELETE $API/tasks/<id>
```

## Deploy to Render

1. MongoDB Atlas: free M0 cluster, a database user, Network Access `0.0.0.0/0`, copy the `mongodb+srv://` string and add `/todo` before the `?`.
2. Render → New → Web Service → connect the repo. Root directory `server`, build `npm install`, start `npm start`.
3. Environment: `MONGODB_URI`, `NODE_ENV=production`, `CLIENT_ORIGIN` (your Netlify URL once the client is deployed; `*` until then).
4. Health check path: `/api/health`.

The free instance sleeps when idle, so the first request after a while can take up to a minute.

## Structure

```
src/
  app.js                 Express app (middleware, routes, errors)
  server.js              Connects to MongoDB and starts listening
  config/db.js
  models/Task.js         Schema, indexes, endAt and completedAt hooks
  validators/            zod schemas for bodies and query strings
  middleware/            validate, validateId, notFound, errorHandler
  controllers/           Route handlers
  routes/tasks.routes.js
  utils/week.js          Time-zone-aware week math
tests/
  week.test.js           Week math, incl. Sunday/Monday edges and DST
  validation.test.js     Request validation (no database)
  tasks.api.test.js      Full CRUD, search and week grouping on a real MongoDB
```
