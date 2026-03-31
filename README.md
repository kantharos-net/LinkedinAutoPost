# LinkedinAutoPost

A full-stack application that uses GPT to generate LinkedIn posts and publishes them directly via the LinkedIn API. Includes a Flask backend for OAuth + AI generation and a Next.js 15 frontend for composing, scheduling, and tracking posts.

## Features

- **LinkedIn OAuth** — secure login flow with token handoff to the frontend
- **GPT-powered composer** — generates post drafts from a description and skill tags
- **One-click publishing** — posts directly to LinkedIn through the API
- **Post history & analytics** — track past posts and engagement trends
- **Job scheduler** — calendar view with upcoming post queue
- **Settings panel** — configure API URL, bearer token, timezone, and more

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Python, Flask, Flask-CORS, OpenAI SDK |
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| State | Zustand + React Query |
| Styling | Tailwind CSS |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Testing | Vitest, Playwright |

## Project Structure

```
├── src/linkedinautopost/   # Flask backend
│   ├── __init__.py         # App routes
│   ├── facade/
│   │   ├── chat_gpt.py     # OpenAI integration
│   │   └── linkedin.py     # LinkedIn API client
│   └── utils/config.py     # Dynaconf configuration
├── config/                 # Backend config files
├── frontend/               # Next.js frontend
│   ├── app/                # App Router pages
│   │   ├── page.tsx        # Dashboard
│   │   ├── composer/       # GPT post composer
│   │   ├── scheduler/      # Calendar scheduler
│   │   ├── jobs/           # Job monitor
│   │   ├── history/        # Analytics & post history
│   │   ├── settings/       # App settings
│   │   └── auth/callback/  # OAuth callback handler
│   └── src/
│       ├── components/     # UI components
│       └── lib/
│           ├── api/        # Fetch client + API spec
│           ├── stores/     # Zustand stores
│           └── schemas/    # Zod schemas
└── tests/                  # Backend tests
```

## Backend Setup

**Requirements:** Python 3.10+, [PDM](https://pdm-project.org/)

```bash
pdm install
```

Create a `config/credentials.toml` with your LinkedIn app credentials:

```toml
[credentials]
client_id = "YOUR_CLIENT_ID"
client_secret = "YOUR_CLIENT_SECRET"
redirect_uri = "http://localhost:8080/linkedin/callback"

[app]
secret_key = "your-secret-key"
frontend_url = "http://localhost:3000"
```

Add your OpenAI key to environment or config:

```bash
export OPENAI_API_KEY="sk-..."
```

Run the server:

```bash
pdm run linkedinautopost
# Starts on http://localhost:8080
```

## Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Run the dev server:

```bash
npm run dev
# Opens on http://localhost:3000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/login` | Redirect to LinkedIn OAuth |
| `GET` | `/linkedin/callback` | OAuth callback, issues token |
| `GET` | `/me` | Verify session, return user info |
| `POST` | `/makePostContent` | Generate post via GPT |
| `POST` | `/postPost` | Publish post to LinkedIn |

All protected endpoints require `Authorization: Bearer <token>`.

## Testing

```bash
# Backend
pdm run pytest

# Frontend unit tests
cd frontend && npm test

# Frontend e2e
cd frontend && npm run test:e2e   # requires dev server running
```

## License

MIT
