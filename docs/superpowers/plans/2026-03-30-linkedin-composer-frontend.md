# LinkedIn Composer Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 15 web app where a user logs in with LinkedIn, describes an event, gets a GPT-generated post, edits it, and publishes it — plus the minimal Flask backend patches to make web OAuth work.

**Architecture:** Three Next.js routes (`/`, `/auth/callback`, `/compose`) backed by an existing Flask API. OAuth token travels from Flask to the frontend as a URL query param, is stored in Zustand localStorage, and is sent as a Bearer header on every subsequent API call. Flask extracts the token on each protected request and uses it for LinkedIn API calls.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS 3, Framer Motion 11, TanStack Query 5, Zustand 5, Zod 3, React Hook Form 7, Sonner (toasts), Lucide React (icons), Vitest (unit tests). Python backend uses PDM + flask-cors.

---

## File Map

**Backend — modified files:**
- `pyproject.toml` — add `flask-cors` dependency
- `config/settings.toml` — add `frontend_url`, `secret_key`
- `src/linkedinautopost/facade/linkedin.py` — add `get_auth_url()`, `set_token()`, `is_authenticated()`, `get_user_name()`
- `src/linkedinautopost/__init__.py` — fix `/login`, fix `/linkedin/callback`, add CORS, add `/me` endpoint, guard `/makePostContent` + `/postPost`

**Frontend — created files:**
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/next.config.ts`
- `frontend/postcss.config.js`
- `frontend/tailwind.config.ts`
- `frontend/.env.local.example`
- `frontend/vitest.config.ts`
- `frontend/app/globals.css`
- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/app/auth/callback/page.tsx`
- `frontend/app/compose/page.tsx`
- `frontend/src/lib/stores/auth.ts`
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/schemas/composer.ts`
- `frontend/src/providers/QueryProvider.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/Card.tsx`
- `frontend/src/components/ui/Textarea.tsx`
- `frontend/src/components/ui/Spinner.tsx`
- `frontend/src/components/ui/Badge.tsx`
- `frontend/src/components/layout/Nav.tsx`
- `frontend/src/components/layout/StepIndicator.tsx`
- `frontend/src/components/layout/SuccessState.tsx`
- `frontend/src/tests/auth-store.test.ts`
- `frontend/src/tests/api-client.test.ts`
- `frontend/src/tests/composer-schema.test.ts`

---

## Task 1: Patch Flask backend — add flask-cors dependency

**Files:**
- Modify: `pyproject.toml`
- Modify: `config/settings.toml`

- [ ] **Step 1: Add flask-cors via PDM**

```bash
cd /path/to/GPT-Linkedin
pdm add flask-cors
```

Expected output: `✔ Added flask-cors ...` and `pyproject.toml` updated.

- [ ] **Step 2: Add frontend_url and secret_key to settings.toml**

Open `config/settings.toml` and replace its contents with:

```toml
[credentials]
client_id = ""
client_secret = ""
redirect_uri = "http://localhost:8080/linkedin/callback"

[app]
frontend_url = "http://localhost:3000"
secret_key = "change-me-in-production"
```

- [ ] **Step 3: Commit**

```bash
git add pyproject.toml pdm.lock config/settings.toml
git commit -m "chore: add flask-cors, add frontend_url config"
```

---

## Task 2: Patch Flask backend — fix LinkedIn facade

**Files:**
- Modify: `src/linkedinautopost/facade/linkedin.py`

- [ ] **Step 1: Add new methods to the LinkedIn class**

Open `src/linkedinautopost/facade/linkedin.py`. Add these four methods **inside** the `LinkedIn` class, after `get_user_info`:

```python
def get_auth_url(self) -> str:
    """Return the LinkedIn OAuth authorization URL (does not open browser)."""
    params = {
        "response_type": "code",
        "client_id": config.credentials.get("client_id"),
        "redirect_uri": config.credentials.get("redirect_uri"),
        "scope": "w_member_social openid email profile",
    }
    response = requests.get(f"{LINKEDIN_API_URL}/authorization", params=params)
    return response.url

