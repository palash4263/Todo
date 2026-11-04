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

## Matching the Figma

The Figma frames are exported at 2x into `design/` (390 × 844 each). Colours, sizes and spacing in the code were measured from those exports, and most elements land within 1px of the design.

To compare yourself, run `npm run dev`, open the app in a 390px-wide window and add `?overlay=` with `onboarding`, `home`, `new-task` or `search` (for example `http://localhost:5173/?overlay=home`). The export is laid over the page:

- **O** shows or hides it
- **[** and **]** change its opacity
- **D** switches to difference mode, where matching pixels turn black

The overlay only exists in development builds; it is not part of what Netlify serves.

Intentional differences from the Figma:

- The day strip shows Monday to Sunday (7 days), because the assignment defines weeks that way. The Figma shows Sunday to Sunday (8 days).
- The task form has a **Priority** field, which the assignment requires. It sits between Set Date and Description, so those two move down by 90px.
- **All Weeks** cards below the task list, also required by the assignment, use the same colours and type.
- On the Search screen, phones show title-only rows as in the Figma; delete by swiping left, or tap to open. Wider screens also show the bin and edit icons.
- Swipe the day strip to change week. **Back to this week** appears only when you're viewing another week.

## Deploy to Netlify

`netlify.toml` in the repo root already sets the base directory (`client`), build command, publish directory and the SPA redirect.

1. Netlify → Add new site → Import from Git → pick the repo.
2. Environment variable: `VITE_API_URL` = your Render API URL plus `/api`.
3. Deploy, then add the Netlify URL to the API's `CLIENT_ORIGIN` on Render.
