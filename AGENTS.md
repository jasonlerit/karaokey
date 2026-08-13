<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project guidelines

## Architecture

- `src/app` contains App Router routes, layouts, and route-specific UI.
- `src/components/shared` contains reusable application-wide components and providers.
- `src/common` contains shared infrastructure and utilities that are not tied to a route.
- `src/db` contains the Drizzle client and PostgreSQL schema.
- `src/lib` contains configured library clients and framework integrations.
- Prefer the `@/*` alias for imports from `src`.
- Keep modules focused and colocate feature-specific code with its route or feature.

## Next.js and React

- Use Server Components by default. Add `"use client"` only when browser APIs, client-side state, or event handlers require it.
- Keep secrets, database access, and other server-only code out of Client Components.
- Use framework APIs and conventions documented in the installed Next.js guides.

## TanStack Query

- Use TanStack Query for client-side server state, caching, mutations, and hydration; prefer direct data access in Server Components when client caching is unnecessary.
- Use the shared `getQueryClient` from `src/lib/react-query.ts`; do not create ad hoc `QueryClient` instances.
- Keep the application provider in `src/components/shared/react-query-client-provider.tsx` and mount it around application children in the root layout.
- Use stable array query keys that include every input used by the query function.
- Prefer reusable query option factories when the same query is prefetched on the server and consumed on the client.
- Use `HydrationBoundary` with `dehydrate(getQueryClient())` for server-prefetched queries. Preserve the configured SuperJSON serialization.
- After successful mutations, invalidate or update every affected query explicitly.
- Keep React Query Devtools inside the shared provider and do not include its production entry point unless explicitly requested.

## Environment variables

- Define and validate environment variables in `src/common/env.ts` with Zod.
- Import the validated `env` object; do not access named `process.env` variables elsewhere.
- Add every required variable to `.env.example` with a safe placeholder value.
- Never commit real secrets or expose server-only values with the `NEXT_PUBLIC_` prefix.

## Database

- Use Drizzle ORM with PostgreSQL.
- Use camelCase names in TypeScript and snake_case identifiers in PostgreSQL.
- Define schema objects under `src/db` and export them so Drizzle Kit can discover them.
- Generate migrations with `npm run db:generate` and commit the generated migration files.
- Do not apply migrations with `db:migrate` or `db:push` without explicit user authorization.

## TypeScript and validation

- Keep TypeScript strict and prefer inferred types when they remain clear.
- Validate untrusted input and external data with Zod at system boundaries.
- Prefer named exports for shared modules.
- Avoid `any`, unsafe casts, and non-null assertions unless their safety is established and documented.
- Return or throw actionable errors without logging secrets or sensitive values.

## Verification

- Run `npm run lint` and `npx tsc --noEmit` after code changes.
- Run relevant tests when they exist or when a change adds them.
- Run `npm run db:generate` after schema changes and review the generated SQL.
- Report checks that could not be run and explain why.