def set_token(self, token: str) -> None:
    """Accept an existing access token, rebuild headers, and fetch user info if not cached."""
    self.__access_token = token
    self.get_headers()
    if not self.__user_info:
        self.get_user_info()

def is_authenticated(self) -> bool:
    """Return True if an access token is present."""
    return bool(self.__access_token)

def get_user_name(self) -> str:
    """Return the authenticated user's display name, or empty string if not set."""
    return self.__user_info.get("name", "") if self.__user_info else ""
```

- [ ] **Step 2: Verify the class still imports correctly**

```bash
cd /path/to/GPT-Linkedin
python -c "from src.linkedinautopost.facade.linkedin import LinkedIn; li = LinkedIn(); print(li.is_authenticated())"
```

Expected output: `False`

- [ ] **Step 3: Commit**

```bash
git add src/linkedinautopost/facade/linkedin.py
git commit -m "feat: add get_auth_url, set_token, is_authenticated, get_user_name to LinkedIn"
```

---

## Task 3: Patch Flask backend — fix routes and add CORS

**Files:**
- Modify: `src/linkedinautopost/__init__.py`

- [ ] **Step 1: Replace the full contents of `src/linkedinautopost/__init__.py`**

```python
from flask import Flask, request, redirect
from flask_cors import CORS

from linkedinautopost.facade.chat_gpt import ChatGPT
from linkedinautopost.facade.linkedin import LinkedIn
from linkedinautopost.utils.config import config

app = Flask(__name__)
app.secret_key = config.get("app.secret_key", "dev-secret-key")

linkedin_handler = LinkedIn()
gpt_handler = ChatGPT()

FRONTEND_URL = config.get("app.frontend_url", "http://localhost:3000")

CORS(app, origins=[FRONTEND_URL], supports_credentials=False)


def _get_bearer_token() -> str | None:
    """Extract Bearer token from the Authorization header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


@app.route("/")
def hello():
    return "Hello, World!"


@app.route("/login")
def login():
    """Redirect the user's browser to the LinkedIn OAuth consent screen."""
    return redirect(linkedin_handler.get_auth_url())


@app.route("/linkedin/callback")
def linkedin_callback():
    """Handle LinkedIn OAuth callback, store token, redirect to frontend."""
    authorization_code = request.args.get("code")
    if not authorization_code:
        return redirect(f"{FRONTEND_URL}/auth/callback?error=no_code")

    linkedin_handler.get_access_token(authorization_code)
    # get_access_token already sets __access_token, __headers, and __user_info
    # We expose the token to the frontend so it can attach it to future requests.
    token = linkedin_handler._LinkedIn__access_token  # read private attr for redirect
    return redirect(f"{FRONTEND_URL}/auth/callback?token={token}")


@app.route("/me")
def me():
    """Return basic user info; used by frontend to confirm session is valid."""
    token = _get_bearer_token()
    if not token:
        return {"error": "Missing token"}, 401
    linkedin_handler.set_token(token)
    return {
        "authenticated": True,
        "name": linkedin_handler.get_user_name(),
    }


@app.route("/makePostContent", methods=["POST"])
def make_post_content():
    token = _get_bearer_token()
    if not token:
        return {"error": "Missing token"}, 401
    linkedin_handler.set_token(token)

    description = request.json["description"]
    skills = request.json["skills"]
    answer = gpt_handler.ask_question(description, skills)
    return answer


@app.route("/postPost", methods=["POST"])
def post_post():
    token = _get_bearer_token()
    if not token:
        return {"error": "Missing token"}, 401
    linkedin_handler.set_token(token)

    post_content = request.json["text"]
    response = linkedin_handler.post(post_content)
    return response
