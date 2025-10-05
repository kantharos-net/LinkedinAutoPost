# LinkedinAutoPost Frontend

This repository now contains a Next.js 14 (App Router) frontend for the Flask-based LinkedIn auto-poster backend. The UI provides dashboards, a GPT-enabled composer, scheduling tools, job monitoring, analytics, and runtime settings management.

> **Heads up:** All frontend source lives inside the [`frontend/`](frontend) directory. For example, the main dashboard screen is at [`frontend/app/page.tsx`](frontend/app/page.tsx) and the API client is at [`frontend/src/lib/api/client.ts`](frontend/src/lib/api/client.ts). If you open the repo at the root, be sure to expand the `frontend` folder to browse the Next.js codebase.

## Architecture & Component Plan

- **App Shell** – `app/layout.tsx` renders the header (`Header`), responsive sidebar (`Sidebar`), and global providers (`AppProviders`, `BootstrapClient`). Tailwind + shadcn/ui components standardize styling and accessibility.
- **State & Data** – React Query handles server mutations (`apiClient`) while Zustand stores (`settings`, `posts`) persist UI preferences and local job history. Demo data is seeded on the client for richer charts.
- **Pages**
  - `app/page.tsx` (Dashboard) summarises KPIs, charts, and recent jobs.
  - `app/composer/page.tsx` drives the GPT generation form, previews, scheduling, and publishing actions.
  - `app/scheduler/page.tsx` displays a calendar heat map and upcoming post list.
  - `app/jobs/page.tsx` lists jobs, filters, and a drawer for logs with retry actions.
  - `app/history/page.tsx` surfaces analytics, trend charts, and a searchable activity log.
  - `app/settings/page.tsx` lets operators change API base URL/token, defaults, timezone, and enable SSE logs.
- **UI System** – `src/components/ui/*` hosts shadcn-inspired primitives (buttons, cards, dialogs, tables, etc.) to keep pages composable, themeable, and keyboard accessible.
- **API Layer** – `src/lib/api/client.ts` encapsulates fetch with retries, error normalization, and optional SSE helpers. `inspected-spec.json` documents the inferred Flask endpoints.
- **Testing** – Vitest validates schemas and error normalization, while Playwright specs cover the main scheduling flow and job retry UX. Optional MSW handlers (`mocks/handlers.ts`) aid local development.

## API Discovery Report

**Backend files inspected**

- `src/linkedinautopost/__init__.py` – Flask app routes (`/`, `/login`, `/linkedin/callback`, `/makePostContent`, `/postPost`).
- `src/linkedinautopost/facade/chat_gpt.py` – OpenAI usage for `/makePostContent` response shape.
- `src/linkedinautopost/facade/linkedin.py` – LinkedIn publishing logic invoked by `/postPost`.

**Endpoints derived**

| Method | Path | Request | Response |
| ------ | ---- | ------- | -------- |
| GET | `/` | – | `"Hello, World!"` plain text |
| POST | `/makePostContent` | `{ description: string, skills: string[] }` | `text/plain` GPT content |
| POST | `/postPost` | `{ text: string }` | LinkedIn API JSON passthrough |

Full machine-readable summary lives at `frontend/src/lib/api/inspected-spec.json`.

**Auth scheme** – The backend does not enforce authentication. The frontend supports configuring a Bearer token for future parity and includes it when provided.

**Error shape** – Flask returns raw text or LinkedIn/OpenAI JSON. The client normalizes these into `{ message, status, requestId?, details }`.

**Streaming** – No SSE endpoint exists. The UI exposes a toggle and `createSseStream` helper for future `/jobs/logs` SSE support with graceful fallback.

**Assumptions & gaps**

- Job history, scheduling, and analytics endpoints are absent. The UI persists this information locally via Zustand; MSW mocks can simulate backend responses.
- GPT generation returns plain text, so the frontend converts it into rich previews without token usage metadata.
- Publishing immediately calls `/postPost`; success is inferred if the response resolves without error.

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

The app reads its base URL and token from runtime configuration:

- `NEXT_PUBLIC_API_BASE_URL` (see `.env.local.example`)
- `NEXT_PUBLIC_API_TOKEN` (optional) – also editable inside **Settings**.

## Testing

```bash
cd frontend
npm run lint
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright (ensure the Next.js dev server is running)
```

## Optional Local Mocking

`frontend/mocks/handlers.ts` defines MSW handlers for `/makePostContent` and `/postPost`, enabling offline development and deterministic Playwright runs.

## Project Layout

```
frontend/
  app/                  # App Router pages
  src/
    components/         # shadcn/ui primitives & layout
    lib/
      api/              # inspected spec + fetch client
      stores/           # Zustand stores
      schemas/          # Zod schemas
      hooks/            # custom hooks
    tests/              # Vitest suites
  tests/e2e/            # Playwright specs
```

## Deployment Notes

- Tailwind CSS and shadcn/ui ensure responsive, WCAG-friendly UI components.
- React Query isolates network access with retries and unified error handling.
- Zustand + persist keeps user settings and job state in localStorage; no secrets are stored in cookies.
- Charts (Recharts) and icons (lucide-react) provide analytics visuals consistent with the dashboard aesthetic.

