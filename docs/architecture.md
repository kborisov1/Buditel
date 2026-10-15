# Buditel: Technical Architecture

Companion to `scope.md`. Covers the v1 build and how it extends to v2 and beyond. 

## 1. Principles

1. **One TypeScript monorepo.** The lesson schema, grading logic and UI are shared by the learner app, the admin editor and the preview.
2. **Content is data.** A lesson is a typed JSON document validated by a schema. This makes the editor, AI drafting, bulk import/export (v1.5) and new step types cheap.
3. **Modular monolith.** One deployable app with clean internal boundaries, which can be split into services later without a rewrite.
4. **Do not model what is not written yet.** Embed first, extract into tables when v2 features need it.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (React, TypeScript), Tailwind | Learner app and `/admin` routes in one app |
| Drag interactions | dnd-kit | Timeline, ordering, matching, cause-effect |
| UI strings | next-intl | Bulgarian is the only locale in v1; more languages later means adding translation files |
| API | Hono, Zod-validated, mounted in Next route handlers | Can be lifted out into a separate service unchanged |
| Domain logic | `packages/core`, framework-agnostic | No Next or React imports |
| Database | PostgreSQL + Drizzle ORM | PostGIS can be enabled later for v2 map data |
| Auth | Better Auth | Email + password now; OAuth/SSO providers and bearer tokens are plugins later |
| Media | Cloudflare R2 behind a CDN | Image variants generated on upload |
| Hosting | Vercel + Neon Postgres + R2 | Cheapest low-ops setup; Dockerize so moving to a VPS or another cloud is easy |
| Quality | Vitest, Playwright, GitHub Actions, Sentry | Vitest for schema and grading, Playwright for the learner flow |

## 3. Repo layout

```
apps/web            Next.js: learner app + /admin routes
packages/core       domain logic, DB access, services (no framework imports)
packages/schema     Zod schemas: lesson, steps, media refs (single source of truth)
packages/player     lesson player, used by learner AND editor preview
  src/logic/        headless: step progression, re-queue, result summary, graders (no DOM)
  src/web/          DOM step renderers (dnd-kit)
packages/editor     per-step-type editor forms
```

The `logic/` and `web/` split inside `packages/player` costs nothing now and is the only thing that would need to be shared if a native app ever appears.

## 4. Content model

Each step type is a registry entry made of four parts: a Zod schema, a learner renderer, an editor form and a grader. Adding a step type (for example a `map` step in v2) means adding one entry and changing nothing else.

A lesson stores its steps as a JSONB array, validated by a discriminated union:

```json
{
  "id": "…", "unitId": "…", "position": 12, "status": "draft",
  "title": "…", "schemaVersion": 1,
  "steps": [
    { "id": "s1", "type": "story", "text": "…", "imageId": "img_7" },
    { "id": "s2", "type": "multiple_choice", "prompt": "…", "imageId": "img_9",
      "options": [{ "id": "a", "text": "…" }], "correctOptionId": "a" },
    { "id": "s3", "type": "timeline", "events": [{ "id": "e1", "label": "…", "order": 1 }] }
  ]
}
```

This keeps edits atomic, imposes no limit on step count or order, and gives AI drafting a target, since Zod converts to JSON Schema for structured LLM output. `schemaVersion` plus migration functions handle future changes to step shapes.

Timelines and cause-effect chains are embedded in steps for v1. When v2 adds people/events/places pages and a glossary, those become proper tables and steps point to them through optional `entityRefs`.

## 5. Relational tables

`units`, `lessons`, `media` (storage key, mime, dimensions, required `alt_text`), `users` (with a `role` column: `learner` or `admin`), `progress` (user, lesson, completed_at, result summary) and `audit_log` (admin actions).

Linear unlocking is computed: a lesson is open when the previous lesson in order is completed. Mid-lesson state is never persisted, which matches "leaving restarts the lesson", so no step-level state exists.

## 6. Decisions tied to the scope

**Grading is client-side in v1**, as pure functions in `packages/player/src/logic`. Without XP or leaderboards there is nothing to cheat. If gamification arrives, the same functions run server-side and an append-only `attempt_events` table is added.

**Draft/published** is a status column. Published edits go live immediately, so no versioning is needed. A `lesson_revisions` table can be added later for undo or history without changing the schema above.

**Admin test tools** follow from the model. Progress is just rows, so "start at any point" is a bulk insert of completions and "reset" is a delete. Draft preview is the learner player with an admin-only flag. Account switching is admin impersonation, recorded in `audit_log`.

**Editor** uses forms per step type, drag-to-reorder and a live preview with the real player component. An "edit as JSON" tab is nearly free and fits the AI-assisted drafting workflow.

**Performance.** Published lessons are read-heavy and cacheable at the CDN, with on-demand revalidation on save so "live immediately" holds.

## 7. How deferred items slot in

| Item | What it needs |
|---|---|
| Gamification | Server-side grading, `attempt_events`, new tables for XP and streaks |
| Maps (v2) | New `map` step type, MapLibre on the frontend, geo tables in PostGIS |
| Glossary and reference pages | New entity tables, referenced from steps via `entityRefs` |
| SSO | Better Auth OAuth providers |
| Bulk import/export (v1.5) | A script or admin page reading and writing lesson JSON, validated by the same schema |
| Forgot password | Transactional email provider (for example Resend), supported by Better Auth |
| Extra UI languages | New next-intl translation files |
| Accuracy layer (sources, flags) | New optional fields on lessons or steps, with a schema version bump |

## 8. Conventions

All learner and admin data access goes through the Hono API. Zod schemas in `packages/schema` are the only definition of content shapes. Backend identifiers and field names are English; learner-facing text is Bulgarian. Every media row requires alt text.

## 9. Room for a possible mobile app

No mobile work is planned. These rules keep the option open at near-zero cost.

1. **Web uses the same API a mobile client would.** No server actions and no direct DB calls in components, so the API is already the complete contract.
2. **Auth stays token-capable.** Better Auth supports bearer tokens and an Expo integration, so enabling them later is configuration, not a rewrite.
3. **Player logic stays headless.** Everything in `packages/player/src/logic` has no DOM imports. A native app would reuse it and only write its own step renderers.
4. **Unknown step types fail gracefully.** The API reports when a lesson contains a step type the client does not support. This is irrelevant for the web (always current) but essential once installed app versions exist.
5. **Cheaper interim option.** The web app is responsive and lessons are short, so an installable PWA can cover mobile for a long time before native is justified.

If a native app is ever started, it becomes `apps/mobile` (Expo) in the same monorepo and consumes `schema`, `player/logic` and the typed API client as they are.

## 10. Tooling and Makefile targets

npm workspaces (`apps/*`, `packages/*`); no extra monorepo tool yet. Packages are consumed as TypeScript source and transpiled by Next. Run everything through `make`:

| Target                      | Does                                              |
| --------------------------- | ------------------------------------------------- |
| `install`                   | `npm install`                                     |
| `dev` / `build`             | Next.js dev server / production build             |
| `test`                      | Vitest                                            |
| `lint`                      | `tsc` typecheck, ESLint, Prettier check           |
| `format`                    | Prettier write                                    |
| `db-up` / `db-down`         | Local Postgres via Docker Compose                 |