```

- [ ] **Step 2: Start Flask and verify routes load without error**

```bash
cd /path/to/GPT-Linkedin
pdm run flask --app src.linkedinautopost run --port 8080
```

Expected: `Running on http://127.0.0.1:8080` — no import errors.

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add src/linkedinautopost/__init__.py
git commit -m "feat: fix OAuth web flow, add CORS, add /me endpoint"
```

---

## Task 4: Scaffold Next.js 15 frontend project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/.env.local.example`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "linkedin-composer-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "15.2.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.62.0",
    "zustand": "^5.0.2",
    "zod": "^3.24.1",
    "react-hook-form": "^7.54.1",
    "@hookform/resolvers": "^3.9.1",
    "framer-motion": "^11.15.0",
    "sonner": "^1.7.1",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.1",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.1",
    "tailwindcss": "^3.4.16",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "vitest": "^2.1.8",
    "@vitejs/plugin-react": "^4.3.4",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `frontend/next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: Create `frontend/postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create `frontend/.env.local.example`**

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Copy it to `.env.local`:

```bash
cp frontend/.env.local.example frontend/.env.local
```

- [ ] **Step 6: Install dependencies**

```bash
cd frontend
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/tsconfig.json frontend/next.config.ts frontend/postcss.config.js frontend/.env.local.example
git commit -m "chore: scaffold Next.js 15 frontend project"
```

---

## Task 5: Tailwind config + global styles + Vitest config

**Files:**
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/app/globals.css`
- Create: `frontend/vitest.config.ts`

- [ ] **Step 1: Create `frontend/tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f0f4ff",
        surface: "#ffffff",
        primary: "#2563eb",
        "primary-hover": "#1d4ed8",
        "text-primary": "#0f172a",
        "text-secondary": "#64748b",
        border: "#dbeafe",
        "border-strong": "#bfdbfe",
        "muted": "#e2e8f0",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px rgba(37,99,235,0.06)",
        "card-hover": "0 4px 16px rgba(37,99,235,0.12)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Create `frontend/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    background-color: #f0f4ff;
    color: #0f172a;
  }

  body {
    font-family: var(--font-dm-sans), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}

@layer utilities {
  .shimmer {
    background: linear-gradient(
      90deg,
      #dbeafe 0%,
      #93c5fd 50%,
      #dbeafe 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite linear;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 3: Create `frontend/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: [],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add frontend/tailwind.config.ts frontend/app/globals.css frontend/vitest.config.ts
git commit -m "chore: add Tailwind config, global styles, Vitest config"
```

---

## Task 6: Zustand auth store + unit tests

**Files:**
- Create: `frontend/src/lib/stores/auth.ts`
- Create: `frontend/src/tests/auth-store.test.ts`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/tests/auth-store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/src/lib/stores/auth";

// Reset store between tests
beforeEach(() => {
  useAuthStore.setState({ token: null, userName: null });
});

describe("useAuthStore", () => {
  it("starts with no token", () => {
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("setToken stores token and userName", () => {
    useAuthStore.getState().setAuth("abc123", "Jane Doe");
    expect(useAuthStore.getState().token).toBe("abc123");
    expect(useAuthStore.getState().userName).toBe("Jane Doe");
  });

  it("clearAuth resets to null", () => {
    useAuthStore.getState().setAuth("abc123", "Jane Doe");
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().userName).toBeNull();
  });

  it("isAuthenticated returns true when token is present", () => {
    useAuthStore.getState().setAuth("tok", "User");
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it("isAuthenticated returns false when no token", () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd frontend
npm test -- src/tests/auth-store.test.ts
```

Expected: FAIL — `Cannot find module '@/src/lib/stores/auth'`

- [ ] **Step 3: Create `frontend/src/lib/stores/auth.ts`**

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  userName: string | null;
  setAuth: (token: string, userName: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userName: null,
      setAuth: (token, userName) => set({ token, userName }),
      clearAuth: () => set({ token: null, userName: null }),
      isAuthenticated: () => get().token !== null,
    }),
    {
      name: "auth-storage",
    }
  )
);
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd frontend
npm test -- src/tests/auth-store.test.ts
```

Expected: `5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/stores/auth.ts frontend/src/tests/auth-store.test.ts
git commit -m "feat: add Zustand auth store with persist middleware"
```

---

## Task 7: API client + unit tests

**Files:**
- Create: `frontend/src/lib/api/client.ts`
- Create: `frontend/src/tests/api-client.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/tests/api-client.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the normalizeError helper and the shape of apiClient — not actual network calls.
import { normalizeError, createApiClient } from "@/src/lib/api/client";

