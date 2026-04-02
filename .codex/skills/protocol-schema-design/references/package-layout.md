# Package Layout

Use this file when creating or refactoring `packages/protocol`.

## Required Paths

- `src/constants/`
- `src/schemas/`
- `src/errors/`
- `src/utils/`
- `src/index.ts`
- `tests/schema/`
- `tests/compatibility/`

## Responsibility Split

### `src/constants/`

Store fixed protocol vocabulary only:

- protocol version
- message type list or constants
- session status list or constants

Do not place runtime parsing or app-specific policy here.

### `src/schemas/`

Store all Zod schemas and envelope composition helpers here.

Keep files grouped by protocol concern, for example:

- `envelope.ts` for shared envelope fields and composition helpers
- `pairing.ts` for pairing-related payloads and envelopes
- `session.ts` for session snapshot, subscription, delta, and approval-request payloads
- `command.ts` for inbound control and approval-response payloads
- `error.ts` for error payload and error envelope schemas

### `src/errors/`

Store protocol error codes and shared error-facing types. Keep transport-specific error handling out of this directory.

### `src/utils/`

Keep this directory small. Only include helpers that are protocol-level and portable across runtimes, such as message-id generation or normalization. If a helper depends on relay persistence, browser UI state, or PTY execution, it does not belong here.

### `src/index.ts`

Export the stable public API. Prefer re-exporting files from here instead of asking consumers to import internal paths directly.

### `tests/`

Use `tests/schema/` to guard core schema behavior. Use `tests/compatibility/` to protect additive evolution and prevent accidental breaking changes. These tests should stay focused on protocol contracts, not app integration flows.

## Anti-Patterns

Treat these as layout problems:

- adding `src/web/`, `src/relay/`, or `src/agentd/` folders inside the protocol package
- placing business logic, storage access, or UI state under `src/utils/`
- exporting unstable deep file paths as the only supported integration path
- creating duplicate message definitions outside `src/schemas/`