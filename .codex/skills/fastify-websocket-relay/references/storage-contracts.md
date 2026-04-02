# Storage Contracts

Use this file when shaping `apps/relay/src/storage`.

## SQLite Boundary

`storage/sqlite.ts` owns SQLite bootstrap and lifecycle for the relay shell. Keep raw database connection setup here or behind helpers it owns.

## Migrations

`storage/migrations/` exists for schema evolution. Even when empty in the initial shell, keep the directory present so future migration work does not leak into runtime folders.

## Repositories

`storage/repositories/` owns persistence access boundaries. At minimum, the service design should reserve repository space for:

- devices
- pairing tokens
- session routes
- replay events
- command deduplication
- presence or heartbeat metadata

The exact file split may evolve, but transport handlers should not bypass the repository boundary.

## Minimal Metadata Rule

Store only the metadata relay needs to route and recover:

- ids
- timestamps
- route keys
- token metadata
- encrypted blobs
- revocation markers
- deduplication markers

Do not persist long-lived plaintext session content as part of the normal relay shell.

## Anti-Patterns

Treat these as storage design problems:

- SQL calls embedded in HTTP or WebSocket handlers
- replay logic that assumes plaintext content access
- migrations mixed into runtime transport modules
- repositories that import browser or desktop-specific implementation code