---
name: protocol-schema-design
description: Design or repair the PocketCoder shared protocol layer in `packages/protocol`. Use when Codex needs to define or update envelopes, message schemas, session status enums, error codes, protocol exports, compatibility boundaries, or the package layout that keeps `web`, `agentd`, and `relay` aligned to one shared contract source.
---

# Protocol Schema Design

## Overview

Design or repair only the shared protocol contract for PocketCoder V1. Keep the protocol package cohesive around transport-safe contracts and schema validation. Do not mix in UI logic, relay persistence logic, PTY behavior, or encryption implementation details.

## Workflow

1. Inspect the current `packages/protocol` state and determine whether the task is `init`, `repair`, or schema evolution.
2. Read [`references/pocketcoder-protocol-constraints.md`](references/pocketcoder-protocol-constraints.md) before changing any protocol shape.
3. Read [`references/message-catalog.md`](references/message-catalog.md) when deciding whether a message is a command, event, pairing message, ack, or error.
4. Read [`references/package-layout.md`](references/package-layout.md) when placing files under `constants/`, `schemas/`, `errors/`, `utils/`, and `tests/`.
5. Use `scripts/init_protocol_package.py` to create or repair the package skeleton from the bundled templates.
6. Use `scripts/verify_protocol_contracts.py` after edits to confirm the required files, exports, and structural boundaries still hold.
7. If the repo is runnable and the user expects executable output, run the minimal package checks such as `npm run typecheck` and `npm run test`.

## Rules

- Keep `packages/protocol` as the only cross-runtime shared contract package.
- Put only protocol-level constants, Zod schemas, error codes, and protocol-specific helpers in this package.
- Keep high cohesion: group files by protocol responsibility, not by app or transport implementation.
- Keep low coupling: do not import `web`, `agentd`, or `relay` internals into the protocol package.
- Require every envelope to include `protocolVersion`, `messageId`, `timestamp`, `type`, and `payload`.
- Preserve the fixed V1 message catalog and session-status vocabulary unless the project documents changed.
- Treat inbound command idempotency as a protocol concern: `messageId` is mandatory for commands.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.
- Keep exports stable through `src/index.ts`; do not force consumers to import deep internal paths unless there is a deliberate reason.

## Design Boundary

### Allowed Work

- define or adjust envelope contracts
- define or adjust message schemas and shared types
- define or adjust session status values and error codes
- repair the package layout and export surface
- add compatibility-focused tests or placeholders under `tests/`

### Forbidden Work

- implement relay routing, storage, or HTTP/WebSocket handlers
- implement desktop PTY lifecycle or session execution logic
- implement browser pages, view state, or device-local storage flows
- encode application-specific authorization or encryption algorithms into the protocol layer

## Resource Use

### `references/pocketcoder-protocol-constraints.md`

Read this first whenever message shape, versioning, idempotency, or error semantics are involved.

### `references/message-catalog.md`

Read this when adding a new message or deciding where an existing message belongs.

### `references/package-layout.md`

Read this when choosing file placement or evaluating whether a helper belongs in `utils/` versus app code.

### `scripts/init_protocol_package.py`

Run this for empty-package initialization or structural repair of `packages/protocol`.

### `scripts/verify_protocol_contracts.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented project rule.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or schema evolution
- which protocol files were created, updated, skipped, or left in conflict
- whether the fixed V1 message catalog and session status set still hold
- which later-stage concerns remain outside the protocol package on purpose