---
name: windows-desktop-control
description: Design, create, or repair the PocketCoder Windows local-control recovery and remote-control invalidation layer in `apps/agentd/src/platform/windows/`. Use when Codex needs to bootstrap or fix Windows input-recovery detection, local desktop takeover handling, `input.resumeDesktopControl` platform entry points, or the platform shell that reports remote-control invalidation back to session and transport boundaries without leaking Windows logic into PTY or UI layers.
---

# Windows Desktop Control

## Overview

Create or repair only the PocketCoder Windows desktop-control boundary in `apps/agentd/src/platform/windows/`. Keep local-input detection, local-control recovery state, and remote-control invalidation hooks inside the Windows platform layer. Do not move platform detection into session state machines, transport handlers, protocol definitions, or browser UI code.

## Workflow

1. Inspect the current `apps/agentd/src/platform/windows/` state and decide whether the task is `init`, `repair`, or Windows-control evolution.
2. Read [`references/windows-control-constraints.md`](references/windows-control-constraints.md) before editing files.
3. Read [`references/control-flow.md`](references/control-flow.md) when shaping release-control commands, local-input recovery, and remote-command blocking flow.
4. Read [`references/platform-boundaries.md`](references/platform-boundaries.md) when deciding what Windows code may know about sessions, transport, providers, or protocol.
5. Read [`references/state-propagation.md`](references/state-propagation.md) when defining how platform events notify session and event-publishing layers.
6. Use `scripts/init_windows_control.py` to create or repair the Windows control skeleton from the bundled templates.
7. Use `scripts/verify_windows_control.py` after changes to confirm the required files, directories, and platform boundaries still hold.
8. If the repo is runnable and the user expects executable output, run minimal checks such as `npm run typecheck` and `npm run test`.

## Rules

- Keep Windows-only input recovery logic inside `apps/agentd/src/platform/windows/`.
- Treat `agentd` as the local source of truth. A confirmed local desktop takeover must invalidate remote control for the current session.
- Keep `input.resumeDesktopControl` and detected local keyboard recovery aligned under the same local-control-recovered semantics.
- Keep high cohesion by separating the detector, control-state model, and desktop-control wiring instead of hiding everything in one file.
- Keep low coupling by exposing stable outputs to sessions or transport without embedding their implementation details into the platform layer.
- Do not add macOS or Linux behavior here.
- Do not implement PTY parsing, shared protocol schemas, pairing/E2EE logic, or browser UI behavior in this skill.
- Prefer non-destructive repair. Report conflicts instead of overwriting implementation files unless overwrite was requested.

## Design Boundary

### Allowed Work

- create or repair `platform/windows` files and directories
- define local-input detector entry points
- define local-control recovery state shells
- define Windows platform wiring that notifies the rest of agentd about control invalidation
- add minimal platform-focused test placeholders inside the Windows boundary

### Forbidden Work

- implement PTY provider or session-state-machine internals
- define shared protocol messages inside the platform layer
- implement pairing, key lifecycle, or relay-service behavior
- implement page-level release-control UX or web/mobile interaction details
- turn the Windows layer into a generic cross-platform abstraction for non-V1 targets

## Resource Use

### `references/windows-control-constraints.md`

Read this first whenever a change affects Windows scope, local-input recovery, or remote-control invalidation rules.

### `references/control-flow.md`

Read this when shaping command-driven release control, local keyboard takeover, and command blocking semantics.

### `references/platform-boundaries.md`

Read this when deciding how the Windows layer may talk to sessions, transport, providers, or protocol-adjacent code.

### `references/state-propagation.md`

Read this when defining platform event payloads, ordering, or notification boundaries.

### `scripts/init_windows_control.py`

Run this for empty-skeleton initialization or structural repair of `apps/agentd/src/platform/windows/`.

### `scripts/verify_windows_control.py`

Run this after creation or refactor. Treat errors as structural blockers. Treat warnings as follow-up cleanup unless they violate a documented platform constraint.

## Output Expectations

After using this skill, report:

- whether the task was `init`, `repair`, or Windows-control evolution
- which platform files were created, updated, skipped, or left in conflict
- whether Windows detection and recovery logic remain isolated from PTY, transport, and UI layers
- which later-stage Windows behavior remains intentionally unimplemented