---
name: node-pty-agentd
description: Design, create, or repair the PocketCoder `apps/agentd` desktop agent for the Node.js CLI daemon and PTY-provider shell. Use when Codex needs to bootstrap or fix the CLI entry, `codex` provider boundaries, PTY output parsing flow, local session registry and state machine, relay transport shell, or the desktop-side runtime structure that remains the local source of truth for session execution.
---

# Node PTY Agentd

## Overview

Create or repair only the PocketCoder desktop-agent shell in `apps/agentd`. Keep PTY-provider code, session management, relay transport, security hooks, platform hooks, and infrastructure boundaries cleanly separated. Do not mix protocol design, relay-service logic, browser logic, or deep Windows/platform implementation into this workspace.

## Workflow

1. Inspect the current `apps/agentd` state and decide whether the task is `init`, `repair`, or agent-structure evolution.
2. Read [`references/agentd-constraints.md`](references/agentd-constraints.md) before editing files.
3. Read [`references/provider-flow.md`](references/provider-flow.md) when shaping `providers/codex/` PTY and parsing boundaries.
4. Read [`references/session-model.md`](references/session-model.md) when shaping session registry, manager, or state transitions.
5. Read [`references/transport-contracts.md`](references/transport-contracts.md) when editing relay communication boundaries.
6. Use `scripts/init_agentd_service.py` to create or repair the agent skeleton from the bundled templates.
7. Use `scripts/verify_agentd_service.py` after changes to confirm the required files, directories, and boundaries still hold.
8. If the repo is runnable and the user expects executable output, run minimal checks such as `npm run typecheck` and `npm run test`.

## Rules

- Keep `apps/agentd` focused on local process lifecycle, session state, command handling, and outbound relay communication.
- Keep `packages/protocol` as the only shared contract source.
- Keep high cohesion by grouping code into `cli`, `providers`, `sessions`, `transport`, `security`, `platform`, and `infra`.
- Keep low coupling by preventing PTY, session state, transport, and platform hooks from collapsing into one file or one layer.
- Treat `agentd` as the local source of truth for active sessions and process state.
- Keep security and Windows-specific capabilities behind stable boundaries; do not scatter those concerns through CLI or provider internals.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.
- Keep the bootstrap path centralized through `src/bootstrap.ts` and `src/cli/index.ts`.

## Design Boundary

### Allowed Work

- create or repair the `apps/agentd` service shell
- define PTY-provider, parser, and session-adapter boundaries
- define session-manager, registry, and state-machine shells
- define relay-client, command-handler, and event-publisher shells
- define security, Windows-platform, and infra entry points without deep implementation
- add agent-focused tests or placeholders under `tests/`

### Forbidden Work

- define shared protocol schemas or message catalogs inside `apps/agentd`
- implement relay service routing, HTTP, or WebSocket server logic
- implement browser pages, device-local UI state, or PWA behavior
- embed deep E2EE implementation details into the runtime shell
- embed deep Windows input-recovery implementation details into general runtime code

## Resource Use

### `references/agentd-constraints.md`

Read this first whenever a change affects the agent scope, local-source-of-truth rules, or Windows-first assumptions.

### `references/provider-flow.md`

Read this when shaping PTY startup, stream capture, parser boundaries, or provider-to-session handoff.

### `references/session-model.md`

Read this when defining session records, status transitions, registry responsibilities, or activity updates.

### `references/transport-contracts.md`

Read this when editing relay-client, command handling, or event publishing boundaries.

### `scripts/init_agentd_service.py`

Run this for empty-service initialization or structural repair of `apps/agentd`.

### `scripts/verify_agentd_service.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented agent constraint.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or agent evolution
- which agent files were created, updated, skipped, or left in conflict
- whether PTY, session, transport, security, and platform boundaries remain cleanly separated
- which later-stage desktop-agent behavior remains intentionally unimplemented