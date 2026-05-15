# SimplyVilla

Villa & resort management SaaS built for hospitality operators. Manage reservations, guests, rooms, staff, inventory, maintenance, and finances — all in one place.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 5 |
| Auth | Supabase Auth |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Drag & Drop | @hello-pangea/dnd |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local   # Needs verification — .env.example may not exist
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

**`.env`** (Prisma / build-time):
```
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
```

**`.env.local`** (runtime):
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_*
SUPABASE_SERVICE_ROLE_KEY=<service role key>
DISABLE_AUTH=false   # set true in dev to skip auth redirect
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npx prisma migrate dev` | Create & apply a new migration |
| `npx prisma migrate deploy` | Apply pending migrations (prod) |
| `npx prisma studio` | Open Prisma DB GUI |
| `npx prisma generate` | Regenerate Prisma client |

## Documentation

| Doc | Description |
|---|---|
| [docs/project-overview.md](docs/project-overview.md) | Goals, scope, and subscription tiers |
| [docs/features.md](docs/features.md) | Feature list per module |
| [docs/architecture.md](docs/architecture.md) | Folder structure, routing, and data flow |
| [docs/database-schema.md](docs/database-schema.md) | All Prisma models and enums |
| [docs/development-guidelines.md](docs/development-guidelines.md) | Conventions, patterns, and workflow |

## Project Status

Active development. See [docs/features.md](docs/features.md) for which modules are live vs. planned.