describe("normalizeError", () => {
  it("returns message from Error object", () => {
    expect(normalizeError(new Error("boom"))).toEqual({ message: "boom", status: 0 });
  });

  it("returns fallback for unknown type", () => {
    expect(normalizeError("oops")).toEqual({ message: "Unknown error", status: 0 });
  });

  it("preserves status from ApiError", () => {
    const err = { message: "Unauthorized", status: 401 };
    expect(normalizeError(err)).toEqual({ message: "Unauthorized", status: 401 });
  });
});

describe("createApiClient", () => {
  it("exposes generatePostContent and publishPost methods", () => {
    const client = createApiClient("http://localhost:8080", null);
    expect(typeof client.generatePostContent).toBe("function");
    expect(typeof client.publishPost).toBe("function");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd frontend
npm test -- src/tests/api-client.test.ts
```

Expected: FAIL — `Cannot find module '@/src/lib/api/client'`

- [ ] **Step 3: Create `frontend/src/lib/api/client.ts`**

```ts
export interface ApiError {
  message: string;
  status: number;
}

export function normalizeError(err: unknown): ApiError {
  if (err && typeof err === "object" && "message" in err && "status" in err) {
    return { message: String((err as ApiError).message), status: Number((err as ApiError).status) };
  }
  if (err instanceof Error) {
    return { message: err.message, status: 0 };
  }
  return { message: "Unknown error", status: 0 };
}

async function apiFetch(
  baseUrl: string,
  token: string | null,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    throw { message: text || `HTTP ${res.status}`, status: res.status } as ApiError;
  }
  return res;
}

export interface ApiClient {
  generatePostContent: (payload: { description: string; skills: string[] }) => Promise<string>;
  publishPost: (payload: { text: string }) => Promise<unknown>;
  getMe: () => Promise<{ authenticated: boolean; name: string }>;
}

export function createApiClient(baseUrl: string, token: string | null): ApiClient {
  return {
    async generatePostContent(payload) {
      const res = await apiFetch(baseUrl, token, "/makePostContent", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.text();
    },

    async publishPost(payload) {
      const res = await apiFetch(baseUrl, token, "/postPost", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return res.json();
    },

    async getMe() {
      const res = await apiFetch(baseUrl, token, "/me");
      return res.json();
    },
  };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd frontend
npm test -- src/tests/api-client.test.ts
```

Expected: `4 tests passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/api/client.ts frontend/src/tests/api-client.test.ts
git commit -m "feat: add API client with normalizeError and createApiClient"
```

---

## Task 8: Composer form schema + tests

**Files:**
- Create: `frontend/src/lib/schemas/composer.ts`
- Create: `frontend/src/tests/composer-schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/tests/composer-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { composerSchema } from "@/src/lib/schemas/composer";

describe("composerSchema", () => {
  it("accepts valid input with description only", () => {
    const result = composerSchema.safeParse({ description: "An AI workshop" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with description and tags", () => {
    const result = composerSchema.safeParse({ description: "Workshop", tags: "AI, ML" });
    expect(result.success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = composerSchema.safeParse({ description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = composerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("tags defaults to empty string when omitted", () => {
    const result = composerSchema.safeParse({ description: "Test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toBe("");
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd frontend
npm test -- src/tests/composer-schema.test.ts
```

Expected: FAIL — `Cannot find module '@/src/lib/schemas/composer'`

- [ ] **Step 3: Create `frontend/src/lib/schemas/composer.ts`**

```ts
import { z } from "zod";

export const composerSchema = z.object({
  description: z.string().min(1, "Description is required"),
  tags: z.string().default(""),
});

export type ComposerValues = z.infer<typeof composerSchema>;

export const composerDefaults: ComposerValues = {
  description: "",
  tags: "",
};

/** Parse comma-separated tags string into a skills array for the API. */
export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
cd frontend
npm test -- src/tests/composer-schema.test.ts
```

Expected: `5 tests passed`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/schemas/composer.ts frontend/src/tests/composer-schema.test.ts
git commit -m "feat: add composer Zod schema and parseTags utility"
```

---

## Task 9: UI primitive components

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/Textarea.tsx`
- Create: `frontend/src/components/ui/Spinner.tsx`
- Create: `frontend/src/components/ui/Badge.tsx`

- [ ] **Step 1: Create `frontend/src/components/ui/Button.tsx`**

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "dark";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading = false, children, className = "", disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants: Record<string, string> = {
      primary: "bg-primary text-white hover:bg-primary-hover active:scale-[0.98]",
      ghost:
        "border border-muted bg-transparent text-text-secondary hover:border-border-strong hover:text-text-primary active:scale-[0.98]",
      dark: "bg-text-primary text-white hover:bg-slate-800 active:scale-[0.98]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

- [ ] **Step 2: Create `frontend/src/components/ui/Card.tsx`**

```tsx
import { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-6 shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-primary">{children}</p>
  );
}

export function CardHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-sm text-text-secondary">{children}</p>;
}
```

- [ ] **Step 3: Create `frontend/src/components/ui/Textarea.tsx`**

```tsx
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={`w-full rounded-lg border bg-slate-50 px-3.5 py-3 text-sm text-text-primary placeholder-text-secondary/60 transition-colors duration-150 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[96px] ${
            error ? "border-red-400" : "border-muted"
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
```

- [ ] **Step 4: Create `frontend/src/components/ui/Spinner.tsx`**

```tsx
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-primary border-t-transparent"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/ui/Badge.tsx`**

```tsx
export function Badge({
  children,
  dot = false,
}: {
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/
git commit -m "feat: add Button, Card, Textarea, Spinner, Badge UI components"
```

---

## Task 10: Layout components

**Files:**
- Create: `frontend/src/components/layout/Nav.tsx`
- Create: `frontend/src/components/layout/StepIndicator.tsx`
- Create: `frontend/src/components/layout/SuccessState.tsx`

- [ ] **Step 1: Create `frontend/src/components/layout/Nav.tsx`**

```tsx
"use client";

import { Linkedin } from "lucide-react";
import { useAuthStore } from "@/src/lib/stores/auth";

export function Nav() {
  const { isAuthenticated, userName } = useAuthStore();
  const authenticated = isAuthenticated();

  return (
    <nav className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-white/80 px-5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Linkedin size={15} className="text-white" />
        </div>
        <span className="font-display text-sm font-extrabold tracking-tight text-text-primary">
          PostCraft
        </span>
      </div>

      {authenticated && (
        <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {userName ?? "Connected"}
        </span>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Create `frontend/src/components/layout/StepIndicator.tsx`**

```tsx
import { Check } from "lucide-react";

interface Step {
  label: string;
  status: "done" | "active" | "pending";
}

export function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                step.status === "done"
                  ? "bg-primary text-white"
                  : step.status === "active"
                  ? "bg-primary text-white"
                  : "bg-muted text-text-secondary"
              }`}
            >
              {step.status === "done" ? <Check size={10} strokeWidth={3} /> : i + 1}
            </div>
            <span
              className={`text-xs font-semibold ${
                step.status === "active"
                  ? "text-text-primary"
                  : step.status === "done"
                  ? "text-primary"
                  : "text-text-secondary"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="h-px w-8 bg-muted" />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/layout/SuccessState.tsx`**

```tsx
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

interface SuccessStateProps {
  onCreateAnother: () => void;
}

export function SuccessState({ onCreateAnother }: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center gap-5 rounded-card border border-border bg-surface p-10 text-center shadow-card"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 size={36} className="text-emerald-500" />
      </div>
      <div>
        <h2 className="font-display text-xl font-extrabold text-text-primary">
          Posted to LinkedIn!
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your post is live. Great work.
        </p>
      </div>
      <Button variant="ghost" onClick={onCreateAnother}>
        ↺ Create another post
      </Button>
    </motion.div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/
git commit -m "feat: add Nav, StepIndicator, SuccessState layout components"
```

---

## Task 11: QueryProvider + root layout

**Files:**
- Create: `frontend/src/providers/QueryProvider.tsx`
- Create: `frontend/app/layout.tsx`

- [ ] **Step 1: Create `frontend/src/providers/QueryProvider.tsx`**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
          mutations: { retry: 0 },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 2: Create `frontend/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/src/providers/QueryProvider";
import { Nav } from "@/src/components/layout/Nav";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PostCraft — LinkedIn Post Generator",
  description: "Describe your event. Post in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <QueryProvider>
          <Nav />
          <main>{children}</main>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/providers/QueryProvider.tsx frontend/app/layout.tsx
git commit -m "feat: add QueryProvider and root layout with fonts and Toaster"
```

---

## Task 12: Landing page (`/`)

**Files:**
- Create: `frontend/app/page.tsx`

- [ ] **Step 1: Create `frontend/app/page.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { Linkedin, Sparkles } from "lucide-react";
import { Button } from "@/src/components/ui/Button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = `${API_BASE}/login`;
  };

  return (
    <div className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center overflow-hidden px-5 py-16">
      {/* Animated background blobs */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl"
        style={{ animation: "pulse 8s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"
        style={{ animation: "pulse 10s ease-in-out infinite 2s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 flex max-w-md flex-col items-center text-center"
      >
        {/* Logo */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Linkedin size={32} className="text-white" />
        </div>

        {/* Wordmark */}
        <h1 className="font-display mb-3 text-4xl font-extrabold tracking-tight text-text-primary">
          PostCraft
        </h1>

        {/* Tagline */}
        <p className="mb-8 text-lg text-text-secondary">
          Describe your event.{" "}
          <span className="font-semibold text-primary">Post in seconds.</span>
        </p>

        {/* Feature pills */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {["AI-generated drafts", "Editable output", "One-click post"].map((f) => (
            <span
              key={f}
              className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          className="w-full max-w-xs gap-2.5 py-3 text-base"
          onClick={handleLogin}
        >
          <Linkedin size={18} />
          Login with LinkedIn
        </Button>

        <p className="mt-4 text-xs text-text-secondary/70">
          We only request permission to post on your behalf.
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server starts**

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 — you should see the PostCraft landing page with the logo, tagline, and LinkedIn login button.

Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: add landing page with LinkedIn login CTA"
```

---

## Task 13: Auth callback page (`/auth/callback`)

**Files:**
- Create: `frontend/app/auth/callback/page.tsx`

- [ ] **Step 1: Create `frontend/app/auth/callback/page.tsx`**

> Next.js 15 requires `useSearchParams()` to be inside a `<Suspense>` boundary. The page exports a wrapper that provides that boundary.

```tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Linkedin, AlertCircle } from "lucide-react";
import { Spinner } from "@/src/components/ui/Spinner";
import { Button } from "@/src/components/ui/Button";
import { useAuthStore } from "@/src/lib/stores/auth";
import { createApiClient } from "@/src/lib/api/client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err || !token) {
      setError(err === "no_code" ? "LinkedIn didn't return an authorization code." : "Authentication failed. Please try again.");
      return;
    }

    // Verify token is valid and fetch user name
    const client = createApiClient(API_BASE, token);
    client
      .getMe()
      .then((data) => {
        setAuth(token, data.name);
        router.replace("/compose");
      })
      .catch(() => {
        setError("Could not verify your LinkedIn session. Please try again.");
      });
  }, [searchParams, setAuth, router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex max-w-sm flex-col items-center gap-4 text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="font-display font-extrabold text-text-primary">Connection failed</h2>
          <p className="text-sm text-text-secondary">{error}</p>
          <Button variant="ghost" onClick={() => router.replace("/")}>
            ← Try again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
        <Linkedin size={28} className="text-white" />
      </div>
      <Spinner size={22} />
      <p className="text-sm font-medium text-text-secondary">Connecting your LinkedIn account…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/auth/callback/
git commit -m "feat: add auth callback page — reads token, verifies with /me, stores in Zustand"
```

---

## Task 14: Composer page (`/compose`)

**Files:**
- Create: `frontend/app/compose/page.tsx`

- [ ] **Step 1: Create `frontend/app/compose/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Send } from "lucide-react";

import { Card, CardLabel, CardHint } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Textarea } from "@/src/components/ui/Textarea";
import { Badge } from "@/src/components/ui/Badge";
import { StepIndicator } from "@/src/components/layout/StepIndicator";
import { SuccessState } from "@/src/components/layout/SuccessState";
import { useAuthStore } from "@/src/lib/stores/auth";
import { createApiClient } from "@/src/lib/api/client";
import { composerSchema, composerDefaults, parseTags, type ComposerValues } from "@/src/lib/schemas/composer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const LINKEDIN_CHAR_LIMIT = 3000;

export default function ComposePage() {
  const router = useRouter();
  const { token, isAuthenticated } = useAuthStore();
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [editedContent, setEditedContent] = useState<string>("");
  const [posted, setPosted] = useState(false);

  // Guard — redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const client = createApiClient(API_BASE, token);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ComposerValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: composerDefaults,
  });

  const generateMutation = useMutation({
    mutationFn: (values: ComposerValues) =>
      client.generatePostContent({
        description: values.description,
        skills: parseTags(values.tags),
      }),
    onSuccess: (content) => {
      setGeneratedContent(content);
      setEditedContent(content);
    },
    onError: () => {
      toast.error("Generation failed", { description: "Could not reach the AI service. Is the backend running?" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => client.publishPost({ text: editedContent }),
    onSuccess: () => {
      setPosted(true);
    },
    onError: () => {
      toast.error("Post failed", { description: "LinkedIn returned an error. Check that your token is still valid." });
    },
  });

  const charCount = editedContent.length;
  const charOverLimit = charCount > LINKEDIN_CHAR_LIMIT;

  const steps = [
    { label: "Connected", status: "done" as const },
    { label: "Describe", status: generatedContent ? "done" as const : "active" as const },
    { label: "Review & Post", status: generatedContent ? "active" as const : "pending" as const },
  ];

  if (posted) {
    return (
      <div className="mx-auto max-w-[680px] px-5 py-10">
        <SuccessState onCreateAnother={() => {
          setPosted(false);
          setGeneratedContent("");
          setEditedContent("");
        }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto max-w-[680px] px-5 py-10"
    >
      <div className="mb-2">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-text-primary">
          Create your post
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Describe your event and let AI write it for LinkedIn.
        </p>
      </div>

      <div className="mt-6">
        <StepIndicator steps={steps} />
      </div>

      {/* Card 1 — Input */}
      <Card className="mb-4">
        <CardLabel>Event description</CardLabel>
        <CardHint>
          Paste what your event is about — topics, audience, date, location.
        </CardHint>
        <Textarea
          {...register("description")}
          placeholder="E.g. We're hosting a free AI workshop for developers on April 15th in Lisbon. 50 seats, networking included..."
          rows={4}
          error={errors.description?.message}
        />

        <div className="mt-4">
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Skills / tags{" "}
            <span className="text-text-secondary/60">(optional, comma-separated)</span>
          </label>
          <input
            {...register("tags")}
            placeholder="AI, Machine Learning, Python"
            className="w-full rounded-lg border border-muted bg-slate-50 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            variant="primary"
            loading={generateMutation.isPending}
            onClick={handleSubmit((values) => generateMutation.mutate(values))}
          >
            <Sparkles size={15} />
            Generate post
          </Button>
        </div>
      </Card>

      {/* Shimmer bar while generating */}
      <AnimatePresence>
        {generateMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-blue-100"
          >
            <div className="h-full shimmer rounded-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card 2 — Generated draft */}
      <AnimatePresence>
        {generatedContent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <div className="mb-3">
                <Badge dot>LinkedIn preview</Badge>
              </div>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={10}
                className={charOverLimit ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}
              />
              <p className={`mt-1.5 text-right text-xs font-medium ${charOverLimit ? "text-red-500" : "text-text-secondary"}`}>
                <span className={charOverLimit ? "text-red-500 font-bold" : "text-primary font-semibold"}>
                  {charCount.toLocaleString()}
                </span>
                {" / "}
                {LINKEDIN_CHAR_LIMIT.toLocaleString()} characters
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="ghost"
                  onClick={() => generateMutation.mutate(getValues())}
                  loading={generateMutation.isPending}
                >
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
                <Button
                  variant="dark"
                  disabled={charOverLimit || publishMutation.isPending || !editedContent.trim()}
                  loading={publishMutation.isPending}
                  onClick={() => publishMutation.mutate()}
                >
                  <Send size={14} />
                  Post to LinkedIn
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing regressed**

```bash
cd frontend
npm test
```

Expected: all unit tests pass (auth-store, api-client, composer-schema).

- [ ] **Step 3: Commit**

```bash
git add frontend/app/compose/page.tsx
git commit -m "feat: add composer page — generate, edit, post flow with Framer Motion"
```

---

## Task 15: Final smoke test

- [ ] **Step 1: Start the Flask backend**

```bash
cd /path/to/GPT-Linkedin
pdm run flask --app src.linkedinautopost run --port 8080
```

Confirm: `Running on http://127.0.0.1:8080` with no errors.

- [ ] **Step 2: Start the Next.js frontend**

```bash
cd frontend
npm run dev
```

Confirm: `Ready on http://localhost:3000` with no TypeScript errors.

- [ ] **Step 3: Smoke test checklist**

Run through this manually in a browser:

- [ ] Open http://localhost:3000 — landing page appears with PostCraft logo and "Login with LinkedIn" button.
- [ ] Click "Login with LinkedIn" — browser navigates to `http://localhost:8080/login` which redirects to the LinkedIn consent page.
- [ ] After LinkedIn consent — browser redirects to `http://localhost:3000/auth/callback?token=...`, spinner shows briefly, then redirects to `/compose`.
- [ ] On `/compose` — connected badge shows in nav with your LinkedIn name, step indicator shows "Connected ✓".
- [ ] Enter event description → click "Generate post" → shimmer bar animates → generated draft appears.
- [ ] Edit the draft → character count updates in real-time → goes red above 3,000.
- [ ] Click "Regenerate" → new draft replaces the old one.
- [ ] Click "Post to LinkedIn" → success state appears with "Posted to LinkedIn!" message.
- [ ] Click "Create another post" → form resets.
- [ ] Navigate to http://localhost:3000/compose directly without logging in → redirects to `/`.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: linkedin composer frontend complete"
```
