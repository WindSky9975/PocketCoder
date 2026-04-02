# Agentd Constraints

## Scope

`apps/agentd` is the desktop-side runtime shell for PocketCoder V1. It starts and supervises the real `codex` process through PTY integration, owns local session truth, translates provider output into protocol-level events, and sends or receives protocol-framed messages through relay communication boundaries.

## Fixed Technical Direction

Keep the desktop agent aligned to these choices:

- Node.js CLI daemon shape
- no tray UI and no GUI shell in V1
- real `codex` process execution through PTY
- Windows-first runtime assumptions
- `@pocketcoder/protocol` as the only shared contract source

## Local Source Of Truth

Agentd owns:

- process lifecycle
- local session registry
- session state updates
- current task tracking
- last activity tracking
- command idempotency handling on the desktop side

Relay does not replace the desktop runtime as the source of truth for active session behavior.

## Required Session Model

The runtime must preserve a unified session model including:

- `sessionId`
- `provider`
- `status`
- `currentTask`
- `lastActivityAt`

## Required Event Surface

The runtime shell must leave room for these event categories:

- `session.started`
- `session.output.delta`
- `session.state.changed`
- `session.approval.requested`
- `session.error`
- `session.ended`

## Required Command Surface

The runtime shell must leave room for inbound commands such as:

- send prompt
- approval response
- interrupt session
- resume desktop control
- session list
- session subscribe

## High Cohesion / Low Coupling

Preserve these boundaries:

- `cli/` for CLI bootstrap and command parsing
- `providers/codex/` for PTY, parsing, and provider-specific adaptation
- `sessions/` for session registry and state transitions
- `transport/` for relay communication boundaries
- `security/` for key, pairing, and encryption entry points only
- `platform/windows/` for Windows-specific control hooks only
- `infra/` for config, logging, and paths

## Structural Errors To Reject

Treat these as design failures:

- embedding relay server logic inside `apps/agentd`
- embedding protocol schema definitions locally in agentd
- scattering Windows-specific logic through provider or transport files
- collapsing PTY process control and session-state mutation into one unbounded file
- introducing `web` or `relay` implementation imports into the agent workspace