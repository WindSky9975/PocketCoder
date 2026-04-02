# Provider Flow

Use this file to keep PTY and provider boundaries consistent.

## Startup Flow

1. CLI or runtime bootstrap decides the requested operation
2. bootstrap resolves config and runtime dependencies
3. provider adapter creates or acquires a PTY-backed `codex` process shell
4. provider shell starts stream capture and hands output to the parser boundary
5. provider adapter emits normalized provider events into session-management or publishing boundaries

## PTY Output Flow

1. PTY emits raw output chunks
2. provider PTY wrapper normalizes the raw output stream
3. parser boundary interprets output into structured provider events
4. session adapter maps provider events into session-model updates and protocol-facing event categories
5. event publisher forwards the normalized event surface outward

## Approval And State Change Boundary

- provider parsing may detect approval-needed or state-change signals
- session state machine owns status transition logic
- event publisher owns outbound protocol-facing event emission
- provider code must not own relay transport policy directly

## Separation Rules

- PTY startup belongs in `codex-pty.ts`
- output interpretation belongs in `codex-parser.ts`
- provider-to-session mapping belongs in `codex-session-adapter.ts`
- provider files must not become the home of session-registry storage or relay-client logic