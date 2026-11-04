# To-Do List App

A mobile-first to-do app for planning tasks by week. You can create, edit, delete and search tasks, schedule them for a date and time, and see how many tasks are open and completed in each Monday–Sunday week.

Built with the MERN stack for the SDE-1 assignment, following the provided Figma design.

| | |
| --- | --- |
| **Live app** | https://todo-deployed.netlify.app |
| **API** | https://todo-hglt.onrender.com/api (health check: [`/api/health`](https://todo-hglt.onrender.com/api/health)) |

> The API runs on Render's free tier, which sleeps when idle. The first request after a while can take up to a minute.

## Features

| Requirement | Where it lives in the app |
| --- | --- |
| Create a task: title and date/time required; description and priority (Low/Medium/High) optional | **+** button → Add New Task sheet |
| Edit any task field | Tap a task, or its edit icon |
| Delete a task | Swipe left and tap **Delete**, or use the bin icon. Every delete can be undone from the toast |
| Search by keyword in title and description | Search bar → results update as you type, and each result can be opened, edited or deleted |
| Tasks grouped by week, Monday to Sunday | Day strip on Home (with previous/next week), plus **All Weeks** |
| Week cards with open and completed counts that expand to show the week's tasks | **All Weeks** section on Home |
| Mark a task Completed or In Progress, and the week's counts update | Checkbox on every task row |

The Home screen also shows the selected week's Task Complete / Task Pending totals and a Weekly Progress bar, as in the Figma. The layout is designed for phones first; on wider screens it becomes two columns, and the task sheet becomes a centred dialog.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, TanStack Query, React Router, date-fns
- **Backend:** Node.js 20+, Express 5, MongoDB with Mongoose, zod validation
- **Tests:** Jest and Supertest against an in-memory MongoDB
- **Hosting:** Netlify (client), Render (API), MongoDB Atlas (database)

## Run locally

You need Node.js 20 or newer and a MongoDB connection string (a free MongoDB Atlas cluster works).

```bash
# 1. API: http://localhost:5000
cd server
npm install
cp .env.example .env      # put your MongoDB connection string in MONGODB_URI
npm run dev

# 2. Client: http://localhost:5173 (in a second terminal)
cd client
npm install
npm run dev
```

The client calls `http://localhost:5000/api` by default. To use another API, set `VITE_API_URL` in `client/.env` (see `client/.env.example`).

Run the backend tests with `cd server && npm test`. The first run downloads a MongoDB binary of about 100 MB.

## Project structure

```
server/          Express API. Endpoints, validation rules and error format are in server/README.md
  src/           app, routes, controllers, model, validators, middleware, week utilities
  tests/         week math, request validation, and full API tests
client/          React app. Screens and structure are in client/README.md
  src/pages/     Onboarding, Home, Search
  src/components/  task row, task sheet, week strip, stats, week cards
  src/hooks/     data fetching and updates (TanStack Query)
netlify.toml     Netlify build settings for the client
```

## Design decisions

- **Weeks follow the user's time zone.** The server runs in UTC, but a task due at 2 AM on a Monday in India is still Sunday in UTC. The client sends its time zone with every week request, so the server groups tasks by the user's local Monday. This includes weeks where daylight saving time changes.
- **Changes appear immediately.** Ticking or deleting a task updates the screen before the server responds. If the server rejects the change, the screen goes back to how it was and shows the error. Every change also refreshes the week counts.
- **Input is checked twice.** The form checks fields as you fill it in, and the API checks every request again with zod. Errors come back in one consistent format with a message for each field, which the form shows next to the field it belongs to.
- **The search is safe to type anything into.** Characters such as `(`, `.` or `*` are matched literally, so they can't break the search query or slow it down.

## Testing

- **Backend:** 30 automated tests cover create, edit and delete; search; week grouping, including the edges between Sunday and Monday and time-zone cases; status changes; and request validation.
- **Frontend:** tested by hand in the browser against the live API: create (including validation), edit, complete, swipe to delete, undo, search and week navigation, at phone and desktop widths.

## Known limitations

- **End times are on the same day as the start.** The form can't create a task that runs past midnight.
- **No sign-in.** Everyone using the app sees the same task list. The assignment doesn't require accounts.
- **No automated frontend tests.** Only the backend has a test suite.
