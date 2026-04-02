# Relay Constraints

## Scope

`apps/relay` is the weak-logic service tier for PocketCoder V1. It exists to register devices, manage connections, forward encrypted protocol traffic, track online state, replay recent encrypted events, and deduplicate incoming commands. It must not become the source of truth for AI session execution.

## Fixed Technical Direction

Keep the relay service aligned to these choices:

- Fastify for the service shell
- WebSocket for the primary realtime channel
- SQLite for minimal metadata and replay storage
- `@pocketcoder/protocol` for all shared message contracts

## What Relay May Store

Keep storage minimal:

- device identity metadata
- pairing tokens
- session route metadata
- heartbeats and presence timestamps
- TTL-limited encrypted event blobs
- revoked-device markers
- processed-command deduplication records

Relay must not store durable plaintext session transcripts as a normal service responsibility.

## Service Boundary

Relay may:

- validate inbound edges against shared protocol schemas
- manage authenticated connections and subscriptions
- route encrypted payloads to the correct destination
- replay recent encrypted events by session and time window
- expose health and pairing-related HTTP entry points

Relay must not:

- run `codex` or other AI sessions
- parse desktop PTY output as business logic
- duplicate protocol schema definitions locally
- own browser or desktop-side device-key workflows

## High Cohesion / Low Coupling

Preserve these boundaries:

- `transport/http` only for HTTP entry points and request adaptation
- `transport/ws` only for WebSocket connection lifecycle and message adaptation
- `modules/` for domain-specific relay orchestration such as pairing, sessions, replay, and presence
- `security/` for token, access-control, and device-registration boundaries
- `storage/` for SQLite, migrations, and repositories
- `infra/` for config and logging

## Structural Errors To Reject

Treat these as relay design failures:

- embedding protocol definitions in `apps/relay`
- calling SQLite directly from transport handlers without a repository or storage boundary
- introducing `web`, `agentd`, or `protocol` implementation details into relay-local folders
- parsing or persisting plaintext AI session content as relay business logic
- mixing deployment artifacts or Docker orchestration into the relay source tree