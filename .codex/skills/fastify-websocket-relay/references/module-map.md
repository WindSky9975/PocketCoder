# Module Map

Use this file when deciding where relay code should live.

## `modules/pairing`

Own pairing flow orchestration at the service level:

- validate pairing-token lookup flow boundaries
- coordinate device registration at a service boundary
- hand off persistence to repositories and message validation to protocol schemas

## `modules/devices`

Own device metadata and revoked-device service behavior:

- fetch or update registered device metadata
- expose device-oriented relay decisions without leaking storage details

## `modules/sessions`

Own session route and subscription orchestration:

- map session ids to current upstream connection or route metadata
- coordinate subscription registration
- hand off persistence to repositories

## `modules/replay`

Own replay-window orchestration:

- fetch recent encrypted event blobs by session and time window
- keep replay policy separate from raw storage access

## `modules/presence`

Own heartbeats and online-state service behavior:

- update connection last-seen timestamps
- coordinate presence snapshots for connected devices or sessions

## `transport/http`

Own HTTP entry points only:

- health checks
- pairing bootstrap requests
- any non-realtime request adaptation needed by relay

Keep request parsing thin and defer service logic to modules or security/storage boundaries.

## `transport/ws`

Own WebSocket entry points only:

- connection bootstrap and auth gating
- message ingress/egress adaptation
- heartbeat and connection cleanup hooks

## `security`

Own token, access-control, and device-registry boundaries. Do not place relay session routing or replay policy here.

## `storage`

Own SQLite connection, migration, and repository concerns. Keep this layer ignorant of HTTP/WebSocket specifics.

## `infra`

Own configuration and logging. Do not pile domain logic into infra helpers.