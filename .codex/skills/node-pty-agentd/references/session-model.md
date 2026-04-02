# Session Model

Use this file when shaping `apps/agentd/src/sessions`.

## Core Session Record

Keep the session record aligned to:

- `sessionId`
- `provider`
- `status`
- `currentTask`
- `lastActivityAt`

The actual structure may include extra local-only metadata, but those fields are the fixed baseline.

## Responsibility Split

### `session-registry`

Own in-memory or local registration of active session records. Keep it focused on lookup, insert, update, and removal operations.

### `session-manager`

Own runtime orchestration over session lifecycle operations such as create, update, close, or publishing derived changes. It may coordinate registry, provider, and event publishing boundaries.

### `state-machine`

Own allowed status transitions and guard rules. Keep status transition logic explicit instead of spreading it across transport or provider files.

## Update Rules

- update `lastActivityAt` on meaningful session activity
- update `currentTask` only through explicit state-aware operations
- keep status transitions explicit and observable
- avoid hidden mutation from transport or platform hooks

## Anti-Patterns

Treat these as model problems:

- relay-client mutating session state directly
- parser code owning registry storage concerns
- Windows platform hooks bypassing the state machine
- CLI commands writing arbitrary session fields without manager or registry boundaries