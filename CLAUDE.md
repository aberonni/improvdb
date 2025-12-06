# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ImprovDB is a T3 Stack application for sharing improv games, exercises, and lesson plans. It's a Next.js application deployed at improvdb.com using:
- TypeScript
- Next.js (Pages Router)
- tRPC for type-safe API routes
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication (Google OAuth + email)
- Tailwind CSS + shadcn/ui components
- Playwright for E2E testing

## Common Commands

### Development
```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production (includes Prisma generate + migrate)
npm run typecheck    # Run TypeScript compiler check
npm run lint         # Run ESLint
```

### Database
```bash
npx prisma db push           # Push schema changes to database
npx prisma db seed           # Seed database with test data
npx prisma studio            # Open Prisma Studio GUI
npx tsx prisma/updateSeedData.ts  # Pull production data to seedData.json
```

### Testing
```bash
# Run E2E tests (requires Docker and freshly seeded local DB)
docker build -t playwright-docker -f tests/Dockerfile-playwright .
docker run -p 9323:9323 --rm --name playwright-runner -it playwright-docker:latest /bin/bash
# Inside container:
npx playwright test
npx playwright test --update-snapshots  # Update visual regression snapshots

# Run tests without Docker (skips screenshot comparison)
SKIP_SCREENSHOT_COMPARISON=1 npx playwright test

# Copy updated snapshots from container to local
docker cp playwright-runner:/app/tests .
```

### Local Postgres Setup
```bash
docker compose -f docker-compose.postgres.yml up
npx prisma db push
npx prisma db seed

# Reset database (soft)
npx prisma db push --force-reset
npx prisma db seed

# Reset database (hard - destroys volumes)
docker-compose -f docker-compose.postgres.yml down -v
```

## Architecture

### Tech Stack Details
- **Next.js Pages Router**: All routes in `src/pages/`, API routes at `src/pages/api/`
- **tRPC**: Type-safe API layer replacing traditional REST endpoints
- **Prisma**: Multi-file schema in `prisma/schema/` directory (index.prisma imports other schema files)
- **Authentication**: NextAuth.js with Google OAuth and email/magic link support
- **Styling**: Tailwind CSS with shadcn/ui components in `src/components/ui/`
- **Rate Limiting**: Upstash Redis (optional in dev, required in production)

### Directory Structure
```
src/
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── data-table/    # Reusable table components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── pages/             # Next.js pages (file-based routing)
│   ├── api/          # API routes (NextAuth, tRPC handler)
│   ├── admin/        # Admin-only pages
│   ├── lesson-plan/  # Lesson plan pages
│   ├── resource/     # Resource pages
│   └── user/         # User profile pages
├── server/
│   ├── api/
│   │   ├── routers/  # tRPC routers (category, resource, lessonPlan, user)
│   │   ├── root.ts   # Main tRPC router (combines all routers)
│   │   └── trpc.ts   # tRPC setup (procedures: publicProcedure, privateProcedure, adminProcedure)
│   ├── auth.ts       # NextAuth configuration
│   ├── db.ts         # Prisma client instance
│   └── helpers/      # Server-side utilities
├── styles/           # Global CSS
└── utils/            # Client-side utilities
    └── api.ts        # tRPC client setup

prisma/
├── schema/           # Split schema files by domain
│   ├── index.prisma  # Main schema (imports others)
│   ├── user.prisma
│   ├── resource.prisma
│   ├── lesson-plan.prisma
│   └── category.prisma
├── seed.ts           # Database seeding logic
├── seedUtils.ts      # Shared seeding utilities
└── updateSeedData.ts # Script to update seedData.json from production

tests/                # Playwright E2E tests
```

### tRPC Procedures
The app uses three tRPC procedure types (defined in `src/server/api/trpc.ts`):
- **`publicProcedure`**: No authentication required (session may be null)
- **`privateProcedure`**: Requires authenticated user (throws UNAUTHORIZED if not logged in)
- **`adminProcedure`**: Requires user with ADMIN role

All tRPC routers are combined in `src/server/api/root.ts` and exposed at `/api/trpc/[trpc].ts`.

### Environment Variables
Environment variables are validated using `@t3-oss/env-nextjs` in `src/env.js`. Required variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`: NextAuth configuration
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `EMAIL_SERVER_*`: SendGrid SMTP configuration for magic links
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: Redis for rate limiting (optional in dev)

### Prisma Schema
The schema is split across multiple files in `prisma/schema/`. The main `index.prisma` sets up the datasource and generator. Schema uses:
- **relationMode**: `"prisma"` (for PlanetScale compatibility)
- **Multi-file setup**: Schemas organized by domain (user, resource, lesson-plan, category)

### Testing Strategy
E2E tests use Playwright and run in Docker to ensure consistent screenshot comparisons across environments. Tests require:
1. Local Postgres database running and freshly seeded
2. Dev server running on port 3000
3. Docker container built from `tests/Dockerfile-playwright`

Tests include visual regression testing with snapshots stored in `tests/` directory.

### Authentication Flow
- **Google OAuth**: Primary authentication method
- **Email magic links**: Secondary method using SendGrid
- **Session management**: NextAuth with Prisma adapter stores sessions in database
- **Test users**: Seed file creates `user@e2e.com` (regular user) and `admin@e2e.com` (admin) with hardcoded session tokens for E2E tests

### Path Aliases
The project uses `@/` as a path alias pointing to `src/` (configured in tsconfig.json). Always use absolute imports with `@/` instead of relative paths.

## Development Notes

### Database Workflow
1. Make schema changes in `prisma/schema/*.prisma` files
2. Run `npx prisma db push` to apply changes to database
3. Prisma Client is auto-generated on `npm install` (postinstall hook) or `npm run build`

### Adding New tRPC Routes
1. Create router file in `src/server/api/routers/`
2. Import and add to `appRouter` in `src/server/api/root.ts`
3. Use appropriate procedure type (public/private/admin) based on auth requirements

### Seeding Data
- Seed logic in `prisma/seed.ts` creates test users and loads data from `prisma/seedData.json`
- Update seed data from production using `npx tsx prisma/updateSeedData.ts`
- Session tokens for E2E tests are defined in `prisma/seedUtils.ts`

### Component Library
UI components are from shadcn/ui and located in `src/components/ui/`. These are copied into the project (not installed as dependencies) and can be customized.

## Coding Preferences

### Styling
- **Always use Tailwind CSS classes** instead of inline styles
- **Exception**: `@vercel/og` image generation requires inline styles (the `tw` prop doesn't reliably support all properties like `font-weight` and `line-height`)
- Follow the existing light theme pattern (white background, dark text) for generated images

### Testing
- **Always add E2E tests** for new features where applicable
- Tests go in the `tests/` directory using Playwright
- Include tests for SEO metadata when adding new pages
- Test API endpoints return expected responses
