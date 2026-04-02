# Windows Control Constraints

## Scope

This skill owns the Windows-first local-control recovery layer for PocketCoder V1. It exists only to detect when the desktop side reclaims control and to invalidate remote control for the affected session.

## Fixed Platform Direction

Keep the platform layer aligned to these choices:

- Windows is the only in-scope desktop platform for V1
- `agentd` remains the local source of truth for control state
- confirmed local keyboard recovery means remote control is no longer valid for that session
- explicit release-control commands and local input recovery must converge on the same recovered-control semantics

## Boundary Rules

Preserve these boundaries:

- `platform/windows/` owns input-detection entry points and Windows-specific state helpers
- `sessions/` may consume platform notifications but must not re-implement Windows detection
- `transport/` may publish invalidation events but must not detect local input itself
- `providers/` and PTY code must not own desktop-control recovery logic

## Structural Errors To Reject

Treat these as platform-boundary failures:

- Windows input hooks implemented directly in session or transport modules
- generic remote-command handlers deciding local-control recovery without a platform event
- platform code that imports browser or relay implementation details
- cross-platform abstractions that dilute the Windows-first V1 boundary before they are needed