# Development Guidelines

## Code Conventions

### TypeScript
- Strict mode is enabled (`tsconfig.json`)
- Prefer explicit types for function parameters and return values
- Use Zod for runtime validation at system boundaries (form inputs, API responses)
- Path alias `@/` maps to the project root — always use it over relative paths

### File Naming
- Pages: `page.tsx`, `loading.tsx`, `error.tsx` (Next.js conventions)
- Client components: `*-client.tsx` or `*Client.tsx`
- Server actions: named exports in `app/actions/*.ts`
- Utility functions: `lib/*.ts`

### Component Structure
Follow this pattern for each module:

```
app/(app)/module-name/
  page.tsx              ← server component, fetches data
components/module-name/
  module-client.tsx     ← "use client", receives data as props
  module-modal.tsx      ← Dialog for create/edit
  module-tab.tsx        ← individual tab views (if tabbed)
```

---

## Styling

- **Tailwind CSS v4** — use utility classes, avoid custom CSS unless unavoidable
- **shadcn/ui** components as the base for all UI primitives (button, input, dialog, etc.)
- **Dark mode** — always test new components in both light and dark mode; use Tailwind `dark:` variants
- **Color conventions:**
  - Amber (`amber-*`) is reserved exclusively for Pro/upgrade UI (ProGate, UpgradeModal, pricing highlights)
  - Action buttons use `neutral-800` (not amber, not primary blue)
- **Icons** — use Lucide React only; do not introduce other icon libraries

---

## Server Actions

All mutations must be server actions in `app/actions/`.

```typescript
"use server"

export async function createThing(data: FormData | SomeType) {
  // 1. Get session and villa context
  const user = await getSessionUser()
  
  // 2. Validate input (Zod)
  
  // 3. Prisma mutation
  await prisma.model.create({ data: { ...data, villaId: user.villaId } })
  
  // 4. Log activity (if significant action)
  
  // 5. Revalidate affected route
  revalidatePath("/module-name")
  
  // 6. Return result or redirect
}
```

- Always scope writes to `villaId` — never allow cross-villa data access
- Call `revalidatePath()` after every mutation that affects displayed data
- Use `redirect()` from `next/navigation` for post-action navigation

---

## Database

- All Prisma queries go through the singleton client in `lib/prisma.ts` (or equivalent)
- Never expose raw database credentials to the client
- Always filter queries by `villaId` for multi-tenant safety
- Add indexes for any field used in frequent `WHERE` or `ORDER BY` clauses

### Migration Rules
1. Run `npx prisma migrate dev --name descriptive-name` locally
2. Commit both `prisma/schema.prisma` and the generated `prisma/migrations/` folder
3. CI/CD runs `npx prisma migrate deploy` on the production database

---

## Authentication

- Use `getSessionUser()` (cached) in server components and actions to get the current user
- Never trust client-provided `villaId` — always derive it from the server-side session
- `DISABLE_AUTH=true` in `.env.local` bypasses auth redirects for local development only — never commit this set to true

---

## Subscription Gating

Use the `ProGate` component to wrap any feature that requires a Pro subscription:

```tsx
<ProGate>
  <ProOnlyFeature />
</ProGate>
```

- Do not add Pro checks inline in page logic — always use `ProGate`
- Do not use amber colors outside of Pro/upgrade UI contexts

---

## State Management

| Scenario | Use |
|---|---|
| Server data (initial load) | Server component props |
| Mutations | Server actions + `revalidatePath` |
| Modal open/close | Local `useState` |
| Drag-and-drop optimistic state | Local `useState` (see BoardView pattern) |
| Global UI state (sidebar) | Zustand store |
| Do NOT use | Redux, Context for data fetching |

---

## Forms

- Use **React Hook Form** with **Zod** resolver for all forms with validation
- For simple single-field actions, a plain `<form>` with a server action is fine
- Always show error messages below the relevant field
- Disable submit button while submitting to prevent double-submission

---

## Error Handling

- Each route segment has `error.tsx` for rendering errors
- Server actions should return structured error objects rather than throwing when the error is user-facing
- Use **Sonner** toasts for mutation feedback: success and error
- Use `NetworkError` component for data fetch failures
- Use `SessionExpired` component when auth session is lost mid-session

---

## Performance

- Prefer Server Components — only add `"use client"` when you need interactivity, hooks, or browser APIs
- Use `loading.tsx` + skeleton components (`SkeletonCard`, `SkeletonTable`, `SkeletonKanban`) for perceived performance
- Session data is cached with `unstable_cache` (60-second TTL) to avoid repeated DB lookups
- Add `@@index` in Prisma schema for any field queried frequently in `WHERE` clauses

---

## Development Workflow

```bash
# Start dev server
npm run dev

# After schema changes
npx prisma migrate dev --name your-change
npx prisma generate

# Before committing
npm run lint
npm run build   # verify no type errors or build failures
```

### Branch Strategy (Needs verification — not confirmed in repo config)
- `main` — production-ready code
- Feature branches: `feat/feature-name`
- Bug fixes: `fix/bug-description`

---

## Adding a New Module

1. Create route: `app/(app)/module-name/page.tsx`
2. Add `loading.tsx` with appropriate skeleton
3. Create `components/module-name/module-client.tsx`
4. Add server actions in `app/actions/module-name.ts`
5. Add Prisma model(s) if needed + run migration
6. Add navigation link to sidebar (`components/layout/sidebar.tsx`)
7. Add route to middleware allowlist if needed (`proxy.ts`)
8. Gate with `ProGate` if it's a Pro feature
