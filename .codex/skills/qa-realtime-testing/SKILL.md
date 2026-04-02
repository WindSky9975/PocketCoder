---
name: qa-realtime-testing
description: Design, create, or repair the PocketCoder test structure and high-risk regression coverage across `packages/protocol`, `apps/relay`, `apps/agentd`, and `apps/web`. Use when Codex needs to bootstrap or fix schema tests, WebSocket integration tests, pairing and replay regressions, PWA smoke coverage, workspace-local test directories, or the verification shell that proves the realtime main flow still works.
---

# QA Realtime Testing

## Overview

Create or repair only the PocketCoder test-layer skeleton and regression boundaries. Keep tests colocated with each workspace, distinguish unit, integration, smoke, and regression intent clearly, and prioritize the realtime main flow over coverage vanity metrics.

## Workflow

1. Inspect the current test layout across `packages/protocol`, `apps/relay`, `apps/agentd`, and `apps/web` and decide whether the task is `init`, `repair`, or test-coverage evolution.
2. Read [`references/test-constraints.md`](references/test-constraints.md) before editing files.
3. Read [`references/scenario-matrix.md`](references/scenario-matrix.md) when shaping pairing, realtime, replay, approval, reconnect, and dedupe coverage.
4. Read [`references/workspace-test-map.md`](references/workspace-test-map.md) when deciding which workspace owns a test.
5. Read [`references/regression-checklist.md`](references/regression-checklist.md) when a change touches high-risk boundaries.
6. Use `scripts/init_test_layers.py` to create or repair the bundled test skeleton.
7. Use `scripts/verify_test_layers.py` after changes to confirm the required files, directories, and regression placeholders still hold.
8. If the repo is runnable and the user expects executable output, run the minimum gates such as `npm run lint`, `npm run typecheck`, and `npm run test`.

## Rules

- Keep tests inside their owning workspace; do not create a detached test workspace.
- Keep `packages/protocol` focused on schema and compatibility coverage.
- Keep `apps/relay` focused on realtime routing, replay windows, pairing entry points, and dedupe coverage.
- Keep `apps/agentd` focused on state transitions, command handling, event flow, and local-control invalidation coverage.
- Keep `apps/web` focused on unit coverage for browser-side helpers and smoke coverage for the main PWA route flow.
- Keep high cohesion by separating unit, integration, and smoke concerns instead of mixing all scenarios into one folder.
- Keep low coupling by testing public boundaries and stable interfaces instead of private implementation details.
- Do not fake test results, skip critical regressions silently, or treat unverified assumptions as passing coverage.
- Do not place real secrets, private keys, raw tokens, or sensitive logs in fixtures or snapshots.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.

## Design Boundary

### Allowed Work

- create or repair workspace-local test directories and placeholder tests
- define regression placeholders for pairing, replay, dedupe, approval, reconnect, and desktop-control invalidation
- define smoke placeholders for the core PWA route flow
- define compatibility and schema placeholders for the protocol package
- add test-focused helper directories only when they serve the documented test structure

### Forbidden Work

- implement the underlying business logic just to satisfy placeholder tests
- move business code into test files or fixtures
- create a separate monolithic test workspace outside the owning packages
- introduce sensitive fixture data or misleading fake validation records
- replace regression coverage with only screenshots, manual notes, or unverified claims

## Resource Use

### `references/test-constraints.md`

Read this first whenever a change affects quality gates, fixture safety, or baseline automation requirements.

### `references/scenario-matrix.md`

Read this when shaping coverage for the main realtime flow and its failure cases.

### `references/workspace-test-map.md`

Read this when deciding where a new test belongs.

### `references/regression-checklist.md`

Read this when a change touches protocol, pairing, replay, reconnect, idempotency, approval, or desktop-control recovery.

### `scripts/init_test_layers.py`

Run this for empty-skeleton initialization or structural repair of the test layers.

### `scripts/verify_test_layers.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented quality constraint.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or test evolution
- which workspace test files were created, updated, skipped, or left in conflict
- whether unit, integration, smoke, and regression coverage remain cleanly separated
- which later-stage executable tests are still intentionally placeholders