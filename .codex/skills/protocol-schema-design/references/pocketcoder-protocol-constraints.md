# PocketCoder Protocol Constraints

## Scope

`packages/protocol` is the single shared truth source for cross-runtime contracts. It may define constants, schemas, protocol error codes, protocol-safe helper utilities, and package-level exports. It must not absorb app logic from `web`, `agentd`, or `relay`.

## Envelope Contract

Every protocol envelope must include these top-level fields:

- `protocolVersion`
- `messageId`
- `timestamp`
- `type`
- `payload`

Use `protocolVersion` on every message from day one. Do not create message variants that bypass the common envelope.

## Fixed V1 Message Types

Keep this V1 catalog available unless project documents explicitly changed:

- `PairingInit`
- `PairingConfirm`
- `DeviceRegistered`
- `SessionSummary`
- `SessionSubscribe`
- `SessionOutputDelta`
- `SessionStateChanged`
- `ApprovalRequested`
- `ApprovalResponse`
- `SendPrompt`
- `InterruptSession`
- `ResumeDesktopControl`
- `Ack`
- `ErrorEnvelope`

## Fixed V1 Session Status Values

Keep the session status vocabulary fixed to:

- `idle`
- `running`
- `waiting_input`
- `waiting_approval`
- `error`
- `disconnected`

## Versioning Rule

- Store the current protocol version in a dedicated constant file.
- Make schema-level version validation explicit.
- Evolve payloads by additive change when possible.
- If compatibility would break, update the project documents first and then update the package templates and compatibility tests.

## Idempotency Rule

- Treat `messageId` as mandatory for inbound commands.
- `relay` and `agentd` rely on protocol-level message identity for deduplication.
- Protocol design must not depend on transport-specific retry counters or hidden state.

## Error Contract

- Keep protocol error codes in one dedicated file.
- Use a shared error envelope schema instead of ad hoc error payloads.
- Include enough structure for consumers to distinguish validation errors, authorization errors, duplicate-command errors, session lookup errors, and internal failures.

## High Cohesion / Low Coupling

Preserve these boundaries:

- `constants/` for fixed vocabulary and version identifiers
- `schemas/` for Zod validation and envelope composition
- `errors/` for protocol-visible error codes and error-related shared types
- `utils/` only for lightweight protocol helpers such as message-id generation or normalization
- `tests/` only for protocol-focused verification, not app integration flows

## Structural Errors To Reject

Treat these as design or repair failures:

- importing `web`, `agentd`, or `relay` internals into the protocol package
- placing transport handlers, persistence code, or UI state in `packages/protocol`
- omitting `protocolVersion` from an envelope
- creating duplicate schema definitions outside the shared package
- introducing a second shared package for contract definitions
- exposing unstable internal file paths instead of the stable `src/index.ts` entry