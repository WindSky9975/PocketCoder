---
name: fastify-websocket-relay
description: Design, create, or repair the PocketCoder `apps/relay` service with Fastify, WebSocket, and SQLite-oriented module boundaries. Use when Codex needs to bootstrap or fix relay structure, transport entry points, connection routing, replay and presence boundaries, storage/repository layout, or the service shell that forwards encrypted protocol traffic without owning AI session logic.
---

# Fastify WebSocket Relay

## Overview

Create or repair only the PocketCoder relay service shell. Keep `apps/relay` cohesive around service routing, transport entry points, metadata persistence, presence, replay, and command deduplication. Do not move protocol design, desktop execution logic, browser logic, or encryption implementation details into this workspace.

## Workflow

1. Inspect the current `apps/relay` state and decide whether the task is `init`, `repair`, or relay-structure evolution.
2. Read [`references/relay-constraints.md`](references/relay-constraints.md) before editing files.
3. Read [`references/module-map.md`](references/module-map.md) when placing code under `modules/`, `transport/`, `security/`, `storage/`, or `infra/`.
4. Read [`references/transport-flow.md`](references/transport-flow.md) when shaping HTTP and WebSocket entry points.
5. Read [`references/storage-contracts.md`](references/storage-contracts.md) when touching SQLite access, migrations, or repositories.
6. Use `scripts/init_relay_service.py` to create or repair the relay skeleton from the bundled templates.
7. Use `scripts/verify_relay_service.py` after changes to confirm the required files, directories, and boundaries still hold.
8. If the repo is runnable and the user expects executable output, run the minimal checks such as `npm run typecheck` and `npm run test`.

## Rules

- Keep `apps/relay` focused on service routing, metadata, encrypted event forwarding, replay windows, presence, and deduplication.
- Keep `packages/protocol` as the only shared contract source; do not re-invent shared message shapes in relay-local files.
- Keep high cohesion by grouping code by relay concern: transport, security, storage, infra, and service modules.
- Keep low coupling by routing all storage access through repository or storage boundaries instead of leaking SQLite calls into transport handlers.
- Do not run or model AI session logic in relay.
- Do not parse or persist plaintext session content as part of the relay shell.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.
- Keep Fastify and WebSocket setup centralized through `src/app.ts` and `src/server.ts`.

## Design Boundary

### Allowed Work

- create or repair relay directories and entry files
- define transport boundaries for HTTP and WebSocket handlers
- define security, storage, infra, replay, and presence shells
- create minimal repository and SQLite access placeholders
- add relay-focused tests or placeholders under `tests/`

### Forbidden Work

- implement `protocol` schemas or shared message catalogs inside relay
- implement desktop PTY, session execution, or provider orchestration
- implement browser pages, pairing UI, or PWA state
- implement full encryption algorithms or key-generation flows inside the relay shell
- move deployment-orchestration concerns into the service skill

## Resource Use

### `references/relay-constraints.md`

Read this first whenever a change affects relay scope, metadata retention, WebSocket boundaries, or schema-validation entry points.

### `references/module-map.md`

Read this when deciding where a new relay responsibility belongs.

### `references/transport-flow.md`

Read this when shaping pairing HTTP endpoints, WebSocket session subscription, heartbeats, event replay, or command forwarding.

### `references/storage-contracts.md`

Read this when editing SQLite access, migrations, repository layout, or metadata retention rules.

### `scripts/init_relay_service.py`

Run this for empty-service initialization or structural repair of `apps/relay`.

### `scripts/verify_relay_service.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented relay constraint.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or relay evolution
- which relay files were created, updated, skipped, or left in conflict
- whether the relay still respects protocol, agent, and web boundaries
- which later-stage service behavior is still intentionally unimplemented