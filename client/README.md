# To-Do Client

Mobile-first UI for the To-Do List app. React 19, Vite, Tailwind CSS 4, TanStack Query, date-fns.

## Run locally

```bash
cd client
npm install
cp .env.example .env    # optional; defaults to http://localhost:5000/api
npm run dev             # http://localhost:5173
```

Start the API first (see `server/README.md`). Its `CLIENT_ORIGIN` must include `http://localhost:5173`.

| Variable | Example | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `https://your-api.onrender.com/api` | Base URL of the API, including `/api` |

## Screens

- **Onboarding** (`/welcome`): shown once, then remembered in localStorage.
- **Home** (`/`): search bar, Mon–Sun day strip with week navigation, Task Complete / Task Pending counts and Weekly Progress for the selected week, the selected day's tasks (**View All** shows the whole week), and **All Weeks**: one expandable card per week with open and completed counts.
- **Add / Edit task**: bottom sheet on phones, centred dialog on larger screens. Title, start and end time, date, priority, description.
- **Search** (`/search?q=`): searches title and description as you type.

Every task row can be completed with its checkbox, opened (tap) to view or edit, and deleted with the bin icon or by swiping left and tapping **Delete**. Deletes can be undone from the toast.

## How it fits together

- `src/api/`: fetch wrapper and task endpoints. The browser's time zone is sent with week requests so weeks start on the user's local Monday.
- `src/hooks/useTasks.js`: queries and mutations. Status changes and deletes update the screen immediately and roll back if the API rejects them; every change refreshes the week counts.
- `src/context/`: the shared task sheet and toasts.

## Deploy to Netlify

`netlify.toml` in the repo root already sets the base directory (`client`), build command, publish directory and the SPA redirect.

1. Netlify → Add new site → Import from Git → pick the repo.
2. Environment variable: `VITE_API_URL` = your Render API URL plus `/api`.
3. Deploy, then add the Netlify URL to the API's `CLIENT_ORIGIN` on Render.
