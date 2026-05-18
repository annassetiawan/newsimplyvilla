# Architecture

## Overview

SimplyVilla is a **Next.js 16 App Router** application with server-side rendering, server actions for mutations, and Supabase as the backend (PostgreSQL database + authentication).

---

## Folder Structure

```
newsimplyvilla/
├── app/                    # Next.js App Router (routes + server actions)
│   ├── (app)/              # Protected route group (requires auth)
│   │   ├── layout.tsx      # Sidebar + header shell
│   │   ├── dashboard/
│   │   ├── front-desk/
│   │   ├── rooms/
│   │   ├── inventory/
│   │   ├── maintenance/
│   │   ├── schedule/
│   │   ├── reports/
│   │   ├── sop/
│   │   ├── business/
│   │   ├── settings/
│   │   ├── pricing/
│   │   └── users/
│   ├── (auth)/             # Public auth route group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── api/                # Thin API routes
│   │   ├── user/route.ts
│   │   └── subscription/route.ts
│   ├── auth/confirm/       # Supabase email confirmation callback
│   ├── actions/            # Server actions (mutations)
│   └── onboarding/         # First-run setup flow
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── dashboard/
│   ├── front-desk/
│   ├── maintenance/
│   ├── rooms/
│   ├── inventory/
│   ├── reports/
│   ├── schedule/
│   ├── settings/
│   ├── sop/
│   ├── business/
│   ├── users/
│   └── onboarding/
├── hooks/                  # Custom React hooks
├── lib/                    # Supabase clients, Prisma client, utilities
├── store/                  # Zustand stores
├── prisma/                 # Prisma schema and migrations
└── proxy.ts                # Supabase SSR middleware (auth guard)
```

---

## Routing

### Route Groups

| Group | Path Prefix | Auth Required | Layout |
|---|---|---|---|
| `(app)` | `/dashboard`, `/front-desk`, etc. | Yes | Sidebar + header |
| `(auth)` | `/login`, `/register`, etc. | No | Minimal |
| root | `/` | No | Redirect only |

### Auth Guard

`proxy.ts` runs as Next.js middleware. It:
1. Creates a Supabase server client with cookie handling
2. Refreshes the session on every request
3. Redirects unauthenticated users to `/login`
4. Redirects authenticated users away from `/login` to `/dashboard`
5. Skips auth check when `DISABLE_AUTH=true` (dev only)

---

## Data Flow

### Reading Data

Pages are Server Components by default. Data is fetched inside the page component using Prisma directly or via `lib/` utility functions.

```
Browser → Next.js Server Component → Prisma → PostgreSQL (Supabase)
```

Session data is obtained via `getSessionUser()` (cached with `unstable_cache`, 60-second TTL) which reads the Supabase Auth cookie server-side.

### Writing Data (Mutations)

All create/update/delete operations go through **Server Actions** in `app/actions/`.

```
Browser (form/button) → Server Action → Prisma → PostgreSQL
                                      ↓
                               revalidatePath() → Next.js cache invalidation
```

Server actions call `revalidatePath()` after mutations to trigger re-fetching of the affected route.

### API Routes

Two thin API routes exist for client-side data needs:

- `GET /api/user` — returns the current user profile
- `GET /api/subscription` — returns subscription plan and status

---

## Authentication

| Component | Role |
|---|---|
| Supabase Auth | User identity, sessions, JWT |
| `@supabase/ssr` | Cookie-based session persistence for Next.js |
| `proxy.ts` | Middleware auth guard |
| `lib/supabase/server.ts` | Server-side Supabase client (with cookies) |
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `Staff` model | Links `supabaseUserId` to villa and role |

**Login flow:**
1. User submits email/password at `/login`
2. `signIn` server action calls `supabase.auth.signInWithPassword()`
3. Supabase sets session cookie
4. Middleware detects session and allows access to `(app)` routes
5. `getSessionUser()` fetches the matching `Staff` record by `supabaseUserId`

---

## State Management

| Scope | Tool | Use Case |
|---|---|---|
| Server / URL | Next.js Server Components | Primary data fetch |
| Mutation | Server Actions | Create/update/delete |
| Global client | Zustand | Sidebar collapse state |
| Local client | `useState` / `useReducer` | Modals, form state, optimistic DnD |
| Session | Supabase Auth cookie | User identity |

---

## Component Patterns

### Page Components
Each route has a server component `page.tsx` that:
1. Fetches required data (Prisma)
2. Passes data as props to a `*Client` client component

### Client Components (`*Client.tsx`)
- Handle all interactivity (tabs, modals, forms, drag-and-drop)
- Receive initial data from the server component
- Call server actions for mutations

### Modal Pattern
Modals use shadcn `Dialog`. They are controlled by `useState` in the parent client component. Create and edit share the same modal when possible.

### Loading & Error States
- Each route has a `loading.tsx` that renders skeleton components
- `error.tsx` catches render errors per route segment
- `global-error.tsx` catches root layout errors

---

## Supabase Clients

Two client configurations exist in `lib/supabase/`:

| File | Usage | Context |
|---|---|---|
| `server.ts` | Server components, server actions, API routes | Uses `cookies()` |
| `client.ts` | Client components | Browser singleton |

---

## Subscription Gating

`ProGate` component wraps any Pro-only feature. It reads the subscription plan from context or the `/api/subscription` endpoint and:
- Renders children if plan is `PRO`
- Renders `UpgradeModal` trigger if plan is `FREE`

Amber color (`amber-*`) is reserved exclusively for Pro/upgrade UI elements. Action buttons use `neutral-800`.

---

## Image Handling

Next.js `<Image>` is configured to allow external images from `*.supabase.co` domains (set in `next.config.mjs`). Room photos are stored as URL arrays pointing to Supabase Storage (Needs verification on upload implementation).
