# LinkedIn Composer Frontend — Design Spec

**Date:** 2026-03-30
**Status:** Approved

---

## Overview

A focused, single-purpose web app that lets a user log in with LinkedIn, describe an event, have GPT generate a LinkedIn post, edit it, and publish it. No history, no multi-user support — one-shot per session.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) | Best-in-class React, natural OAuth callback routing |
| Language | TypeScript | Type safety throughout |
| Styling | Tailwind CSS v4 | Utility-first, custom design tokens |
| Components | Custom (no shadcn) | Full aesthetic control, avoid generic look |
| Animations | Framer Motion | Page transitions, loading states, micro-interactions |
| Server state | TanStack Query v5 | Mutations with loading/error states |
| Client state | Zustand | Auth token + user info persisted in localStorage |
| Validation | Zod | Form and API response schemas |
| Forms | React Hook Form | Composer textarea with validation |
| Charts | — | Not needed (one-shot, no analytics) |

---

## Routes

| Route | Purpose | Auth required |
|---|---|---|
| `/` | Landing page — app intro + LinkedIn login CTA | No |
| `/auth/callback` | Handles OAuth return from Flask, stores token, redirects to `/compose` | No |
| `/compose` | Main composer — generate, edit, post | Yes — redirects to `/` if no token |

---

## Visual Design

**Direction:** Arctic / Crisp
**Palette:**
- Background: `#f0f4ff`
- Surface (cards): `#ffffff`
- Primary: `#2563eb` (blue)
- Text primary: `#0f172a`
- Text secondary: `#64748b`
- Border: `#dbeafe`
- Accent/hover: `#1d4ed8`

**Typography:**
- Display / brand: `Plus Jakarta Sans` (weight 800, tracking tight)
- Body: `DM Sans` (weight 400/600)
- Brand mark monospace accent: `Fira Code` (for the logo wordmark only)

**Radius & shadows:** 8–12px radius on cards, `box-shadow: 0 2px 8px rgba(37,99,235,0.06)`

**Motion:** Framer Motion — page enter fade+slide (y: 16 → 0, opacity 0 → 1, duration 0.3s), loading shimmer bar on generation, success state scale pulse.

---

## Page Designs

### `/` — Landing

- Full-viewport centered layout (flex column, centered)
- App logo (blue rounded square) + wordmark
- One-line tagline: "Describe your event. Post in seconds."
- "Login with LinkedIn" button — calls Flask `/login` which initiates OAuth
- Subtle animated gradient background (CSS keyframes, very slow)
- Mobile: same, stacked vertically

### `/auth/callback`

- Minimal loading screen: logo centered, animated spinner ring, "Connecting your LinkedIn account…" text
- On mount: reads query params (token or session cookie set by Flask), stores in Zustand, pushes to `/compose`
- On error: shows inline error message + "Try again" link back to `/`

### `/compose`

Three-step progress indicator at top (Connected ✓ → Describe → Review & Post).

**Card 1 — Event description input:**
- Label: "Event description"
- Hint: "Paste what your event is about — topics, audience, date, location."
- `<textarea>` — min 3 lines, resizable
- Optional "Skills / tags" text input below (comma-separated, mapped to `skills[]` in API call)
- "✦ Generate post" primary button (right-aligned)
- While generating: button disabled, shimmer progress bar animates above Card 2

**Card 2 — Generated draft (appears after generation):**
- "LinkedIn preview" chip badge
- Editable `<textarea>` pre-filled with GPT output — user can freely edit
- Character counter: `487 / 3,000` (LinkedIn limit) — turns red above 2,800
- "↺ Regenerate" ghost button (left) — re-calls API with same inputs
- "Post to LinkedIn →" dark button (right) — calls `/postPost`

**Post success state:**
- Cards replaced by a centered success card: green checkmark icon, "Posted to LinkedIn!", link to view post (if LinkedIn API returns post URL), "Create another" button that resets the form

**Error handling:**
- Toast notifications (top-right) for API errors on both generate and post actions
- Non-blocking — user can retry without losing their edited content

---

## API Integration

Flask backend endpoints used:

| Action | Method | Endpoint | Payload |
|---|---|---|---|
| OAuth initiation | Redirect | `/login` | — |
| OAuth callback | Handled by Flask | `/linkedin/callback` | — |
| Generate post | POST | `/makePostContent` | `{ description: string, skills: string[] }` |
| Publish post | POST | `/postPost` | `{ text: string }` |

A thin `apiClient` module wraps `fetch` with:
- Base URL from `NEXT_PUBLIC_API_BASE_URL` env var
- Bearer token from Zustand store (attached as `Authorization` header)
- Normalized error shape: `{ message, status }`

---

## Auth Flow

1. User clicks "Login with LinkedIn" → browser navigates to `{API_BASE}/login`
2. Flask redirects to LinkedIn OAuth consent screen
3. LinkedIn redirects to `{API_BASE}/linkedin/callback`
4. Flask processes token, redirects to `{FRONTEND_URL}/auth/callback?token=<jwt>` (or sets session cookie)
5. Frontend `/auth/callback` stores token in Zustand (`localStorage` persist), redirects to `/compose`
6. All subsequent API calls include the token as a Bearer header

> **Required backend changes (currently broken for web use):**
> - `/login` currently calls `webbrowser.open()` on the server and returns nothing. Must be changed to `return redirect(linkedin_auth_url)` so the user's browser is sent to LinkedIn.
> - `/linkedin/callback` currently stores the access token in a Python instance variable (`self.__access_token`) and returns plain text. Must be changed to store the token in a Flask session cookie and redirect the browser to `{FRONTEND_URL}/auth/callback`.
> - The frontend `/auth/callback` page reads the session (via a `/me` endpoint or cookie) to confirm auth, then redirects to `/compose`.
> - All `/makePostContent` and `/postPost` calls rely on the token already being in the LinkedIn instance — this works as long as the session is intact (single-user, single-server scenario).

---

## State Management

**Zustand store: `auth`**
```ts
{
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
}
```
Persisted to `localStorage` via `zustand/middleware/persist`.

**TanStack Query mutations:**
- `useGenerateMutation` — calls `/makePostContent`, on success sets `generatedContent` local state
- `usePublishMutation` — calls `/postPost`, on success shows success state

---

## Responsive Layout

- Max content width: `680px`, centered
- Padding: `40px 20px` desktop → `20px 16px` mobile
- Navigation: `56px` height, logo + connected badge
- Action rows stack vertically on `< 480px`
- Textareas remain full-width on all breakpoints

---

## File Structure

```
frontend/
  app/
    layout.tsx              # Root layout — fonts, providers, nav
    page.tsx                # Landing page
    auth/
      callback/
        page.tsx            # OAuth callback handler
    compose/
      page.tsx              # Composer page
  src/
    components/
      ui/
        Button.tsx
        Card.tsx
        Textarea.tsx
        Badge.tsx
        Toast.tsx
        Spinner.tsx
      layout/
        Nav.tsx
        SuccessState.tsx
        StepIndicator.tsx
    lib/
      api/
        client.ts           # fetch wrapper
      stores/
        auth.ts             # Zustand auth store
      schemas/
        composer.ts         # Zod schema for form
    providers/
      QueryProvider.tsx     # TanStack Query provider
  public/
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
```

---

## Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

---

## Out of Scope

- Post history / analytics
- Multi-user / team accounts
- Scheduled posting
- Image attachments
- Multiple social platforms
