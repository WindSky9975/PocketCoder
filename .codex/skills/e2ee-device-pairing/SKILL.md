---
name: e2ee-device-pairing
description: Design, create, or repair the PocketCoder pairing and message-level E2EE boundary layer across `apps/agentd`, `apps/relay`, and `apps/web`. Use when Codex needs to bootstrap or fix device-key lifecycle, one-time pairing token flow, public-key exchange boundaries, relay-side device registration and access control, browser-side crypto/storage entry points, or the security shell that keeps relay limited to ciphertext and minimal routing metadata.
---

# E2EE Device Pairing

## Overview

Create or repair only the PocketCoder pairing and E2EE boundary layer. Keep long-lived device keys, one-time pairing tokens, public-key exchange, ciphertext envelopes, relay-side access control, and browser-side paired-device storage behind dedicated security boundaries. Do not mix shared protocol design, PTY execution logic, generic relay transport flow, or page-layout work into this skill.

## Workflow

1. Inspect the current `apps/agentd`, `apps/relay`, and `apps/web` state and decide whether the task is `init`, `repair`, or pairing-security evolution.
2. Read [`references/crypto-constraints.md`](references/crypto-constraints.md) before editing files.
3. Read [`references/pairing-flow.md`](references/pairing-flow.md) when shaping token issuance, public-key exchange, and device registration flow.
4. Read [`references/key-lifecycle.md`](references/key-lifecycle.md) when touching long-lived device keys, browser-device keys, rotation, or revocation.
5. Read [`references/storage-boundaries.md`](references/storage-boundaries.md) when placing relay metadata, replay blobs, device state, or browser-local pairing state.
6. Use `scripts/init_pairing_layers.py` to create or repair the bundled pairing and E2EE skeleton.
7. Use `scripts/verify_pairing_layers.py` after changes to confirm the required files, directories, and security boundaries still hold.
8. If the repo is runnable and the user expects executable output, run minimal checks such as `npm run typecheck` and `npm run test`.

## Rules

- Keep `apps/agentd/src/security/` focused on desktop key material references, pairing token issuance, and encryption entry points.
- Keep `apps/relay/src/security/`, `apps/relay/src/modules/pairing/`, and `apps/relay/src/storage/repositories/` focused on token validation, device registration, access control, and ciphertext-oriented persistence.
- Keep `apps/web/src/lib/crypto/`, `apps/web/src/lib/storage/`, and `apps/web/src/features/pairing/` focused on browser key hooks, paired-device persistence, and pairing-flow composition.
- Keep `packages/protocol` as the only shared contract source; do not define shared message schemas inside this skill's targets.
- Keep relay limited to ciphertext blobs and the minimum routing metadata needed for registration, replay, and access control.
- Do not leak private keys, pairing tokens, or plaintext payloads into repository files, logs, test snapshots, or screenshots.
- Keep high cohesion by separating key lifecycle, token flow, relay security, and browser storage instead of collapsing them into one generic helper.
- Keep low coupling by preventing UI routes, PTY runtime code, and generic transport handlers from owning pairing or cryptography details.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.

## Design Boundary

### Allowed Work

- create or repair pairing and E2EE boundary files across agent, relay, and web
- define long-lived device-key and pairing-token entry points
- define relay-side access-control and registration shells
- define browser-side pairing-controller and device-store shells
- add security-focused test placeholders or minimal helpers inside the owned boundaries

### Forbidden Work

- define shared protocol schemas or message catalogs inside app workspaces
- implement PTY/session runtime flow outside security entry points
- implement generic relay HTTP or WebSocket transport flow that is unrelated to pairing security
- implement App Router pages, layout composition, or mobile UX details
- downgrade the security model to plaintext relay storage or token-only trust without E2EE boundaries

## Resource Use

### `references/crypto-constraints.md`

Read this first whenever a change affects E2EE assumptions, relay plaintext restrictions, metadata retention, or secret-handling rules.

### `references/pairing-flow.md`

Read this when shaping the desktop-to-browser pairing flow, token lifecycle, public-key exchange, or registration handoff.

### `references/key-lifecycle.md`

Read this when defining how desktop and browser key material is created, referenced, revoked, or rotated.

### `references/storage-boundaries.md`

Read this when deciding what relay may store, what browser-local pairing state may persist, and what must never be written down.

### `scripts/init_pairing_layers.py`

Run this for empty-skeleton initialization or structural repair of the pairing and E2EE boundaries.

### `scripts/verify_pairing_layers.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented security constraint.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or pairing-security evolution
- which agent, relay, and web security files were created, updated, skipped, or left in conflict
- whether relay still sees only ciphertext-oriented structures and minimal routing metadata
- which later-stage security behavior remains intentionally unimplemented