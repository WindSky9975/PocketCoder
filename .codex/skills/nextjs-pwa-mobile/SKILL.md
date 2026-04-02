---
name: nextjs-pwa-mobile
description: Design, create, or repair the PocketCoder `apps/web` mobile-first PWA using Next.js App Router. Use when Codex needs to bootstrap or fix page structure, App Router boundaries, pairing and session pages, realtime-session UI shells, PWA install entry points, browser-side storage and protocol adapter boundaries, or the frontend layout that stays mobile-first without pulling relay, agent, or deep crypto logic into page code.
---

# Next.js PWA Mobile

## Overview

Create or repair only the PocketCoder mobile-first web shell in `apps/web`. Keep pages focused on composition, interaction shells, and browser entry points. Keep feature logic, realtime hooks, storage hooks, protocol adaptation, and PWA concerns in dedicated boundaries instead of letting them leak into App Router pages.

## Workflow

1. Inspect the current `apps/web` state and decide whether the task is `init`, `repair`, or web-structure evolution.
2. Read [`references/web-constraints.md`](references/web-constraints.md) before editing files.
3. Read [`references/page-map.md`](references/page-map.md) when shaping App Router pages and navigation responsibilities.
4. Read [`references/feature-boundaries.md`](references/feature-boundaries.md) when placing work under `features/`, `components/ui/`, and `lib/`.
5. Read [`references/pwa-contracts.md`](references/pwa-contracts.md) when touching `manifest.webmanifest`, icons, install hooks, or service-worker entry points.
6. Use `scripts/init_web_app.py` to create or repair the web skeleton from the bundled templates.
7. Use `scripts/verify_web_app.py` after changes to confirm the required files, directories, and mobile/PWA boundaries still hold.
8. If the repo is runnable and the user expects executable output, run minimal checks such as `npm run typecheck` and `npm run test`.

## Rules

- Keep `apps/web` focused on mobile-first browser UX, not backend or desktop responsibilities.
- Keep `packages/protocol` as the only shared contract source.
- Keep high cohesion by splitting page routes, features, reusable UI, and browser-side libraries into their own boundaries.
- Keep low coupling by preventing App Router pages from directly owning realtime transport internals, local-storage policy, or protocol parsing details.
- Preserve the fixed page set for V1: pair/login, session list, session detail, and connection-error.
- Keep WebSocket as the primary realtime channel boundary, but do not hardcode relay implementation details into pages.
- Keep PWA install readiness present from the initial shell.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.

## Design Boundary

### Allowed Work

- create or repair the `apps/web` shell
- define App Router pages and layouts
- define feature, UI, and browser-lib boundaries
- define mobile-first presentation shells for pairing, sessions, approvals, and connection states
- define PWA install and manifest entry points without deep browser-platform behavior
- add smoke or unit test placeholders under `src/tests/`

### Forbidden Work

- define shared protocol schemas inside `apps/web`
- implement relay server behavior or desktop agent behavior
- embed deep cryptography or key-exchange logic into page components
- embed WebSocket protocol details directly into route files
- turn PWA install or service-worker hooks into the only way the product works

## Resource Use

### `references/web-constraints.md`

Read this first whenever a change affects mobile-first behavior, PWA scope, or page-set boundaries.

### `references/page-map.md`

Read this when deciding where each page should live and what it may do.

### `references/feature-boundaries.md`

Read this when deciding whether a concern belongs in `features`, `components/ui`, or `lib`.

### `references/pwa-contracts.md`

Read this when shaping manifest, icons, install hooks, or service-worker boundaries.

### `scripts/init_web_app.py`

Run this for empty-app initialization or structural repair of `apps/web`.

### `scripts/verify_web_app.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented web constraint.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or web evolution
- which web files were created, updated, skipped, or left in conflict
- whether page, feature, lib, and PWA boundaries remain cleanly separated
- which later-stage browser behavior remains intentionally unimplemented